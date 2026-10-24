import type { CalculatedColumn, ColSpanArgs } from '../types';
import { getColSpan } from './colSpanUtils';

// These functions build arrays with plain loops instead of using generators:
// iterating over generator objects is much slower, and React Compiler doesn't support `yield`

/**
 * Returns the columns to render, ordered by index:
 * start-frozen columns, the unfrozen columns in the overscan range, and end-frozen columns,
 * plus the active column when it is outside of the overscan range
 */
export function getViewportColumns<R, SR>(
  columns: readonly CalculatedColumn<R, SR>[],
  lastStartFrozenColumnIndex: number,
  firstEndFrozenColumnIndex: number,
  startIdx: number,
  effectiveOverscanEndIdx: number,
  activeColumnIdx: number
): CalculatedColumn<R, SR>[] {
  const viewportColumns: CalculatedColumn<R, SR>[] = [];

  for (let colIdx = 0; colIdx <= lastStartFrozenColumnIndex; colIdx++) {
    viewportColumns.push(columns[colIdx]);
  }

  const unfrozenLastIdx =
    firstEndFrozenColumnIndex > -1 ? firstEndFrozenColumnIndex - 1 : columns.length - 1;

  if (lastStartFrozenColumnIndex < unfrozenLastIdx) {
    if (activeColumnIdx > lastStartFrozenColumnIndex && activeColumnIdx < startIdx) {
      viewportColumns.push(columns[activeColumnIdx]);
    }

    for (let colIdx = startIdx; colIdx <= effectiveOverscanEndIdx; colIdx++) {
      viewportColumns.push(columns[colIdx]);
    }

    if (activeColumnIdx > effectiveOverscanEndIdx && activeColumnIdx <= unfrozenLastIdx) {
      viewportColumns.push(columns[activeColumnIdx]);
    }
  }

  // Always include the end-frozen tail (virtualization must keep these in the DOM)
  if (firstEndFrozenColumnIndex > -1) {
    for (let colIdx = firstEndFrozenColumnIndex; colIdx < columns.length; colIdx++) {
      viewportColumns.push(columns[colIdx]);
    }
  }

  return viewportColumns;
}

// The callback receives each cell's values as arguments, so no object is allocated per cell
export function mapColumnsWithColSpan<R, SR, T>(
  viewportColumns: readonly CalculatedColumn<R, SR>[],
  activeColumnIdx: number,
  lastStartFrozenColumnIndex: number,
  firstEndFrozenColumnIndex: number,
  colSpanArgs: ColSpanArgs<R, SR> | undefined,
  callback: (
    column: CalculatedColumn<R, SR>,
    isCellActive: boolean,
    colSpan: number | undefined,
    index: number
  ) => T
): T[] {
  const results: T[] = [];
  // index of the first column after the previous cell, including the columns it spans
  let nextColumnIdx = 0;

  for (const column of viewportColumns) {
    // skip columns covered by colSpan.
    // The viewport columns are ordered by index, but there can be gaps between them,
    // so the skipped columns are counted by index, not by their position in the list
    if (column.idx < nextColumnIdx) continue;

    const colSpan =
      colSpanArgs &&
      getColSpan(column, lastStartFrozenColumnIndex, firstEndFrozenColumnIndex, colSpanArgs);
    results.push(callback(column, column.idx === activeColumnIdx, colSpan, results.length));
    nextColumnIdx = column.idx + (colSpan ?? 1);
  }

  return results;
}
