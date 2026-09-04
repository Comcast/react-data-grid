import { useCallback, useMemo } from 'react';

import { getColSpan, min } from '../utils';
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
  lastStartFrozenColumnIndex: number;
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
  lastStartFrozenColumnIndex,
  firstEndFrozenColumnIndex,
  rowOverscanStartIdx,
  rowOverscanEndIdx
}: ViewportColumnsArgs<R, SR>) {
  // find the column that spans over a column within the visible columns range and adjust colOverscanStartIdx
  const startIdx = useMemo(() => {
    if (colOverscanStartIdx === 0) return 0;

    for (const column of colSpanColumns) {
      if (column.frozen) continue;
      const colIdx = column.idx;
      if (colIdx >= colOverscanStartIdx) break;

      for (const args of iterateOverRowsForColSpanArgs<R, SR>(
        rows,
        topSummaryRows,
        bottomSummaryRows,
        rowOverscanStartIdx,
        rowOverscanEndIdx
      )) {
        const colSpan = getColSpan(
          column,
          lastStartFrozenColumnIndex,
          firstEndFrozenColumnIndex,
          args
        );

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
    lastStartFrozenColumnIndex,
    firstEndFrozenColumnIndex,
    colSpanColumns
  ]);

  // Effective inclusive upper bound for overscan in the unfrozen band.
  // When end-frozen columns exist, unfrozen band ends just before them.
  const effectiveOverscanEndIdx =
    firstEndFrozenColumnIndex > -1
      ? min(colOverscanEndIdx, firstEndFrozenColumnIndex - 1)
      : colOverscanEndIdx;

  const iterateOverViewportColumns = useCallback<IterateOverViewportColumns<R, SR>>(
    (activeColumnIdx) =>
      iterateOverColumns(
        columns,
        lastStartFrozenColumnIndex,
        firstEndFrozenColumnIndex,
        startIdx,
        effectiveOverscanEndIdx,
        activeColumnIdx
      ),
    [
      startIdx,
      effectiveOverscanEndIdx,
      columns,
      lastStartFrozenColumnIndex,
      firstEndFrozenColumnIndex
    ]
  );

  const iterateOverViewportColumnsForRow = useCallback<IterateOverViewportColumnsForRow<R, SR>>(
    (activeColumnIdx = -1, args) =>
      iterateOverColumnsForRow(
        iterateOverViewportColumns(activeColumnIdx),
        activeColumnIdx,
        lastStartFrozenColumnIndex,
        firstEndFrozenColumnIndex,
        args
      ),
    [iterateOverViewportColumns, lastStartFrozenColumnIndex, firstEndFrozenColumnIndex]
  );

  const iterateOverViewportColumnsForRowOutsideOfViewport = useCallback<
    IterateOverViewportColumnsForRow<R, SR>
  >(
    (activeColumnIdx = -1, args) =>
      iterateOverColumnForRowOutsideOfViewport(
        columns,
        lastStartFrozenColumnIndex,
        firstEndFrozenColumnIndex,
        activeColumnIdx,
        args
      ),
    [columns, lastStartFrozenColumnIndex, firstEndFrozenColumnIndex]
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

function* iterateOverRowsForColSpanArgs<R, SR>(
  rows: readonly R[],
  topSummaryRows: Maybe<readonly SR[]>,
  bottomSummaryRows: Maybe<readonly SR[]>,
  rowOverscanStartIdx: number,
  rowOverscanEndIdx: number
): Generator<ColSpanArgs<R, SR>> {
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

function* iterateOverColumns<R, SR>(
  columns: readonly CalculatedColumn<R, SR>[],
  lastStartFrozenColumnIndex: number,
  firstEndFrozenColumnIndex: number,
  startIdx: number,
  effectiveOverscanEndIdx: number,
  activeColumnIdx: number
): Generator<CalculatedColumn<R, SR>> {
  for (let colIdx = 0; colIdx <= lastStartFrozenColumnIndex; colIdx++) {
    yield columns[colIdx];
  }

  const unfrozenLastIdx =
    firstEndFrozenColumnIndex > -1 ? firstEndFrozenColumnIndex - 1 : columns.length - 1;

  if (lastStartFrozenColumnIndex < unfrozenLastIdx) {
    if (activeColumnIdx > lastStartFrozenColumnIndex && activeColumnIdx < startIdx) {
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
}

function* iterateOverColumnsForRow<R, SR>(
  iterator: IteratorObject<CalculatedColumn<R, SR>>,
  activeColumnIdx: number,
  lastStartFrozenColumnIndex: number,
  firstEndFrozenColumnIndex: number,
  args: ColSpanArgs<R, SR> | undefined
): Generator<ViewportColumnWithColSpan<R, SR>> {
  for (const column of iterator) {
    let colSpan =
      args && getColSpan(column, lastStartFrozenColumnIndex, firstEndFrozenColumnIndex, args);

    yield [column, column.idx === activeColumnIdx, colSpan];

    // skip columns covered by colSpan
    while (colSpan !== undefined && colSpan > 1) {
      iterator.next();
      colSpan--;
    }
  }
}

function* iterateOverColumnForRowOutsideOfViewport<R, SR>(
  columns: readonly CalculatedColumn<R, SR>[],
  lastStartFrozenColumnIndex: number,
  firstEndFrozenColumnIndex: number,
  activeColumnIdx: number,
  args: ColSpanArgs<R, SR> | undefined
): Generator<ViewportColumnWithColSpan<R, SR>> {
  if (activeColumnIdx >= 0 && activeColumnIdx < columns.length) {
    const column = columns[activeColumnIdx];
    yield [
      column,
      true,
      args && getColSpan(column, lastStartFrozenColumnIndex, firstEndFrozenColumnIndex, args)
    ];
  }
}
