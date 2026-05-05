import type { CalculatedColumn, ColSpanArgs } from '../types';
import { isStartFrozen } from './index';

export function getColSpan<R, SR>(
  column: CalculatedColumn<R, SR>,
  lastFrozenColumnIndex: number,
  firstEndFrozenColumnIndex: number,
  args: ColSpanArgs<R, SR>
): number | undefined {
  if (typeof column.colSpan !== 'function') return undefined;

  const colSpan = column.colSpan(args);

  if (!Number.isInteger(colSpan) || colSpan! <= 1) return undefined;

  const spanEnd = column.idx + colSpan! - 1;

  // start-frozen column: span must stay within the start-frozen band
  if (isStartFrozen(column.frozen) && spanEnd > lastFrozenColumnIndex) return undefined;
  // unfrozen column: span must not enter the end-frozen band
  if (
    column.frozen === false &&
    firstEndFrozenColumnIndex !== -1 &&
    spanEnd >= firstEndFrozenColumnIndex
  ) {
    return undefined;
  }
  // end-frozen columns are the contiguous tail, so spans within the band are self-contained

  return colSpan!;
}
