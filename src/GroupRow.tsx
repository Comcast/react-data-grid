import { memo, useMemo } from 'react';
import { css } from 'ecij';

import { RowSelectionContext, type RowSelectionContextValue } from './hooks';
import { classnames } from './utils';
import type { BaseRenderRowProps, GroupRow, Omit } from './types';
import { SELECT_COLUMN_KEY } from './Columns';
import GroupCell from './GroupCell';
import { cell, cellFrozen } from './style/cell';
import { rowClassname, rowActiveClassname } from './style/row';

const groupRow = css`
  @layer rdg.GroupedRow {
    &:not([aria-selected='true']) {
      background-color: var(--rdg-header-background-color);
    }

    > .${cell}:not(:last-child, .${cellFrozen}),
    > :nth-last-child(n + 2 of .${cellFrozen}) {
      border-inline-end: none;
    }
  }
`;

const groupRowClassname = `rdg-group-row ${groupRow}`;

interface GroupRowRendererProps<R, SR> extends Omit<
  BaseRenderRowProps<R, SR>,
  'isRowSelectionDisabled'
> {
  row: GroupRow<R>;
  groupBy: readonly string[];
  toggleGroup: (expandedGroupId: unknown) => void;
}

function GroupedRow<R, SR>({
  className,
  row,
  rowIdx,
  iterateOverViewportColumnsForRow,
  activeCellIdx,
  isRowSelected,
  setPosition,
  gridRowStart,
  groupBy,
  toggleGroup,
  ...props
}: GroupRowRendererProps<R, SR>) {
  const isPositionOnRow = activeCellIdx === -1;

  let idx = row.level;

  function handleSelectGroup() {
    setPosition({ rowIdx, idx: -1 }, { shouldFocus: true });
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
        {iterateOverViewportColumnsForRow(activeCellIdx)
          .map(([column], index) => {
            // Select is always the first column
            if (index === 0 && column.key === SELECT_COLUMN_KEY) {
              idx += 1;
            }

            return (
              <GroupCell
                key={column.key}
                id={row.id}
                groupKey={row.groupKey}
                childRows={row.childRows}
                isExpanded={row.isExpanded}
                isCellActive={activeCellIdx === column.idx}
                column={column}
                row={row}
                groupColumnIndex={idx}
                toggleGroup={toggleGroup}
                isGroupByColumn={groupBy.includes(column.key)}
              />
            );
          })
          .toArray()}
      </div>
    </RowSelectionContext>
  );
}

export default memo(GroupedRow) as <R, SR>(
  props: GroupRowRendererProps<R, SR>
) => React.JSX.Element;
