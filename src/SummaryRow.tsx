import { memo } from 'react';
import { css } from '@nstep/ecis';

import { classnames, getColSpan, getRowStyle } from './utils';
import type { RenderRowProps } from './types';
import { cell, cellFrozen } from './style/cell';
import {
  bottomSummaryRowClassname,
  rowClassname,
  rowSelectedClassname,
  topSummaryRowClassname
} from './style/row';
import SummaryCell from './SummaryCell';

type SharedRenderRowProps<R, SR> = Pick<
  RenderRowProps<R, SR>,
  'viewportColumns' | 'rowIdx' | 'gridRowStart' | 'selectCell'
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
    > .${cell} {
      position: sticky;
    }
  }
`;

const topSummaryRow = css`
  @layer rdg.SummaryRow {
    > .${cell} {
      z-index: 2;
    }

    > .${cellFrozen} {
      z-index: 3;
    }
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
  'aria-rowindex': ariaRowIndex
}: SummaryRowProps<R, SR>) {
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
      className={classnames(
        rowClassname,
        `rdg-row-${rowIdx % 2 === 0 ? 'even' : 'odd'}`,
        summaryRowClassname,
        {
          [rowSelectedClassname]: selectedCellIdx === -1,
          [`${topSummaryRowClassname} ${topSummaryRow}`]: isTop,
          [bottomSummaryRowClassname]: !isTop
        }
      )}
      style={{
        ...getRowStyle(gridRowStart),
        '--rdg-summary-row-top': top !== undefined ? `${top}px` : undefined,
        '--rdg-summary-row-bottom': bottom !== undefined ? `${bottom}px` : undefined
      }}
    >
      {cells}
    </div>
  );
}

export default memo(SummaryRow) as <R, SR>(props: SummaryRowProps<R, SR>) => React.JSX.Element;
