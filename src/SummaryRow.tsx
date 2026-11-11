import { memo } from 'react';
import { css } from 'ecij';

import { classnames } from './utils';
import type { RenderRowProps } from './types';
import { bottomSummaryRowClassname, rowClassname, topSummaryRowClassname } from './style/row';
import SummaryCell from './SummaryCell';

type SharedRenderRowProps<R, SR> = Pick<
  RenderRowProps<R, SR>,
  | 'mapViewportColumns'
  | 'rowIdx'
  | 'gridRowStart'
  | 'setActivePosition'
  | 'activeCellIdx'
  | 'tabIndex'
  | 'className'
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
  mapViewportColumns,
  activeCellIdx,
  setActivePosition,
  top,
  bottom,
  isTop,
  tabIndex,
  className,
  'aria-rowindex': ariaRowIndex
}: SummaryRowProps<R, SR>) {
  const cells = mapViewportColumns(
    activeCellIdx,
    { type: 'SUMMARY', row },
    (column, isCellActive, colSpan) => (
      <SummaryCell<R, SR>
        key={column.key}
        column={column}
        colSpan={colSpan}
        row={row}
        rowIdx={rowIdx}
        isCellActive={isCellActive}
        setActivePosition={setActivePosition}
      />
    )
  );

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

export default memo(SummaryRow) as <R, SR>(props: SummaryRowProps<R, SR>) => React.JSX.Element;
