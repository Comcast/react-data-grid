import { useCallback, useMemo } from 'react';
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
import { useDefaultRenderers } from './DataGridDefaultRenderersContext';
import GroupedRow from './GroupRow';
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
  groupIdGetter?: Maybe<(groupKey: string, parentId?: string) => string>;
}

interface PartialGroupRow<TRow> {
  readonly groups: GroupsMap<TRow>;
  // all the descendant rows of the group, not just the direct children
  readonly childRows: TRow[];
}

type GroupsMap<TRow> = Map<string, PartialGroupRow<TRow>>;

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
  groupIdGetter: rawGroupIdGetter,
  ...props
}: TreeDataGridProps<R, SR, K>) {
  const defaultRenderers = useDefaultRenderers<R, SR>();
  const rawRenderRow = renderers?.renderRow ?? defaultRenderers?.renderRow ?? defaultRenderRow;
  const headerAndTopSummaryRowsCount = 1 + (props.topSummaryRows?.length ?? 0);
  const { leftKey, rightKey } = getLeftRightKey(props.direction);
  const toggleGroupLatest = useLatestFunc(toggleGroup);
  const getRowGroupKey = rawGetRowGroupKey ?? defaultGetRowGroupKey;
  const groupIdGetter = rawGroupIdGetter ?? defaultGroupIdGetter;

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

  const [rows, rowsCount, isGroupRow] = useMemo((): [
    readonly (R | GroupRow<R>)[],
    number,
    (row: R | GroupRow<R>) => row is GroupRow<R>
  ] => {
    const allGroupRows = new Set<unknown>();

    if (groupBy.length === 0) {
      return [rawRows, rawRows.length, isGroupRow];
    }

    // Group the rows in a single pass, each row is added to every group it belongs to
    const groups: GroupsMap<R> = new Map();

    for (const row of rawRows) {
      let parentGroups = groups;

      for (const columnKey of groupBy) {
        const groupKey = getRowGroupKey(row, columnKey);
        const group = parentGroups.getOrInsertComputed(groupKey, () => ({
          groups: new Map(),
          childRows: []
        }));
        group.childRows.push(row);
        parentGroups = group.groups;
      }
    }

    const flattenedRows: (R | GroupRow<R>)[] = [];

    // Flattens the visible rows, and returns the number of rows the groups contain,
    // as if every group was expanded. Collapsed groups are only traversed to count their rows.
    function expandGroups(
      groups: GroupsMap<R>,
      parentId: string | undefined,
      level: number,
      startRowIndex: number,
      isParentExpanded: boolean
    ): number {
      let groupRowsCount = 0;
      let posInSet = 0;

      for (const [groupKey, { groups: childGroups, childRows }] of groups) {
        let id: string | undefined;
        let isExpanded = false;

        if (isParentExpanded) {
          id = groupIdGetter(groupKey, parentId);
          isExpanded = expandedGroupIds.has(id);

          const groupRow: GroupRow<R> = {
            id,
            parentId,
            groupKey,
            isExpanded,
            childRows,
            level,
            posInSet: posInSet++,
            setSize: groups.size,
            startRowIndex: startRowIndex + groupRowsCount
          };
          flattenedRows.push(groupRow);
          allGroupRows.add(groupRow);
        }

        groupRowsCount++; // 1 for the group row

        if (childGroups.size === 0) {
          // the group is on the last level, it only contains rows
          if (isExpanded) {
            flattenedRows.push(...childRows);
          }
          groupRowsCount += childRows.length;
        } else {
          groupRowsCount += expandGroups(
            childGroups,
            id,
            level + 1,
            startRowIndex + groupRowsCount,
            isExpanded
          );
        }
      }

      return groupRowsCount;
    }

    const rowsCount = expandGroups(groups, undefined, 0, 0, true);

    return [flattenedRows, rowsCount, isGroupRow];

    function isGroupRow(row: R | GroupRow<R>): row is GroupRow<R> {
      return allGroupRows.has(row);
    }
  }, [expandedGroupIds, getRowGroupKey, groupBy, groupIdGetter, rawRows]);

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
  }, [isGroupRow, rawRowHeight]);

  const getParentRowAndIndex = useCallback(
    (row: R | GroupRow<R>) => {
      const rowIdx = rows.indexOf(row);
      for (let i = rowIdx - 1; i >= 0; i--) {
        const parentRow = rows[i];
        if (isGroupRow(parentRow) && (!isGroupRow(row) || row.parentId === parentRow.id)) {
          return [parentRow, i] as const;
        }
      }

      return undefined;
    },
    [isGroupRow, rows]
  );

  const rowKeyGetter = useCallback(
    (row: R | GroupRow<R>) => {
      if (isGroupRow(row)) {
        return row.id;
      }

      if (typeof rawRowKeyGetter === 'function') {
        return rawRowKeyGetter(row);
      }

      const parentRowAndIndex = getParentRowAndIndex(row);
      if (parentRowAndIndex !== undefined) {
        const { startRowIndex, childRows } = parentRowAndIndex[0];
        const groupIndex = childRows.indexOf(row);
        return startRowIndex + groupIndex + 1;
      }

      return rows.indexOf(row);
    },
    [getParentRowAndIndex, isGroupRow, rawRowKeyGetter, rows]
  );

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
  }, [isGroupRow, rawRowKeyGetter, rawSelectedRows, rows]);

  function onSelectedRowsChange(newSelectedRows: Set<Key>) {
    if (!rawOnSelectedRowsChange) return;

    assertIsValidKeyGetter<R, K>(rawRowKeyGetter);

    const newRawSelectedRows = new Set(rawSelectedRows);
    for (const row of rows) {
      const key = rowKeyGetter(row);
      if (selectedRows?.has(key) && !newSelectedRows.has(key)) {
        if (isGroupRow(row)) {
          // select all children if the parent row is selected
          for (const cr of row.childRows) {
            newRawSelectedRows.delete(rawRowKeyGetter(cr));
          }
        } else {
          newRawSelectedRows.delete(key as K);
        }
      } else if (!selectedRows?.has(key) && newSelectedRows.has(key)) {
        if (isGroupRow(row)) {
          // unselect all children if the parent row is unselected
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
      // Collapse the current group row if it is focused and is in expanded state
      ((event.key === leftKey && row.isExpanded) ||
        // Expand the current group row if it is focused and is in collapsed state
        (event.key === rightKey && !row.isExpanded))
    ) {
      // prevent scrolling
      event.preventDefault();
      event.preventGridDefault();
      toggleGroup(row.id);
    }

    // If a group row is focused, and it is collapsed, move to the parent group row (if there is one).
    if (idx === -1 && event.key === leftKey && !row.isExpanded && row.level !== 0) {
      const parentRowAndIndex = getParentRowAndIndex(row);
      if (parentRowAndIndex !== undefined) {
        event.preventGridDefault();
        setActivePosition({ idx, rowIdx: parentRowAndIndex[1] });
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
          key={key}
          {...rowProps}
          aria-rowindex={headerAndTopSummaryRowsCount + startRowIndex + 1}
          row={row}
          groupBy={groupBy}
          toggleGroup={toggleGroupLatest}
        />
      );
    }

    let ariaRowIndex = rowProps['aria-rowindex'];
    const parentRowAndIndex = getParentRowAndIndex(row);
    if (parentRowAndIndex !== undefined) {
      const { startRowIndex, childRows } = parentRowAndIndex[0];
      const groupIndex = childRows.indexOf(row);
      ariaRowIndex = startRowIndex + headerAndTopSummaryRowsCount + groupIndex + 2;
    }

    return rawRenderRow(key, {
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

function defaultGroupIdGetter(groupKey: string, parentId: string | undefined) {
  return parentId === undefined ? groupKey : `${parentId}__${groupKey}`;
}
