import { useCallback, useMemo, useSyncExternalStore, type RefObject } from 'react';

import { isStartFrozen, max, min } from '../utils';
import type {
  CalculatedColumn,
  ColumnWidth,
  ColumnWidths,
  InternalColumnWidths,
  ResizedWidth
} from '../types';
import { useLatestFunc } from './useLatestFunc';
import type { DataGridProps } from '../DataGrid';

interface ColumnMetric {
  readonly width: number;
  readonly right: number;
}

const initialWidthsMap: InternalColumnWidths = new Map();

// use unmanaged WeakMaps so we preserve the cache even when
// the component partially unmounts via Suspense or Activity
const cellToGridRefMap = new WeakMap<HTMLDivElement, RefObject<HTMLDivElement | null>>();
const gridRefToWidthsMap = new WeakMap<RefObject<HTMLDivElement | null>, InternalColumnWidths>();
const subscribers = new Map<RefObject<HTMLDivElement | null>, () => void>();

// don't break in Node.js (SSR), jsdom, and environments that don't support ResizeObserver
const resizeObserver =
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  globalThis.ResizeObserver == null ? null : new ResizeObserver(resizeObserverCallback);

function resizeObserverCallback(entries: ResizeObserverEntry[]) {
  const updatedGrids = new Set<RefObject<HTMLDivElement | null>>();

  for (const entry of entries) {
    const cell = entry.target as HTMLDivElement;
    const gridRef = cellToGridRefMap.get(cell);

    if (gridRef === undefined) continue;

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

function getServerSnapshot(): InternalColumnWidths {
  return initialWidthsMap;
}

export function useColumnWidths<R, SR>(
  gridRef: React.RefObject<HTMLDivElement | null>,
  columns: readonly CalculatedColumn<R, SR>[],
  lastStartFrozenColumnIndex: number,
  firstEndFrozenColumnIndex: number,
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

  const getSnapshot = useCallback((): InternalColumnWidths => {
    // ref.current is null during the initial render, when suspending, or in <Activity mode="hidden">.
    // We use ref as key instead to access stable values regardless of rendering state.
    return gridRefToWidthsMap.get(gridRef) ?? initialWidthsMap;
  }, [gridRef]);

  const widthsMap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const {
    columnMetrics,
    totalColumnWidth,
    totalStartFrozenColumnWidth,
    totalEndFrozenColumnWidth,
    layoutCssVars
  } = useMemo((): {
    columnMetrics: ReadonlyMap<CalculatedColumn<R, SR>, ColumnMetric>;
    totalColumnWidth: number;
    totalStartFrozenColumnWidth: number;
    totalEndFrozenColumnWidth: number;
    layoutCssVars: Readonly<React.CSSProperties>;
  } => {
    const gridTemplateColumns: string[] = [];
    const columnMetrics = new Map<CalculatedColumn<R, SR>, ColumnMetric>();
    let left = 0;
    let totalColumnWidth = 0;
    let totalStartFrozenColumnWidth = 0;
    let totalEndFrozenColumnWidth = 0;
    const layoutCssVars: React.CSSProperties = {};

    // only look at the columns that are currently rendered,
    // stale entries of removed columns must not keep the widths revalidating forever
    const isRevalidatingWidths =
      isResizingWidth ||
      columns.some((column) => {
        const type = widthsMap.get(column.key)?.type;
        return type === 'resizing' || type === 'autosizing';
      });

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
      const unclampedResolvedWidth =
        typeof widthItem?.width === 'number' ? widthItem.width : column.width;
      const resolvedWidth: number =
        typeof unclampedResolvedWidth === 'number'
          ? clampColumnWidth(unclampedResolvedWidth, column)
          : column.minWidth;

      if (typeof width === 'number') {
        // the width can come from the `columnWidths` prop or the column definition,
        // it is not necessarily within the column's bounds
        gridTemplateColumns.push(`${clampColumnWidth(width, column)}px`);
      } else if (width === 'auto') {
        gridTemplateColumns.push(
          typeof maxWidth === 'number'
            ? `minmax(auto, ${maxWidth}px)`
            : `minmax(${minWidth}px, auto)`
        );
      } else {
        gridTemplateColumns.push(width);
      }

      if (isStartFrozen(column.frozen)) {
        totalStartFrozenColumnWidth += resolvedWidth;
        layoutCssVars[`--rdg-frozen-start-${idx}`] = `${left}px`;
      }

      totalColumnWidth += resolvedWidth;
      columnMetrics.set(column, { width: resolvedWidth, right: left + resolvedWidth });
      left += resolvedWidth;
    }

    // end frozen columns are a contiguous tail, so their offsets are measured from the grid's end
    if (firstEndFrozenColumnIndex !== -1) {
      for (let i = columns.length - 1; i >= firstEndFrozenColumnIndex; i--) {
        const column = columns[i];
        layoutCssVars[`--rdg-frozen-end-${column.idx}`] = `${totalEndFrozenColumnWidth}px`;
        totalEndFrozenColumnWidth += columnMetrics.get(column)!.width;
      }
    }

    layoutCssVars.gridTemplateColumns = gridTemplateColumns.join(' ');

    return {
      columnMetrics,
      totalColumnWidth,
      totalStartFrozenColumnWidth,
      totalEndFrozenColumnWidth,
      layoutCssVars
    };
  }, [widthsMap, columnWidthsRaw, isResizingWidth, columns, firstEndFrozenColumnIndex]);

  const renderAllColumns = !enableVirtualization || totalColumnWidth <= gridWidth;

  const [colOverscanStartIdx, colOverscanEndIdx] = useMemo((): [number, number] => {
    // the non-frozen band ends right before the first end frozen column
    const lastUnfrozenColumnIdx =
      firstEndFrozenColumnIndex === -1 ? columns.length - 1 : firstEndFrozenColumnIndex - 1;

    // render frozen columns only when all columns are frozen,
    // or when frozen columns cover the entire viewport
    if (
      lastUnfrozenColumnIdx === lastStartFrozenColumnIndex ||
      totalStartFrozenColumnWidth + totalEndFrozenColumnWidth >= gridWidth
    ) {
      return [0, -1];
    }

    // get first and last non-frozen column indexes
    const firstUnfrozenColumnIdx = lastStartFrozenColumnIndex + 1;

    // render all columns
    if (renderAllColumns) {
      return [firstUnfrozenColumnIdx, lastUnfrozenColumnIdx];
    }

    // get the viewport's left side and right side positions for non-frozen columns
    const viewportLeft = scrollLeft + totalStartFrozenColumnWidth;
    const viewportRight = scrollLeft + gridWidth - totalEndFrozenColumnWidth;

    // get the first visible non-frozen column index
    let colOverscanStartIdx = firstUnfrozenColumnIdx;
    while (colOverscanStartIdx < lastUnfrozenColumnIdx) {
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
    while (colOverscanEndIdx < lastUnfrozenColumnIdx) {
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
      min(lastUnfrozenColumnIdx, colOverscanEndIdx + 1)
    ];
  }, [
    columnMetrics,
    columns,
    gridWidth,
    lastStartFrozenColumnIndex,
    firstEndFrozenColumnIndex,
    renderAllColumns,
    scrollLeft,
    totalStartFrozenColumnWidth,
    totalEndFrozenColumnWidth
  ]);

  function getPublicWidths(widthsMap: InternalColumnWidths): ColumnWidths {
    const newWidthsMap = new Map<string, ColumnWidth>();

    for (const [key, widthItem] of widthsMap) {
      // `resizing`/`autosizing` only exist mid-interaction and are not part of the public type
      if (widthItem.type === 'measured' || widthItem.type === 'resized') {
        newWidthsMap.set(key, widthItem);
      }
    }

    // Measurements are only ever re-evaluated, but a `resized` width is intentional and must be
    // preserved: it is not measured internally when it comes from a column that is not rendered,
    // and it is marked as `measured` when the column is rendered, which would lose the intent.
    for (const [key, widthItem] of columnWidthsRaw ?? []) {
      if (widthItem.type === 'resized' && newWidthsMap.get(key)?.type !== 'resized') {
        newWidthsMap.set(key, widthItem);
      }
    }

    return newWidthsMap;
  }

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
          `& > [data-measuring-cell-key="${CSS.escape(key)}"]`
        )!;
        resizeObserver?.unobserve(cell);
        resizeObserver?.observe(cell);
        // alternatively, set up a new ResizeObserver just for this measurement
        // and immediately disconnect it after the first callback

        promise.then((newWidth) => {
          if (newWidth !== previousWidth) {
            onColumnResize?.(column, newWidth);
            onColumnWidthsChangeRaw?.(getPublicWidths(getSnapshot()));
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

    onColumnWidthsChangeRaw?.(getPublicWidths(widthsMap));
  });

  return {
    colOverscanStartIdx,
    colOverscanEndIdx,
    totalStartFrozenColumnWidth,
    totalEndFrozenColumnWidth,
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
  // ignore maxWidth if minWidth is greater
  if (typeof maxWidth === 'number' && maxWidth >= minWidth) {
    width = min(width, maxWidth);
  }

  return max(width, minWidth);
}
