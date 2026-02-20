import { memo } from 'react';
import { css } from 'ecij';

import { classnames, getColSpan } from './utils';
import type { RenderRowProps } from './types';
import {
  bottomSummaryRowClassname,
  rowClassname,
  rowSelectedClassname,
  topSummaryRowClassname
} from './style/row';
import SummaryCell from './SummaryCell';

type SharedRenderRowProps<R, SR> = Pick<
  RenderRowProps<R, SR>,
  'viewportColumns' | 'rowIdx' | 'gridRowStart' | 'selectCell' | 'isTreeGrid'
>;

interface SummaryRowProps<R, SR> extends SharedRenderRowProps<R, SR> {
  'aria-rowindex': number;
  row: SR;
  top: number | undefined;
  bottom: number | undefined;
  lastFrozenColumnIndex: number;
  selectedCellIdx: number | undefined;
  isTop: boolean;
}

const summaryRow = css`
  @layer rdg.SummaryRow {
    position: sticky;
    z-index: 2;
  }
`;

const summaryRowClassname = `rdg-summary-row ${summaryRow}`;

function SummaryRow<R, SR>({
  rowIdx,
  gridRowStart,
  row,
  viewportColumns,
  top,
  bottom,
  lastFrozenColumnIndex,
  selectedCellIdx,
  isTop,
  selectCell,
  isTreeGrid,
  'aria-rowindex': ariaRowIndex
}: SummaryRowProps<R, SR>) {
  const isPositionOnRow = selectedCellIdx === -1;

  const cells = [];

  for (let index = 0; index < viewportColumns.length; index++) {
    const column = viewportColumns[index];
    const colSpan = getColSpan(column, lastFrozenColumnIndex, { type: 'SUMMARY', row });
    if (colSpan !== undefined) {
      index += colSpan - 1;
    }

    const isCellSelected = selectedCellIdx === column.idx;

    cells.push(
      <SummaryCell<R, SR>
        key={column.key}
        column={column}
        colSpan={colSpan}
        row={row}
        rowIdx={rowIdx}
        isCellSelected={isCellSelected}
        selectCell={selectCell}
      />
    );
  }

  return (
    <div
      role="row"
      aria-rowindex={ariaRowIndex}
      tabIndex={isTreeGrid ? (isPositionOnRow ? 0 : -1) : undefined}
      className={classnames(
        rowClassname,
        `rdg-row-${rowIdx % 2 === 0 ? 'even' : 'odd'}`,
        summaryRowClassname,
        isTop ? topSummaryRowClassname : bottomSummaryRowClassname,
        isPositionOnRow && rowSelectedClassname
      )}
      style={{
        gridRowStart,
        top,
        bottom
      }}
    >
      {cells}
    </div>
  );
}

export default memo(SummaryRow) as <R, SR>(props: SummaryRowProps<R, SR>) => React.JSX.Element;
