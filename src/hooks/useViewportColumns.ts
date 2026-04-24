import { useCallback, useMemo } from 'react';

import { getColSpan } from '../utils';
import type {
  CalculatedColumn,
  ColSpanArgs,
  IterateOverViewportColumns,
  IterateOverViewportColumnsForRow,
  Maybe,
  ViewportColumnWithColSpan
} from '../types';

interface ViewportColumnsArgs<R, SR> {
  columns: readonly CalculatedColumn<R, SR>[];
  colSpanColumns: readonly CalculatedColumn<R, SR>[];
  rows: readonly R[];
  topSummaryRows: Maybe<readonly SR[]>;
  bottomSummaryRows: Maybe<readonly SR[]>;
  colOverscanStartIdx: number;
  colOverscanEndIdx: number;
  lastFrozenColumnIndex: number;
  firstEndFrozenColumnIndex: number;
  rowOverscanStartIdx: number;
  rowOverscanEndIdx: number;
}

export function useViewportColumns<R, SR>({
  columns,
  colSpanColumns,
  rows,
  topSummaryRows,
  bottomSummaryRows,
  colOverscanStartIdx,
  colOverscanEndIdx,
  lastFrozenColumnIndex,
  firstEndFrozenColumnIndex,
  rowOverscanStartIdx,
  rowOverscanEndIdx
}: ViewportColumnsArgs<R, SR>) {
  // find the column that spans over a column within the visible columns range and adjust colOverscanStartIdx
  const startIdx = useMemo(() => {
    if (colOverscanStartIdx === 0) return 0;

    function* iterateOverRowsForColSpanArgs(): Generator<ColSpanArgs<R, SR>> {
      // check header row
      yield { type: 'HEADER' };

      // check top summary rows
      if (topSummaryRows != null) {
        for (const row of topSummaryRows) {
          yield { type: 'SUMMARY', row };
        }
      }

      // check viewport rows
      for (let rowIdx = rowOverscanStartIdx; rowIdx <= rowOverscanEndIdx; rowIdx++) {
        yield { type: 'ROW', row: rows[rowIdx] };
      }

      // check bottom summary rows
      if (bottomSummaryRows != null) {
        for (const row of bottomSummaryRows) {
          yield { type: 'SUMMARY', row };
        }
      }
    }

    for (const column of colSpanColumns) {
      if (column.frozen) continue;
      const colIdx = column.idx;
      if (colIdx >= colOverscanStartIdx) break;

      for (const args of iterateOverRowsForColSpanArgs()) {
        const colSpan = getColSpan(column, lastFrozenColumnIndex, firstEndFrozenColumnIndex, args);

        if (colSpan !== undefined && colIdx + colSpan > colOverscanStartIdx) {
          return colIdx;
        }
      }
    }

    return colOverscanStartIdx;
  }, [
    rowOverscanStartIdx,
    rowOverscanEndIdx,
    rows,
    topSummaryRows,
    bottomSummaryRows,
    colOverscanStartIdx,
    lastFrozenColumnIndex,
    firstEndFrozenColumnIndex,
    colSpanColumns
  ]);

  // Effective inclusive upper bound for overscan in the unfrozen band.
  // When end-frozen columns exist, unfrozen band ends just before them.
  const effectiveOverscanEndIdx =
    firstEndFrozenColumnIndex > -1
      ? Math.min(colOverscanEndIdx, firstEndFrozenColumnIndex - 1)
      : colOverscanEndIdx;

  const iterateOverViewportColumns = useCallback<IterateOverViewportColumns<R, SR>>(
    function* (activeColumnIdx): Generator<CalculatedColumn<R, SR>> {
      for (let colIdx = 0; colIdx <= lastFrozenColumnIndex; colIdx++) {
        yield columns[colIdx];
      }

      const unfrozenLastIdx =
        firstEndFrozenColumnIndex > -1 ? firstEndFrozenColumnIndex - 1 : columns.length - 1;

      if (lastFrozenColumnIndex < unfrozenLastIdx) {
        if (activeColumnIdx > lastFrozenColumnIndex && activeColumnIdx < startIdx) {
          yield columns[activeColumnIdx];
        }

        for (let colIdx = startIdx; colIdx <= effectiveOverscanEndIdx; colIdx++) {
          yield columns[colIdx];
        }

        if (activeColumnIdx > effectiveOverscanEndIdx && activeColumnIdx <= unfrozenLastIdx) {
          yield columns[activeColumnIdx];
        }
      }

      // Always yield end-frozen tail (virtualization must keep these in the DOM)
      if (firstEndFrozenColumnIndex > -1) {
        for (let colIdx = firstEndFrozenColumnIndex; colIdx < columns.length; colIdx++) {
          yield columns[colIdx];
        }
      }
    },
    [startIdx, effectiveOverscanEndIdx, columns, lastFrozenColumnIndex, firstEndFrozenColumnIndex]
  );

  const iterateOverViewportColumnsForRow = useCallback<IterateOverViewportColumnsForRow<R, SR>>(
    function* (activeColumnIdx = -1, args): Generator<ViewportColumnWithColSpan<R, SR>> {
      const iterator = iterateOverViewportColumns(activeColumnIdx);

      for (const column of iterator) {
        let colSpan =
          args && getColSpan(column, lastFrozenColumnIndex, firstEndFrozenColumnIndex, args);

        yield [column, column.idx === activeColumnIdx, colSpan];

        // skip columns covered by colSpan
        while (colSpan !== undefined && colSpan > 1) {
          iterator.next();
          colSpan--;
        }
      }
    },
    [iterateOverViewportColumns, lastFrozenColumnIndex, firstEndFrozenColumnIndex]
  );

  const iterateOverViewportColumnsForRowOutsideOfViewport = useCallback<
    IterateOverViewportColumnsForRow<R, SR>
  >(
    function* (activeColumnIdx = -1, args): Generator<ViewportColumnWithColSpan<R, SR>> {
      if (activeColumnIdx >= 0 && activeColumnIdx < columns.length) {
        const column = columns[activeColumnIdx];
        yield [
          column,
          true,
          args && getColSpan(column, lastFrozenColumnIndex, firstEndFrozenColumnIndex, args)
        ];
      }
    },
    [columns, lastFrozenColumnIndex, firstEndFrozenColumnIndex]
  );

  const viewportColumns = useMemo((): readonly CalculatedColumn<R, SR>[] => {
    return iterateOverViewportColumns(-1).toArray();
  }, [iterateOverViewportColumns]);

  return {
    viewportColumns,
    iterateOverViewportColumnsForRow,
    iterateOverViewportColumnsForRowOutsideOfViewport
  } as const;
}
