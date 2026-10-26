import { useMemo } from 'react';
import type { Key } from 'react';

import { useLatestFunc } from './hooks';
import { assertIsValidKeyGetter, getLeftRightKey } from './utils';
import type {
  CellClipboardEvent,
  CellCopyArgs,
  CellKeyboardEvent,
  CellKeyDownArgs,
  CellPasteArgs,
  Column,
  GroupRow,
  Maybe,
  Omit,
  RenderRowProps,
  RowHeightArgs,
  RowsChangeData
} from './types';
import { renderToggleGroup } from './cellRenderers';
import { SELECT_COLUMN_KEY } from './Columns';
import { DataGrid } from './DataGrid';
import type { DataGridProps } from './DataGrid';
import { useRenderers } from './DataGridRenderersContext';
import GroupedRow from './GroupedRow';
import { defaultRenderRow } from './Row';

export interface TreeDataGridProps<R, SR = unknown, K extends Key = Key> extends Omit<
  DataGridProps<R, SR, K>,
  'columns' | 'role' | 'aria-rowcount' | 'rowHeight' | 'onFill' | 'isRowSelectionDisabled'
> {
  columns: readonly Column<NoInfer<R>, NoInfer<SR>>[];
  rowHeight?: Maybe<number | ((args: RowHeightArgs<NoInfer<R>>) => number)>;
  groupBy: readonly string[];
  getRowGroupKey?: Maybe<(row: NoInfer<R>, columnKey: string) => string>;
  expandedGroupIds: ReadonlySet<unknown>;
  onExpandedGroupIdsChange: (expandedGroupIds: Set<unknown>) => void;
  getGroupId?: Maybe<(groupKey: string, parentId?: string) => string>;
}

interface PartialGroupRow<TRow> {
  // `undefined` for the groups on the last level, which only contain rows
  readonly groups: GroupsMap<TRow> | undefined;
  // all the descendant rows of the group, not just the direct children
  readonly childRows: readonly TRow[];
  readonly startRowIndex: number;
}

type GroupsMap<TRow> = ReadonlyMap<string, PartialGroupRow<TRow>>;

// only used while the rows are being grouped
interface MutablePartialGroupRow<TRow> {
  readonly groups: MutableGroupsMap<TRow> | undefined;
  readonly childRows: TRow[];
  startRowIndex: number;
}

type MutableGroupsMap<TRow> = Map<string, MutablePartialGroupRow<TRow>>;

interface GroupedRows<TRow> {
  readonly groups: GroupsMap<TRow> | undefined;
  readonly rowsCount: number;
}

interface FlattenedRows<TRow> {
  readonly rows: readonly (TRow | GroupRow<TRow>)[];
  // indexes of the group rows in `rows`, in ascending order
  readonly groupRowIndexes: readonly number[];
}

// Group rows are only ever created by `TreeDataGrid`, so every instance can share a single
// set, which keeps `isGroupRow` stable and out of the dependency arrays below
const allGroupRows = new WeakSet<object>();

function isGroupRow<TRow>(row: TRow | GroupRow<TRow>): row is GroupRow<TRow> {
  return typeof row === 'object' && row !== null && allGroupRows.has(row);
}

export function TreeDataGrid<R, SR = unknown, K extends Key = Key>({
  columns: rawColumns,
  rows: rawRows,
  rowHeight: rawRowHeight,
  rowKeyGetter: rawRowKeyGetter,
  onCellKeyDown: rawOnCellKeyDown,
  onCellCopy: rawOnCellCopy,
  onCellPaste: rawOnCellPaste,
  onRowsChange,
  selectedRows: rawSelectedRows,
  onSelectedRowsChange: rawOnSelectedRowsChange,
  renderers,
  groupBy: rawGroupBy,
  getRowGroupKey: rawGetRowGroupKey,
  expandedGroupIds,
  onExpandedGroupIdsChange,
  getGroupId: rawGetGroupId,
  ...props
}: TreeDataGridProps<R, SR, K>) {
  const contextRenderers = useRenderers<R, SR>();
  const rawRenderRow = renderers?.renderRow ?? contextRenderers?.renderRow ?? defaultRenderRow;
  const headerAndTopSummaryRowsCount = 1 + (props.topSummaryRows?.length ?? 0);
  const { leftKey, rightKey } = getLeftRightKey(props.direction);
  const toggleGroupLatest = useLatestFunc(toggleGroup);
  const getRowGroupKey = rawGetRowGroupKey ?? defaultGetRowGroupKey;
  const getGroupId = rawGetGroupId ?? defaultGetGroupId;

  const { columns, groupBy } = useMemo(() => {
    const columns = rawColumns.toSorted(({ key: aKey }, { key: bKey }) => {
      // Sort select column first:
      if (aKey === SELECT_COLUMN_KEY) return -1;
      if (bKey === SELECT_COLUMN_KEY) return 1;

      // Sort grouped columns second, following the groupBy order:
      if (rawGroupBy.includes(aKey)) {
        if (rawGroupBy.includes(bKey)) {
          return rawGroupBy.indexOf(aKey) - rawGroupBy.indexOf(bKey);
        }
        return -1;
      }
      if (rawGroupBy.includes(bKey)) return 1;

      // Sort other columns last:
      return 0;
    });

    const groupBy: string[] = [];
    for (const [index, column] of columns.entries()) {
      if (rawGroupBy.includes(column.key)) {
        groupBy.push(column.key);
        columns[index] = {
          ...column,
          frozen: true,
          renderCell: () => null,
          renderGroupCell: column.renderGroupCell ?? renderToggleGroup,
          editable: false
        };
      }
    }

    return { columns, groupBy };
  }, [rawColumns, rawGroupBy]);

  // Grouping only depends on the rows, it is not affected by the expanded state
  const { groups, rowsCount } = useMemo((): GroupedRows<R> => {
    if (groupBy.length === 0) return { groups: undefined, rowsCount: rawRows.length };

    // Group the rows in a single pass, each row is added to every group it belongs to
    const groups: MutableGroupsMap<R> = new Map();
    const lastLevel = groupBy.length - 1;

    for (const row of rawRows) {
      let parentGroups = groups;

      for (let level = 0; level <= lastLevel; level++) {
        const groupKey = getRowGroupKey(row, groupBy[level]);
        // `getOrInsertComputed` would be slower: V8 doesn't inline it like `get`,
        // and its callback would be created for every row
        let group = parentGroups.get(groupKey);
        if (group === undefined) {
          group = {
            // the groups on the last level don't need a map, which saves one per group
            groups: level === lastLevel ? undefined : new Map(),
            childRows: [],
            startRowIndex: 0
          };
          parentGroups.set(groupKey, group);
        }
        group.childRows.push(row);
        if (group.groups !== undefined) {
          parentGroups = group.groups;
        }
      }
    }

    // Number the groups as if they were all expanded, and return the total number of rows.
    // Neither depends on the expanded state, so collapsed groups never have to be traversed
    // when the rows are flattened.
    function setStartRowIndexes(groups: MutableGroupsMap<R>, startRowIndex: number): number {
      let groupRowsCount = 0;

      for (const group of groups.values()) {
        group.startRowIndex = startRowIndex + groupRowsCount;
        groupRowsCount++; // 1 for the group row
        groupRowsCount +=
          group.groups === undefined
            ? // the group is on the last level, it only contains rows
              group.childRows.length
            : setStartRowIndexes(group.groups, startRowIndex + groupRowsCount);
      }

      return groupRowsCount;
    }

    const rowsCount = setStartRowIndexes(groups, 0);

    return { groups, rowsCount };
  }, [getRowGroupKey, groupBy, rawRows]);

  const { rows, groupRowIndexes } = useMemo((): FlattenedRows<R> => {
    if (groups === undefined) {
      return { rows: rawRows, groupRowIndexes: [] };
    }

    const flattenedRows: (R | GroupRow<R>)[] = [];
    const groupRowIndexes: number[] = [];

    // Only the expanded groups are traversed
    function expandGroups(groups: GroupsMap<R>, parentId: string | undefined, level: number): void {
      let posInSet = 0;

      for (const [groupKey, group] of groups) {
        // destructuring in the loop head would stop React Compiler from compiling the component
        const { groups: childGroups, childRows, startRowIndex } = group;
        const id = getGroupId(groupKey, parentId);
        const isExpanded = expandedGroupIds.has(id);

        const groupRow: GroupRow<R> = {
          id,
          parentId,
          groupKey,
          isExpanded,
          childRows,
          level,
          posInSet: posInSet++,
          setSize: groups.size,
          startRowIndex
        };
        groupRowIndexes.push(flattenedRows.length);
        flattenedRows.push(groupRow);
        allGroupRows.add(groupRow);

        if (isExpanded) {
          if (childGroups === undefined) {
            // the group is on the last level, it only contains rows.
            // Push them one by one: spreading them would throw in groups with too many rows
            for (const row of childRows) {
              flattenedRows.push(row);
            }
          } else {
            expandGroups(childGroups, id, level + 1);
          }
        }
      }
    }

    expandGroups(groups, undefined, 0);

    return { rows: flattenedRows, groupRowIndexes };
  }, [expandedGroupIds, getGroupId, groups, rawRows]);

  const rowHeight = useMemo(() => {
    if (typeof rawRowHeight === 'function') {
      return (row: R | GroupRow<R>): number => {
        if (isGroupRow(row)) {
          return rawRowHeight({ type: 'GROUP', row });
        }
        return rawRowHeight({ type: 'ROW', row });
      };
    }

    return rawRowHeight;
  }, [rawRowHeight]);

  // Without rawRowKeyGetter, the keys are computed in renderRow, where the row index is known
  const rowKeyGetter = useMemo(() => {
    if (typeof rawRowKeyGetter !== 'function') return undefined;
    return (row: R | GroupRow<R>) => (isGroupRow(row) ? row.id : rawRowKeyGetter(row));
  }, [rawRowKeyGetter]);

  const selectedRows = useMemo((): Maybe<ReadonlySet<Key>> => {
    if (rawSelectedRows == null) return null;

    assertIsValidKeyGetter<R, K>(rawRowKeyGetter);

    const selectedRows = new Set<Key>(rawSelectedRows);
    for (const row of rows) {
      if (isGroupRow(row)) {
        // select parent row if all the children are selected
        const isGroupRowSelected = row.childRows.every((cr) =>
          rawSelectedRows.has(rawRowKeyGetter(cr))
        );
        if (isGroupRowSelected) {
          selectedRows.add(row.id);
        }
      }
    }

    return selectedRows;
  }, [rawRowKeyGetter, rawSelectedRows, rows]);

  function onSelectedRowsChange(newSelectedRows: Set<Key>) {
    if (!rawOnSelectedRowsChange) return;

    assertIsValidKeyGetter<R, K>(rawRowKeyGetter);

    const newRawSelectedRows = new Set(rawSelectedRows);
    for (const row of rows) {
      const key = isGroupRow(row) ? row.id : rawRowKeyGetter(row);
      if (selectedRows?.has(key) && !newSelectedRows.has(key)) {
        if (isGroupRow(row)) {
          // unselect all children if the parent row is unselected
          for (const cr of row.childRows) {
            newRawSelectedRows.delete(rawRowKeyGetter(cr));
          }
        } else {
          newRawSelectedRows.delete(key as K);
        }
      } else if (!selectedRows?.has(key) && newSelectedRows.has(key)) {
        if (isGroupRow(row)) {
          // select all children if the parent row is selected
          for (const cr of row.childRows) {
            newRawSelectedRows.add(rawRowKeyGetter(cr));
          }
        } else {
          newRawSelectedRows.add(key as K);
        }
      }
    }

    rawOnSelectedRowsChange(newRawSelectedRows);
  }

  function getParentRowAndIndex(rowIdx: number) {
    const row = rows[rowIdx];

    // binary search for the position of the last group row before the row
    let low = 0;
    let high = groupRowIndexes.length - 1;
    let position = -1;
    while (low <= high) {
      const middle = (low + high) >>> 1;
      if (groupRowIndexes[middle] < rowIdx) {
        position = middle;
        low = middle + 1;
      } else {
        high = middle - 1;
      }
    }

    // a row's parent is the closest group row before it,
    // a group row's parent is the closest group row before it whose id is its parentId
    for (let i = position; i >= 0; i--) {
      const parentIdx = groupRowIndexes[i];
      const parentRow = rows[parentIdx] as GroupRow<R>;
      if (!isGroupRow(row) || row.parentId === parentRow.id) {
        return [parentRow, parentIdx] as const;
      }
    }

    return undefined;
  }

  function handleKeyDown(args: CellKeyDownArgs<R, SR>, event: CellKeyboardEvent) {
    rawOnCellKeyDown?.(args, event);
    if (event.isGridDefaultPrevented()) return;

    if (args.mode === 'EDIT') return;
    const { column, rowIdx, setActivePosition } = args;
    const idx = column?.idx ?? -1;
    const row = rows[rowIdx];

    if (!isGroupRow(row)) return;
    if (
      idx === -1 &&
      // Collapse the current group row if it is focused and expanded
      ((event.key === leftKey && row.isExpanded) ||
        // Expand the current group row if it is focused and collapsed
        (event.key === rightKey && !row.isExpanded))
    ) {
      // prevent scrolling
      event.preventDefault();
      event.preventGridDefault();
      toggleGroup(row.id);
    }

    // If a group row is focused, and it is collapsed, move to the parent group row (if there is one).
    if (idx === -1 && event.key === leftKey && !row.isExpanded && row.level !== 0) {
      const parentRowAndIndex = getParentRowAndIndex(rowIdx);
      if (parentRowAndIndex !== undefined) {
        event.preventGridDefault();
        setActivePosition({ idx, rowIdx: parentRowAndIndex[1] }, { shouldFocus: true });
      }
    }
  }

  // Prevent copy/paste on group rows
  function handleCellCopy(
    { row, column }: CellCopyArgs<NoInfer<R>, NoInfer<SR>>,
    event: CellClipboardEvent
  ) {
    if (!isGroupRow(row)) {
      rawOnCellCopy?.({ row, column }, event);
    }
  }

  function handleCellPaste(
    { row, column }: CellPasteArgs<NoInfer<R>, NoInfer<SR>>,
    event: CellClipboardEvent
  ) {
    return isGroupRow(row) ? row : rawOnCellPaste!({ row, column }, event);
  }

  function handleRowsChange(updatedRows: R[], { indexes, column }: RowsChangeData<R, SR>) {
    if (!onRowsChange) return;
    const updatedRawRows = [...rawRows];
    const rawIndexes: number[] = [];
    for (const index of indexes) {
      const rawIndex = rawRows.indexOf(rows[index] as R);
      updatedRawRows[rawIndex] = updatedRows[index];
      rawIndexes.push(rawIndex);
    }
    onRowsChange(updatedRawRows, {
      indexes: rawIndexes,
      column
    });
  }

  function toggleGroup(groupId: unknown) {
    const newExpandedGroupIds = new Set(expandedGroupIds);
    if (newExpandedGroupIds.has(groupId)) {
      newExpandedGroupIds.delete(groupId);
    } else {
      newExpandedGroupIds.add(groupId);
    }
    onExpandedGroupIdsChange(newExpandedGroupIds);
  }

  function renderRow(
    key: Key,
    {
      row,
      rowClass,
      onCellMouseDown,
      onCellClick,
      onCellDoubleClick,
      onCellContextMenu,
      onRowChange,
      draggedOverCellIdx,
      activeCellEditor,
      isRowSelectionDisabled,
      isTreeGrid,
      ...rowProps
    }: RenderRowProps<R, SR>
  ) {
    if (isGroupRow(row)) {
      const { startRowIndex } = row;
      return (
        <GroupedRow
          key={row.id}
          {...rowProps}
          aria-rowindex={headerAndTopSummaryRowsCount + startRowIndex + 1}
          row={row}
          groupBy={groupBy}
          toggleGroup={toggleGroupLatest}
        />
      );
    }

    const { rowIdx } = rowProps;
    let rowKey = key;
    let ariaRowIndex = rowProps['aria-rowindex'];
    const parentRowAndIndex = getParentRowAndIndex(rowIdx);
    if (parentRowAndIndex !== undefined) {
      const [{ startRowIndex }, parentIdx] = parentRowAndIndex;
      // the rows of a group directly follow its group row
      const groupIndex = rowIdx - parentIdx - 1;
      ariaRowIndex = startRowIndex + headerAndTopSummaryRowsCount + groupIndex + 2;
      if (rowKeyGetter === undefined) {
        rowKey = startRowIndex + groupIndex + 1;
      }
    }

    return rawRenderRow(rowKey, {
      ...rowProps,
      'aria-rowindex': ariaRowIndex,
      row,
      rowClass,
      onCellMouseDown,
      onCellClick,
      onCellDoubleClick,
      onCellContextMenu,
      onRowChange,
      draggedOverCellIdx,
      activeCellEditor,
      isRowSelectionDisabled,
      isTreeGrid
    });
  }

  return (
    <DataGrid<R, SR>
      {...props}
      role="treegrid"
      aria-rowcount={
        rowsCount + 1 + (props.topSummaryRows?.length ?? 0) + (props.bottomSummaryRows?.length ?? 0)
      }
      columns={columns}
      rows={rows as R[]} // TODO: check types
      rowHeight={rowHeight}
      rowKeyGetter={rowKeyGetter}
      onRowsChange={handleRowsChange}
      selectedRows={selectedRows}
      onSelectedRowsChange={onSelectedRowsChange}
      onCellKeyDown={handleKeyDown}
      onCellCopy={handleCellCopy}
      onCellPaste={rawOnCellPaste ? handleCellPaste : undefined}
      renderers={{
        ...renderers,
        renderRow
      }}
    />
  );
}

function defaultGetRowGroupKey(row: unknown, columnKey: string) {
  return String((row as Record<string, unknown>)[columnKey]);
}

function defaultGetGroupId(groupKey: string, parentId: string | undefined) {
  return parentId === undefined ? groupKey : `${parentId}__${groupKey}`;
}
