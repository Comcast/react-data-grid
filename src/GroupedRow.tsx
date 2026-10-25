import { memo, useMemo, type Key } from 'react';
import { css } from 'ecij';

import {
  RowSelectionChangeContext,
  RowSelectionContext,
  type RowSelectionContextValue
} from './hooks';
import { classnames } from './utils';
import type { BaseRenderRowProps, GroupRow, Maybe, Omit, SelectRowEvent } from './types';
import GroupCell from './GroupCell';
import { cell, cellFrozenBase } from './style/cell';
import { rowClassname, rowActiveClassname } from './style/row';

const groupRow = css`
  @layer rdg.GroupedRow {
    &:not([aria-selected='true']) {
      background-color: var(--rdg-header-background-color);
    }

    > .${cell}:not(:last-child, .${cellFrozenBase}), > :nth-last-child(n + 2 of .rdg-cell-frozen-start), > :nth-last-child(n + 2 of .rdg-cell-frozen-end) {
      border-inline-end: none;
    }
  }
`;

const groupRowClassname = `rdg-group-row ${groupRow}`;

interface GroupedRowProps<R, SR> extends Omit<
  BaseRenderRowProps<R, SR>,
  'isRowSelected' | 'isRowSelectionDisabled'
> {
  row: GroupRow<R>;
  groupBy: readonly string[];
  toggleGroup: (expandedGroupId: unknown) => void;
  selectedRows: Maybe<ReadonlySet<Key>>;
  rowKeyGetter: Maybe<(row: R) => Key>;
  // selects or unselects all the rows of the group
  onRowSelectionChange: (selectRowEvent: SelectRowEvent<GroupRow<R>>) => void;
}

function GroupedRow<R, SR>({
  className,
  row,
  rowIdx,
  mapViewportColumns,
  activeCellIdx,
  setActivePosition,
  gridRowStart,
  groupBy,
  toggleGroup,
  selectedRows,
  rowKeyGetter,
  onRowSelectionChange,
  'aria-selected': ariaSelected,
  ...props
}: GroupedRowProps<R, SR>) {
  const isPositionOnRow = activeCellIdx === -1;
  // the group-by columns follow the `groupBy` order, so each level has its own column
  const levelColumnKey = groupBy[row.level];
  const { childRows } = row;

  // A group row is selected when all its rows are.
  // Unlike `row`, `childRows` doesn't change when groups are expanded or collapsed.
  const isRowSelected = useMemo(
    () =>
      selectedRows != null &&
      rowKeyGetter != null &&
      childRows.every((childRow) => selectedRows.has(rowKeyGetter(childRow))),
    [childRows, selectedRows, rowKeyGetter]
  );

  function handleSelectGroup() {
    setActivePosition({ idx: -1, rowIdx }, { shouldFocus: true });
  }

  const selectionValue = useMemo(
    (): RowSelectionContextValue => ({ isRowSelectionDisabled: false, isRowSelected }),
    [isRowSelected]
  );

  return (
    <RowSelectionContext value={selectionValue}>
      <RowSelectionChangeContext value={onRowSelectionChange}>
        <div
          role="row"
          aria-level={row.level + 1} // aria-level is 1-based
          aria-setsize={row.setSize}
          aria-posinset={row.posInSet + 1} // aria-posinset is 1-based
          aria-expanded={row.isExpanded}
          // `DataGrid` sets `aria-selected` when rows can be selected,
          // but it can't tell whether a group row is selected
          aria-selected={ariaSelected === undefined ? undefined : isRowSelected}
          tabIndex={isPositionOnRow ? 0 : -1}
          className={classnames(
            rowClassname,
            groupRowClassname,
            `rdg-row-${rowIdx % 2 === 0 ? 'even' : 'odd'}`,
            isPositionOnRow && rowActiveClassname,
            className
          )}
          onMouseDown={handleSelectGroup}
          style={{ gridRowStart }}
          {...props}
        >
          {mapViewportColumns(activeCellIdx, undefined, (column, isCellActive) => (
            <GroupCell
              key={column.key}
              id={row.id}
              groupKey={row.groupKey}
              childRows={childRows}
              isExpanded={row.isExpanded}
              isCellActive={isCellActive}
              column={column}
              row={row}
              toggleGroup={toggleGroup}
              isGroupByColumn={groupBy.includes(column.key)}
              isLevelMatching={column.key === levelColumnKey}
            />
          ))}
        </div>
      </RowSelectionChangeContext>
    </RowSelectionContext>
  );
}

export default memo(GroupedRow) as <R, SR>(props: GroupedRowProps<R, SR>) => React.JSX.Element;
