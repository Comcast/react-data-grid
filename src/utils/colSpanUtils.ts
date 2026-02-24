import type { CalculatedColumn, ColSpanArgs } from '../types';

export function getColSpan<R, SR>(
  column: CalculatedColumn<R, SR>,
  lastFrozenColumnIndex: number,
  args: ColSpanArgs<R, SR>
): number | undefined {
  if (typeof column.colSpan !== 'function') return undefined;

  const colSpan = column.colSpan(args);

  if (
    Number.isInteger(colSpan) &&
    colSpan! > 1 &&
    // ignore colSpan if it spans over both frozen and regular columns
    (!column.frozen || column.idx + colSpan! - 1 <= lastFrozenColumnIndex)
  ) {
    return colSpan!;
  }

  return undefined;
}
