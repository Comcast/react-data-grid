import { memo } from 'react';
import { css } from 'ecij';

import { classnames } from './utils';
import type { RenderSummaryRowProps } from './types';
import {
  bottomSummaryRowClassname,
  rowClassname,
  topSummaryRowClassname
} from './style/row';
import SummaryCell from './SummaryCell';

const summaryRow = css`
  @layer rdg.SummaryRow {
    position: sticky;
    z-index: 2;
  }
`;

const summaryRowClassname = `rdg-summary-row ${summaryRow}`;

function SummaryRow<R, SR>({
  tabIndex,
  className,
  rowIdx,
  gridRowStart,
  row,
  iterateOverViewportColumnsForRow,
  activeCellIdx,
  setActivePosition,
  top,
  bottom,
  isTop,
  'aria-rowindex': ariaRowIndex
}: RenderSummaryRowProps<R, SR>) {
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
      tabIndex={tabIndex}
      className={classnames(
        rowClassname,
        `rdg-row-${rowIdx % 2 === 0 ? 'even' : 'odd'}`,
        summaryRowClassname,
        isTop ? topSummaryRowClassname : bottomSummaryRowClassname,
        className
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

const SummaryRowComponent = memo(SummaryRow) as <R, SR>(
  props: RenderSummaryRowProps<R, SR>
) => React.JSX.Element;

export default SummaryRowComponent;

export function defaultRenderSummaryRow<R, SR>(
  key: React.Key,
  props: RenderSummaryRowProps<R, SR>
) {
  return <SummaryRowComponent key={key} {...props} />;
}
