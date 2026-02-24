import { memo } from 'react';

import { useRovingTabIndex } from './hooks';
import { getCellClassname, getCellStyle } from './utils';
import type { CellRendererProps } from './types';

type SharedCellRendererProps<R, SR> = Pick<
  CellRendererProps<R, SR>,
  'rowIdx' | 'column' | 'colSpan' | 'isCellActive' | 'setPosition'
>;

interface SummaryCellProps<R, SR> extends SharedCellRendererProps<R, SR> {
  row: SR;
}

function SummaryCell<R, SR>({
  column,
  colSpan,
  row,
  rowIdx,
  isCellActive,
  setPosition
}: SummaryCellProps<R, SR>) {
  const { tabIndex, childTabIndex, onFocus } = useRovingTabIndex(isCellActive);
  const { summaryCellClass } = column;
  const className = getCellClassname(
    column,
    typeof summaryCellClass === 'function' ? summaryCellClass(row) : summaryCellClass
  );

  function onMouseDown() {
    setPosition({ rowIdx, idx: column.idx });
  }

  return (
    <div
      role="gridcell"
      aria-colindex={column.idx + 1}
      aria-colspan={colSpan}
      aria-selected={isCellActive}
      tabIndex={tabIndex}
      className={className}
      style={getCellStyle(column, colSpan)}
      onMouseDown={onMouseDown}
      onFocus={onFocus}
    >
      {column.renderSummaryCell?.({ column, row, tabIndex: childTabIndex })}
    </div>
  );
}

export default memo(SummaryCell) as <R, SR>(props: SummaryCellProps<R, SR>) => React.JSX.Element;
