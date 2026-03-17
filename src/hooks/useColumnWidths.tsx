import { useCallback, useMemo, useSyncExternalStore, type RefObject } from 'react';

import { max, min } from '../utils';
import type { CalculatedColumn, ColumnWidths, ResizedWidth } from '../types';
import { useLatestFunc } from './useLatestFunc';
import type { DataGridProps } from '../DataGrid';

interface ColumnMetric {
  readonly width: number;
  readonly right: number;
}

const initialWidthsMap: ColumnWidths = new Map();

// use unmanaged WeakMaps so we preserve the cache even when
// the component partially unmounts via Suspense or Activity
const cellToGridRefMap = new WeakMap<HTMLDivElement, RefObject<HTMLDivElement | null>>();
const gridRefToWidthsMap = new WeakMap<RefObject<HTMLDivElement | null>, ColumnWidths>();
const subscribers = new Map<RefObject<HTMLDivElement | null>, () => void>();

// don't break in Node.js (SSR), jsdom, and environments that don't support ResizeObserver
const resizeObserver =
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  globalThis.ResizeObserver == null ? null : new ResizeObserver(resizeObserverCallback);

function resizeObserverCallback(entries: ResizeObserverEntry[]) {
  const updatedGrids = new Set<RefObject<HTMLDivElement | null>>();

  for (const entry of entries) {
    const cell = entry.target as HTMLDivElement;

    if (!cellToGridRefMap.has(cell)) continue;

    const gridRef = cellToGridRefMap.get(cell)!;
    const key = cell.dataset.measuringCellKey!;
    const previousWidthsMap = gridRefToWidthsMap.get(gridRef);
    const widthItem = previousWidthsMap?.get(key);
    const width = entry.contentBoxSize[0].inlineSize;

    // Avoid triggering re-renders if the size hasn't changed.
    // Per the explanation below, this check is safe:
    // no width -> state updates
    // `autosizing` -> width is a string -> type changes, state updates
    // other types must not change regardless of width change
    if (width === widthItem?.width) continue;

    // `autosizing` -> immediately `resized`
    // `resizing` -> remains `resizing` until the end of the user action
    // `resized` -> remains `resized`, may happen after external width changes
    // `measured` otherwise
    const type = widthItem?.type === 'autosizing' ? 'resized' : (widthItem?.type ?? 'measured');
    if (widthItem?.type === 'autosizing') {
      widthItem.onMeasure(width);
    }

    const widthsMap = new Map(previousWidthsMap);
    widthsMap.set(key, { type, width });
    gridRefToWidthsMap.set(gridRef, widthsMap);
    updatedGrids.add(gridRef);
  }

  for (const gridRef of updatedGrids) {
    subscribers.get(gridRef)?.();
  }
}

function getServerSnapshot(): ColumnWidths {
  return initialWidthsMap;
}

export function useColumnWidths<R, SR>(
  gridRef: React.RefObject<HTMLDivElement | null>,
  columns: readonly CalculatedColumn<R, SR>[],
  lastFrozenColumnIndex: number,
  gridWidth: number,
  scrollLeft: number,
  isResizingWidth: boolean,
  enableVirtualization: boolean,
  columnWidthsRaw: DataGridProps<R, SR>['columnWidths'],
  onColumnResize: DataGridProps<R, SR>['onColumnResize'],
  onColumnWidthsChangeRaw: DataGridProps<R, SR>['onColumnWidthsChange']
) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      subscribers.set(gridRef, onStoreChange);

      return () => {
        subscribers.delete(gridRef);
      };
    },
    [gridRef]
  );

  const getSnapshot = useCallback((): ColumnWidths => {
    // ref.current is null during the initial render, when suspending, or in <Activity mode="hidden">.
    // We use ref as key instead to access stable values regardless of rendering state.
    return gridRefToWidthsMap.get(gridRef) ?? initialWidthsMap;
  }, [gridRef]);

  const widthsMap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const { columnMetrics, totalColumnWidth, totalFrozenColumnWidth, layoutCssVars } = useMemo((): {
    columnMetrics: ReadonlyMap<CalculatedColumn<R, SR>, ColumnMetric>;
    totalColumnWidth: number;
    totalFrozenColumnWidth: number;
    layoutCssVars: Readonly<React.CSSProperties>;
  } => {
    const gridTemplateColumns: string[] = [];
    const columnMetrics = new Map<CalculatedColumn<R, SR>, ColumnMetric>();
    let left = 0;
    let totalColumnWidth = 0;
    let totalFrozenColumnWidth = 0;
    const layoutCssVars: React.CSSProperties = {};

    const isRevalidatingWidths =
      isResizingWidth ||
      widthsMap.values().some((item) => item.type === 'resizing' || item.type === 'autosizing');

    for (const column of columns) {
      const { key, idx, minWidth, maxWidth } = column;
      const internalWidthItem = widthsMap.get(key);
      const userWidthItem = columnWidthsRaw?.get(key);
      const widthItem =
        internalWidthItem?.type === 'resizing' || internalWidthItem?.type === 'autosizing'
          ? internalWidthItem
          : (userWidthItem ?? internalWidthItem);
      // resize columns when resizing the grid,
      // but preserve manually resized/resizing column widths
      const width =
        widthItem != null && (!isRevalidatingWidths || widthItem.type !== 'measured')
          ? widthItem.width
          : column.width;

      // This represents the width that will be used to compute virtualization.
      // Use the previously measured width if available, otherwise width or minWidth.
      const resolvedWidth: number =
        typeof widthItem?.width === 'number'
          ? widthItem.width
          : typeof column.width === 'number'
            ? clampColumnWidth(column.width, column)
            : column.minWidth;

      if (typeof width === 'number') {
        gridTemplateColumns.push(`${width}px`);
      } else if (width === 'auto') {
        gridTemplateColumns.push(
          typeof maxWidth === 'number'
            ? `minmax(auto, ${maxWidth}px)`
            : `minmax(${minWidth}px, auto)`
        );
      } else {
        gridTemplateColumns.push(width);
      }

      if (column.frozen) {
        totalFrozenColumnWidth += resolvedWidth;
        layoutCssVars[`--rdg-frozen-left-${idx}`] = `${left}px`;
      }

      totalColumnWidth += resolvedWidth;
      columnMetrics.set(column, { width: resolvedWidth, right: left + resolvedWidth });
      left += resolvedWidth;
    }

    layoutCssVars.gridTemplateColumns = gridTemplateColumns.join(' ');

    return {
      columnMetrics,
      totalColumnWidth,
      totalFrozenColumnWidth,
      layoutCssVars
    };
  }, [widthsMap, columnWidthsRaw, isResizingWidth, columns]);

  const renderAllColumns = !enableVirtualization || totalColumnWidth <= gridWidth;

  const [colOverscanStartIdx, colOverscanEndIdx] = useMemo((): [number, number] => {
    const lastColumnIndex = columns.length - 1;

    // render frozen columns only when all columns are frozen,
    // or when frozen columns cover the entire viewport
    if (lastColumnIndex === lastFrozenColumnIndex || totalFrozenColumnWidth >= gridWidth) {
      return [0, -1];
    }

    // get first and last non-frozen column indexes
    const firstUnfrozenColumnIdx = lastFrozenColumnIndex + 1;

    // render all columns
    if (renderAllColumns) {
      return [firstUnfrozenColumnIdx, lastColumnIndex];
    }

    // get the viewport's left side and right side positions for non-frozen columns
    const viewportLeft = scrollLeft + totalFrozenColumnWidth;
    const viewportRight = scrollLeft + gridWidth;

    // get the first visible non-frozen column index
    let colOverscanStartIdx = firstUnfrozenColumnIdx;
    while (colOverscanStartIdx < lastColumnIndex) {
      const { right } = columnMetrics.get(columns[colOverscanStartIdx])!;
      // if the right side of the columnn is beyond the left side of the available viewport,
      // then it is the first column that's at least partially visible
      if (right > viewportLeft) {
        break;
      }
      colOverscanStartIdx++;
    }

    // get the last visible non-frozen column index
    let colOverscanEndIdx = colOverscanStartIdx;
    while (colOverscanEndIdx < lastColumnIndex) {
      const { right } = columnMetrics.get(columns[colOverscanEndIdx])!;
      // if the right side of the column is beyond or equal to the right side of the available viewport,
      // then it the last column that's at least partially visible, as the previous column's right side is not beyond the viewport.
      if (right >= viewportRight) {
        break;
      }
      colOverscanEndIdx++;
    }

    return [
      max(firstUnfrozenColumnIdx, colOverscanStartIdx - 1),
      min(lastColumnIndex, colOverscanEndIdx + 1)
    ];
  }, [
    columnMetrics,
    columns,
    gridWidth,
    lastFrozenColumnIndex,
    renderAllColumns,
    scrollLeft,
    totalFrozenColumnWidth
  ]);

  const observeMeasuringCellRef = useCallback(
    (cell: HTMLDivElement) => {
      cellToGridRefMap.set(cell, gridRef);
      resizeObserver?.observe(cell);

      return () => {
        resizeObserver?.unobserve(cell);
      };
    },
    [gridRef]
  );

  const handleColumnResizeLatest = useLatestFunc(
    (column: CalculatedColumn<R, SR>, nextWidth: ResizedWidth) => {
      const previousWidth = columnMetrics.get(column)?.width;

      if (typeof nextWidth === 'number') {
        nextWidth = clampColumnWidth(nextWidth, column);

        if (nextWidth === previousWidth) {
          return;
        }
      }

      const { key } = column;
      const widthsMap = new Map(gridRefToWidthsMap.get(gridRef));
      const { promise, resolve } = Promise.withResolvers<number>();

      widthsMap.set(
        key,
        typeof nextWidth === 'number'
          ? { type: 'resizing', width: nextWidth }
          : { type: 'autosizing', width: nextWidth, onMeasure: resolve }
      );

      gridRefToWidthsMap.set(gridRef, widthsMap);

      subscribers.get(gridRef)?.();

      if (typeof nextWidth === 'string') {
        // force the observer to re-measure the cell
        // this is necessary if the nextWidth is the same as the previous width
        // ResizeObserver won't trigger if the size doesn't change
        const cell = gridRef.current!.querySelector(
          `:scope > [data-measuring-cell-key="${CSS.escape(key)}"]`
        )!;
        resizeObserver?.unobserve(cell);
        resizeObserver?.observe(cell);
        // alternatively, set up a new ResizeObserver just for this measurement
        // and immediately disconnect it after the first callback

        promise.then((newWidth) => {
          if (newWidth !== previousWidth) {
            onColumnResize?.(column, newWidth);
            onColumnWidthsChangeRaw?.(getSnapshot());
          }
        });
      } else {
        onColumnResize?.(column, nextWidth);
      }
    }
  );

  const handleColumnResizeEndLatest = useLatestFunc(() => {
    const widthsMap = new Map(gridRefToWidthsMap.get(gridRef));
    let hasUpdated = false;

    for (const [key, widthItem] of widthsMap) {
      if (widthItem.type === 'resizing') {
        widthsMap.set(key, { type: 'resized', width: widthItem.width });
        hasUpdated = true;
      }
    }

    if (!hasUpdated) return;

    gridRefToWidthsMap.set(gridRef, widthsMap);

    subscribers.get(gridRef)?.();

    onColumnWidthsChangeRaw?.(widthsMap);
  });

  return {
    colOverscanStartIdx,
    colOverscanEndIdx,
    totalFrozenColumnWidth,
    layoutCssVars,
    columnMetrics,
    observeMeasuringCellRef,
    handleColumnResizeLatest,
    handleColumnResizeEndLatest
  } as const;
}

function clampColumnWidth<R, SR>(
  width: number,
  { minWidth, maxWidth }: CalculatedColumn<R, SR>
): number {
  // ignore maxWidth if it less than minWidth
  if (typeof maxWidth === 'number' && maxWidth >= minWidth) {
    width = min(width, maxWidth);
  }

  return max(width, minWidth);
}
