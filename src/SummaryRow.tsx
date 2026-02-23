import { memo } from 'react';
import { css } from 'ecij';

import { classnames, getColSpan } from './utils';
import type { RenderSummaryRowProps } from './types';
import { bottomSummaryRowClassname, rowClassname, topSummaryRowClassname } from './style/row';
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
  viewportColumns,
  top,
  bottom,
  lastFrozenColumnIndex,
  selectedCellIdx,
  isTop,
  selectCell,
  'aria-rowindex': ariaRowIndex
}: RenderSummaryRowProps<R, SR>) {
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

export function defaultSummaryRenderRow<R, SR>(
  key: React.Key,
  props: RenderSummaryRowProps<R, SR>
) {
  return <SummaryRowComponent key={key} {...props} />;
}
