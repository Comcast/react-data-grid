import type { CalculatedColumn, RowSpanArgs } from '../types';

/**
 * Returns the number of rows the cell at `row` should visually span, or `undefined`
 * if this row is not the first (master) row of a span. Only the master cell is
 * rendered; `Row` skips rendering the covered rows for this column.
 */
export function getRowSpan<R, SR>(
  column: CalculatedColumn<R, SR>,
  args: RowSpanArgs<R>
): number | undefined {
  if (typeof column.rowSpan !== 'function') return undefined;

  const result = column.rowSpan(args);
  if (result == null) return undefined;

  const [spanIndex, totalSpan] = result;
  if (!Number.isInteger(totalSpan) || totalSpan <= 1) return undefined;
  if (spanIndex !== 1) return undefined;

  return totalSpan;
}

/**
 * Returns true if this row is a non-master row within a column's row span, i.e.
 * it is visually covered by a master cell rendered on an earlier row and should
 * not render its own cell for this column.
 */
export function isRowSpanCovered<R, SR>(
  column: CalculatedColumn<R, SR>,
  args: RowSpanArgs<R>
): boolean {
  if (typeof column.rowSpan !== 'function') return false;

  const result = column.rowSpan(args);
  if (result == null) return false;

  const [spanIndex, totalSpan] = result;
  return Number.isInteger(totalSpan) && totalSpan > 1 && spanIndex !== 1;
}
