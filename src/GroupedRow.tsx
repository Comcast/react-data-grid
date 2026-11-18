import { memo, useMemo } from 'react';
import { css } from 'ecij';

import { RowSelectionContext, type RowSelectionContextValue } from './hooks';
import { classnames } from './utils';
import type { BaseRenderRowProps, Omit, RowGroup } from './types';
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

interface GroupedRowProps<R, SR> extends Omit<BaseRenderRowProps<R, SR>, 'isRowSelectionDisabled'> {
  row: RowGroup<R>;
  groupBy: readonly string[];
  toggleGroup: (expandedGroupId: string) => void;
}

function GroupedRow<R, SR>({
  className,
  row,
  rowIdx,
  mapViewportColumns,
  activeCellIdx,
  isRowSelected,
  setActivePosition,
  gridRowStart,
  groupBy,
  toggleGroup,
  ...props
}: GroupedRowProps<R, SR>) {
  const isPositionOnRow = activeCellIdx === -1;
  // the group-by columns follow the `groupBy` order, so each level has its own column
  const levelColumnKey = groupBy[row.level];

  function handleSelectGroup() {
    setActivePosition({ idx: -1, rowIdx }, { shouldFocus: true });
  }

  const selectionValue = useMemo(
    (): RowSelectionContextValue => ({ isRowSelectionDisabled: false, isRowSelected }),
    [isRowSelected]
  );

  return (
    <RowSelectionContext value={selectionValue}>
      <div
        role="row"
        aria-level={row.level + 1} // aria-level is 1-based
        aria-setsize={row.setSize}
        aria-posinset={row.posInSet + 1} // aria-posinset is 1-based
        aria-expanded={row.isExpanded}
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
            column={column}
            row={row}
            isCellActive={isCellActive}
            isGroupByColumn={groupBy.includes(column.key)}
            isLevelMatching={column.key === levelColumnKey}
            toggleGroup={toggleGroup}
          />
        ))}
      </div>
    </RowSelectionContext>
  );
}

export default memo(GroupedRow) as <R, SR>(props: GroupedRowProps<R, SR>) => React.JSX.Element;
