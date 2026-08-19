import { memo } from 'react';
import { css } from 'ecij';

import { classnames } from './utils';
import type { RenderRowProps } from './types';
import {
  bottomSummaryRowClassname,
  rowClassname,
  rowActiveClassname,
  topSummaryRowClassname
} from './style/row';
import SummaryCell from './SummaryCell';

type SharedRenderRowProps<R, SR> = Pick<
  RenderRowProps<R, SR>,
  | 'iterateOverViewportColumnsForRow'
  | 'rowIdx'
  | 'gridRowStart'
  | 'setActivePosition'
  | 'activeCellIdx'
  | 'isTreeGrid'
>;

interface SummaryRowProps<R, SR> extends SharedRenderRowProps<R, SR> {
  'aria-rowindex': number;
  row: SR;
  top: number | undefined;
  bottom: number | undefined;
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
  iterateOverViewportColumnsForRow,
  activeCellIdx,
  setActivePosition,
  top,
  bottom,
  isTop,
  isTreeGrid,
  'aria-rowindex': ariaRowIndex
}: SummaryRowProps<R, SR>) {
  const isPositionOnRow = activeCellIdx === -1;

  const cells = iterateOverViewportColumnsForRow(activeCellIdx, { type: 'SUMMARY', row })
    .map(([column, isCellActive, colSpan]) => (
      <SummaryCell<R, SR>
        key={column.key}
        column={column}
        colSpan={colSpan}
        row={row}
        rowIdx={rowIdx}
        isCellActive={isCellActive}
        setActivePosition={setActivePosition}
      />
    ))
    .toArray();

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
        isPositionOnRow && rowActiveClassname
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
