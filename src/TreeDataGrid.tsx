import { useMemo, useState } from 'react';
import type { Key } from 'react';

import { SelectionOverrideContext, useLatestFunc, type SelectionOverride } from './hooks';
import { assertIsValidGetRowKey, getLeftRightKey, max, min } from './utils';
import type {
  CellClipboardEvent,
  CellCopyArgs,
  CellKeyboardEvent,
  CellPasteArgs,
  Column,
  GroupRow,
  Maybe,
  Omit,
  RenderRowProps,
  RowHeightArgs,
  RowsChangeData,
  SelectHeaderRowEvent,
  SelectRowEvent,
  TreeCellKeyDownArgs,
  TreePositionChangeArgs
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
  | 'columns'
  | 'role'
  | 'aria-rowcount'
  | 'rowHeight'
  | 'onFill'
  | 'isRowSelectionDisabled'
  | 'onCellKeyDown'
  | 'onActivePositionChange'
> {
  columns: readonly Column<NoInfer<R>, NoInfer<SR>>[];
  rowHeight?: Maybe<number | ((args: RowHeightArgs<NoInfer<R>>) => number)>;
  /** Callback triggered when a key is pressed in a cell or a row, including group rows */
  onCellKeyDown?: Maybe<
    (args: TreeCellKeyDownArgs<NoInfer<R>, NoInfer<SR>>, event: CellKeyboardEvent) => void
  >;
  /** Function called whenever the active position is changed, including to a group row */
  onActivePositionChange?: Maybe<(args: TreePositionChangeArgs<NoInfer<R>, NoInfer<SR>>) => void>;
  groupBy: readonly string[];
  getRowGroupKey?: Maybe<(row: NoInfer<R>, columnKey: string) => string>;
  expandedGroupIds: ReadonlySet<string>;
  onExpandedGroupIdsChange: (expandedGroupIds: Set<string>) => void;
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

/**
 * Returns whether a row of a `TreeDataGrid` is a group row,
 * e.g., the active row passed to `onCellKeyDown` or `onActivePositionChange`
 */
export function isGroupRow<TRow>(row: TRow | GroupRow<TRow>): row is GroupRow<TRow> {
  return typeof row === 'object' && row !== null && allGroupRows.has(row);
}

interface GroupRowSelectionCache {
  readonly getRowKey: unknown;
  // by the `childRows` of the groups, which don't change when groups are expanded or collapsed
  readonly isSelectedByGroup: WeakMap<readonly unknown[], boolean>;
}

// Virtualization unmounts the group rows that scroll out of view, so each group checks its rows
// once per selection instead of every time it scrolls back into view.
// Old selections are released with their cache, as the selection is the key.
const groupRowSelectionCaches = new WeakMap<ReadonlySet<unknown>, GroupRowSelectionCache>();

// a group row is selected when all its rows are
function isGroupRowSelected<TRow, K>(
  childRows: readonly TRow[],
  selectedRows: Maybe<ReadonlySet<K>>,
  getRowKey: Maybe<(row: TRow) => K>
): boolean {
  if (selectedRows == null || typeof getRowKey !== 'function') return false;

  let cache = groupRowSelectionCaches.get(selectedRows);
  if (cache === undefined || cache.getRowKey !== getRowKey) {
    cache = { getRowKey, isSelectedByGroup: new WeakMap() };
    groupRowSelectionCaches.set(selectedRows, cache);
  }

  let isSelected = cache.isSelectedByGroup.get(childRows);
  if (isSelected === undefined) {
    isSelected = childRows.every((row) => selectedRows.has(getRowKey(row)));
    cache.isSelectedByGroup.set(childRows, isSelected);
  }
  return isSelected;
}

export function TreeDataGrid<R, SR = unknown, K extends Key = Key>({
  columns: rawColumns,
  rows: rawRows,
  rowHeight: rawRowHeight,
  getRowKey: rawGetRowKey,
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
  const isSelectable = rawSelectedRows != null && rawOnSelectedRowsChange != null;
  // the index of the last row selected or unselected, where Shift+click ranges start
  const [previousRowIdx, setPreviousRowIdx] = useState(-1);
  const toggleGroupLatest = useLatestFunc(toggleGroup);
  const selectAllRowsLatest = useLatestFunc(selectAllRows);
  const selectRowLatest = useLatestFunc(selectRow);
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

  // Without rawGetRowKey, the keys are computed in renderRow, where the row index is known
  const getRowKey = useMemo(() => {
    if (typeof rawGetRowKey !== 'function') return undefined;
    return (row: R | GroupRow<R>) => (isGroupRow(row) ? row.id : rawGetRowKey(row));
  }, [rawGetRowKey]);

  // the select-all checkbox also applies to the rows of collapsed groups, which `DataGrid` doesn't have
  let hasSelectedRow = false;
  let hasUnselectedRow = false;

  // keep this loop out of `useMemo`: React Compiler memoizes it here, but not in the callback
  if (rawGetRowKey != null && rawSelectedRows != null && rawSelectedRows.size > 0) {
    for (const row of rawRows) {
      if (rawSelectedRows.has(rawGetRowKey(row))) {
        hasSelectedRow = true;
      } else {
        hasUnselectedRow = true;
      }

      if (hasSelectedRow && hasUnselectedRow) break;
    }
  }

  const selectionOverride = useMemo(
    (): SelectionOverride => ({
      headerRowSelection: {
        isRowSelected: hasSelectedRow && !hasUnselectedRow,
        isIndeterminate: hasSelectedRow && hasUnselectedRow
      },
      onHeaderRowSelectionChange: selectAllRowsLatest,
      onRowSelectionChange: selectRowLatest
    }),
    [hasSelectedRow, hasUnselectedRow, selectAllRowsLatest, selectRowLatest]
  );

  // selects or unselects the given rows, and keeps the selection of the other rows
  function setRowsSelection(changedRows: readonly R[], checked: boolean) {
    if (!rawOnSelectedRowsChange) return;

    assertIsValidGetRowKey<R, K>(rawGetRowKey);

    const newSelectedRows = new Set(rawSelectedRows);
    for (const row of changedRows) {
      const rowKey = rawGetRowKey(row);
      if (checked) {
        newSelectedRows.add(rowKey);
      } else {
        newSelectedRows.delete(rowKey);
      }
    }

    rawOnSelectedRowsChange(newSelectedRows);
  }

  function selectAllRows({ checked }: SelectHeaderRowEvent) {
    setRowsSelection(rawRows, checked);
  }

  // Selects or unselects a row, or all the rows of a group row.
  // A Shift+click range also includes the rows between the previous row and this one,
  // as well as all the rows of the collapsed groups in between, like the group rows do.
  function selectRow({ row, checked, isShiftClick }: SelectRowEvent<R | GroupRow<R>>) {
    const rowIdx = rows.indexOf(row);
    setPreviousRowIdx(rowIdx);
    const changedRows: R[] = [];

    if (isGroupRow(row)) {
      for (const childRow of row.childRows) changedRows.push(childRow);
    } else {
      changedRows.push(row);
    }

    if (
      isShiftClick &&
      previousRowIdx !== -1 &&
      previousRowIdx !== rowIdx &&
      previousRowIdx < rows.length
    ) {
      const endIdx = max(previousRowIdx, rowIdx);
      for (let idx = min(previousRowIdx, rowIdx) + 1; idx < endIdx; idx++) {
        const rangeRow = rows[idx];
        if (!isGroupRow(rangeRow)) {
          changedRows.push(rangeRow);
        } else if (!rangeRow.isExpanded) {
          for (const childRow of rangeRow.childRows) changedRows.push(childRow);
        }
        // the rows of an expanded group follow its group row, so the range only includes those it covers
      }
    }

    setRowsSelection(changedRows, checked);
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

  function handleKeyDown(args: TreeCellKeyDownArgs<R, SR>, event: CellKeyboardEvent) {
    rawOnCellKeyDown?.(args, event);
    if (event.isGridDefaultPrevented()) return;

    if (args.mode === 'EDIT') return;
    const { column, rowIdx, setActivePosition } = args;
    const idx = column?.idx ?? -1;
    const row = rows[rowIdx];

    if (!isGroupRow(row)) return;

    // Select or unselect the rows of the group on Shift + Space when one of its cells is active,
    // as `DataGrid` can't tell whether a group row is selected
    if (idx !== -1 && isSelectable && event.shiftKey && event.key === ' ') {
      // prevent scrolling
      event.preventDefault();
      event.preventGridDefault();
      selectRow({
        row,
        checked: !isGroupRowSelected(row.childRows, rawSelectedRows, rawGetRowKey),
        isShiftClick: false
      });
    }

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

  function toggleGroup(groupId: string) {
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
      isRowSelected,
      isTreeGrid,
      ...rowProps
    }: RenderRowProps<R, SR>
  ) {
    if (isGroupRow(row)) {
      const { startRowIndex } = row;
      const isGroupSelected = isGroupRowSelected(row.childRows, rawSelectedRows, rawGetRowKey);
      return (
        <GroupedRow
          key={row.id}
          {...rowProps}
          aria-rowindex={headerAndTopSummaryRowsCount + startRowIndex + 1}
          // `DataGrid` sets `aria-selected` when rows can be selected,
          // but it can't tell whether a group row is selected
          aria-selected={rowProps['aria-selected'] === undefined ? undefined : isGroupSelected}
          isRowSelected={isGroupSelected}
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
      if (getRowKey === undefined) {
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
      isRowSelected,
      isTreeGrid
    });
  }

  return (
    <SelectionOverrideContext value={selectionOverride}>
      <DataGrid<R, SR>
        {...props}
        role="treegrid"
        aria-rowcount={
          rowsCount +
          1 +
          (props.topSummaryRows?.length ?? 0) +
          (props.bottomSummaryRows?.length ?? 0)
        }
        columns={columns}
        // The rows include group rows. `DataGrid` passes them to `onCellKeyDown` and
        // `onActivePositionChange`, which are typed with `TreeCellKeyDownArgs` and
        // `TreePositionChangeArgs`; the other props that receive rows are either wrapped here
        // to handle group rows, or never called with one
        rows={rows as R[]}
        rowHeight={rowHeight}
        getRowKey={getRowKey}
        onRowsChange={handleRowsChange}
        selectedRows={rawSelectedRows}
        // `selectionOverride` changes the selection,
        // `DataGrid` only uses it to tell whether rows can be selected
        onSelectedRowsChange={
          rawOnSelectedRowsChange as DataGridProps<R, SR>['onSelectedRowsChange']
        }
        onCellKeyDown={handleKeyDown}
        onCellCopy={handleCellCopy}
        onCellPaste={rawOnCellPaste ? handleCellPaste : undefined}
        renderers={{
          ...renderers,
          renderRow
        }}
      />
    </SelectionOverrideContext>
  );
}

function defaultGetRowGroupKey(row: unknown, columnKey: string) {
  return String((row as Record<string, unknown>)[columnKey]);
}

function defaultGetGroupId(groupKey: string, parentId: string | undefined) {
  return parentId === undefined ? groupKey : `${parentId}__${groupKey}`;
}
