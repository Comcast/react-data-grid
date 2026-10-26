import { useCallback, useMemo, useSyncExternalStore, type RefObject } from 'react';

import { createResizeObserverGetter, floor, isStartFrozen, max, min } from '../utils';
import type {
  CalculatedColumn,
  ColumnWidth,
  ColumnWidths,
  InternalColumnWidth,
  InternalColumnWidths,
  Maybe,
  ResizedWidth
} from '../types';
import { useLatestFunc } from './useLatestFunc';
import type { DataGridProps } from '../DataGrid';

interface ColumnMetric {
  readonly width: number;
  readonly right: number;
}

interface ColumnWidthsStore {
  // the `columnWidths` prop that the widths were measured and resized from
  readonly base: Maybe<ColumnWidths>;
  // the widths that were measured and resized since, which take precedence over the base widths
  readonly widths: InternalColumnWidths;
  // The measured widths are re-evaluated until the ResizeObserver measures the columns,
  // after the grid is mounted or a column is resized, and until the next animation frame after that.
  readonly revalidation: 'measuring' | 'measured' | 'none';
}

const initialStore: ColumnWidthsStore = {
  base: undefined,
  widths: new Map(),
  revalidation: 'measuring'
};

// use unmanaged WeakMaps so we preserve the cache even when
// the component partially unmounts via Suspense or Activity
const cellToGridRefMap = new WeakMap<HTMLDivElement, RefObject<HTMLDivElement | null>>();
const stores = new WeakMap<RefObject<HTMLDivElement | null>, ColumnWidthsStore>();
const subscribers = new WeakMap<RefObject<HTMLDivElement | null>, () => void>();
const getResizeObserver = createResizeObserverGetter(resizeObserverCallback);

// The grid is rendered again with the measurements while the ResizeObserver delivers them,
// so that it is laid out with them before it is painted.
// Observing new measuring cells, or changing the size of the cells, at that point would cause a ResizeObserver loop error,
// so these changes wait for the next animation frame, which runs before the ResizeObserver delivers measurements.
function resizeObserverCallback(entries: ResizeObserverEntry[]) {
  const measuredGrids = new Map<RefObject<HTMLDivElement | null>, Window>();
  const autosizedGrids = new Set<RefObject<HTMLDivElement | null>>();
  const updatedWidths = new Map<
    RefObject<HTMLDivElement | null>,
    Map<string, InternalColumnWidth>
  >();

  for (const entry of entries) {
    const cell = entry.target as HTMLDivElement;
    const gridRef = cellToGridRefMap.get(cell);

    if (gridRef === undefined) continue;

    measuredGrids.set(gridRef, cell.ownerDocument.defaultView!);

    // a column with a fixed width is only as wide as the grid sets it,
    // and measuring it would overwrite the width it was set from, which may be clamped
    if (!Object.hasOwn(cell.dataset, 'measuringCellFlexible')) continue;

    const key = cell.dataset.measuringCellKey!;
    const { base, widths } = stores.get(gridRef) ?? initialStore;
    const widthItem = widths.get(key) ?? base?.get(key);
    const width = entry.contentBoxSize[0].inlineSize;

    // avoid re-rendering if the width hasn't changed
    if (width === widthItem?.width) continue;

    const newWidths = updatedWidths.getOrInsertComputed(gridRef, () => new Map(widths));
    let newWidthItem: ColumnWidth | undefined = { type: 'measured', width };

    if (widthItem?.type === 'autosizing') {
      newWidthItem = widthItem.onMeasure(width);
      autosizedGrids.add(gridRef);
    }

    if (newWidthItem === undefined) {
      newWidths.delete(key);
    } else {
      newWidths.set(key, newWidthItem);
    }
  }

  for (const [gridRef, gridWindow] of measuredGrids) {
    const { base, widths, revalidation } = stores.get(gridRef) ?? initialStore;
    const newWidths = updatedWidths.get(gridRef);
    // The observations of a grid are delivered together,
    // so all the columns that changed size are now measured with the final width of the resized column.
    const isRevalidationEnding = revalidation === 'measuring' || autosizedGrids.has(gridRef);

    if (newWidths === undefined && !isRevalidationEnding) continue;

    setStore(gridRef, {
      base,
      widths: newWidths ?? widths,
      revalidation: isRevalidationEnding ? 'measured' : revalidation
    });

    if (isRevalidationEnding) {
      gridWindow.requestAnimationFrame(() => {
        const store = stores.get(gridRef);
        if (store?.revalidation === 'measured') {
          setStore(gridRef, { base: store.base, widths: store.widths, revalidation: 'none' });
        }
      });
    }
  }
}

function setStore(gridRef: RefObject<HTMLDivElement | null>, store: ColumnWidthsStore) {
  stores.set(gridRef, store);
  subscribers.get(gridRef)?.();
}

// The widths that were measured and resized are discarded when the `columnWidths` prop changes,
// except the widths of the column that is being resized,
// and the measured widths of the new `columnWidths` are re-evaluated
function rebaseStore(store: ColumnWidthsStore, base: Maybe<ColumnWidths>): ColumnWidthsStore {
  if (store.base === base) return store;

  const widths = new Map<string, InternalColumnWidth>();

  for (const [key, widthItem] of store.widths) {
    if (!isPublicWidth(widthItem)) {
      widths.set(key, widthItem);
    }
  }

  return { base, widths, revalidation: 'measuring' };
}

// `resizing` and `autosizing` widths only exist while a column is being resized
function isPublicWidth(widthItem: InternalColumnWidth): widthItem is ColumnWidth {
  return widthItem.type === 'measured' || widthItem.type === 'resized';
}

function getServerSnapshot(): ColumnWidthsStore {
  return initialStore;
}

function noop() {}

export function useColumnWidths<R, SR>(
  gridRef: React.RefObject<HTMLDivElement | null>,
  columns: readonly CalculatedColumn<R, SR>[],
  lastStartFrozenColumnIndex: number,
  firstEndFrozenColumnIndex: number,
  gridWidth: number,
  scrollLeft: number,
  previousGridWidth: number,
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

  const getSnapshot = useCallback((): ColumnWidthsStore => {
    // ref.current is null during the initial render, when suspending, or in <Activity mode="hidden">.
    // We use ref as key instead to access stable values regardless of rendering state.
    return stores.get(gridRef) ?? initialStore;
  }, [gridRef]);

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // Without `onColumnWidthsChange`, `columnWidths` only sets the initial widths,
  // and the grid keeps the widths it measured and that were resized afterwards,
  // including when `onColumnWidthsChange` is removed.
  const columnWidths =
    onColumnWidthsChangeRaw == null && snapshot !== initialStore ? snapshot.base : columnWidthsRaw;
  // the store is rebased when the measuring cells are attached, after rendering a new `columnWidths`
  const store = useMemo(() => rebaseStore(snapshot, columnWidths), [snapshot, columnWidths]);

  // let the columns flex while the grid is resized, until it is rendered again with its new width
  const isResizingWidth = gridWidth !== previousGridWidth;
  const isRevalidatingWidths =
    isResizingWidth ||
    store.revalidation !== 'none' ||
    // only look at the columns that are currently rendered,
    // stale entries of removed columns must not keep the widths revalidating forever
    columns.some((column) => {
      const type = store.widths.get(column.key)?.type;
      return type === 'resizing' || type === 'autosizing';
    });

  const {
    templateColumns,
    flexibleColumns,
    columnMetrics,
    totalColumnWidth,
    totalStartFrozenColumnWidth,
    totalEndFrozenColumnWidth,
    layoutCssVars
  } = useMemo((): {
    templateColumns: readonly string[];
    flexibleColumns: ReadonlySet<CalculatedColumn<R, SR>>;
    columnMetrics: ReadonlyMap<CalculatedColumn<R, SR>, ColumnMetric>;
    totalColumnWidth: number;
    totalStartFrozenColumnWidth: number;
    totalEndFrozenColumnWidth: number;
    layoutCssVars: Readonly<Record<string, string>>;
  } => {
    const templateColumns: string[] = [];
    // the columns whose width depends on their content or on the grid's width, so that they are measured
    const flexibleColumns = new Set<CalculatedColumn<R, SR>>();
    const columnMetrics = new Map<CalculatedColumn<R, SR>, ColumnMetric>();
    let left = 0;
    let totalColumnWidth = 0;
    let totalStartFrozenColumnWidth = 0;
    let totalEndFrozenColumnWidth = 0;
    const layoutCssVars: Record<string, string> = {};
    const { base, widths } = store;

    for (const column of columns) {
      const { key, idx, minWidth, maxWidth } = column;
      let widthItem = widths.get(key) ?? base?.get(key);

      // there is nothing to measure when the width is a number
      if (widthItem?.type === 'measured' && typeof column.width === 'number') {
        widthItem = undefined;
      }

      // resize columns when resizing the grid,
      // but preserve manually resized/resizing column widths
      const width =
        widthItem !== undefined && (!isRevalidatingWidths || widthItem.type !== 'measured')
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
        templateColumns.push(`${clampColumnWidth(width, column)}px`);
      } else {
        flexibleColumns.add(column);
        // `maxWidth` is ignored if `minWidth` is greater, as when clamping widths
        const hasMaxWidth = maxWidth !== undefined && maxWidth >= minWidth;

        if (width === 'auto') {
          // `auto` columns are stretched to fill the grid, so the column sets `maxWidth`,
          // while the cells and the measuring cell set the minimum width
          templateColumns.push(hasMaxWidth ? `minmax(auto, ${maxWidth}px)` : 'auto');
        } else if (isLengthPercentage(width)) {
          // the column is as wide as its width, regardless of the width of its cells
          templateColumns.push(
            hasMaxWidth
              ? `clamp(${minWidth}px, ${width}, ${maxWidth}px)`
              : `max(${minWidth}px, ${width})`
          );
        } else {
          templateColumns.push(width);
        }
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

    return {
      templateColumns,
      flexibleColumns,
      columnMetrics,
      totalColumnWidth,
      totalStartFrozenColumnWidth,
      totalEndFrozenColumnWidth,
      layoutCssVars
    };
  }, [store, isRevalidatingWidths, columns, firstEndFrozenColumnIndex]);

  // While the grid is resized, the columns keep the widths measured with its previous width,
  // so all the columns are still rendered if they fit in it. Otherwise, the columns that don't fit
  // in the grid's new width would be virtualized away until the columns are measured again,
  // and then rendered again, which would resize the other columns while the ResizeObserver delivers measurements.
  // The measured widths are fractional, and their sum can exceed the width of the grid they fill.
  const renderAllColumns =
    !enableVirtualization || floor(totalColumnWidth) <= max(gridWidth, previousGridWidth);

  const [colOverscanStartIdx, colOverscanEndIdx] = useMemo((): [number, number] => {
    // the non-frozen band ends right before the first end frozen column
    const lastUnfrozenColumnIdx =
      firstEndFrozenColumnIndex === -1 ? columns.length - 1 : firstEndFrozenColumnIndex - 1;

    // render frozen columns only when all columns are frozen
    if (lastUnfrozenColumnIdx === lastStartFrozenColumnIndex) {
      return [0, -1];
    }

    // get first and last non-frozen column indexes
    const firstUnfrozenColumnIdx = lastStartFrozenColumnIndex + 1;

    // render all columns
    if (renderAllColumns) {
      return [firstUnfrozenColumnIdx, lastUnfrozenColumnIdx];
    }

    // Render frozen columns only when they cover the entire viewport.
    // A grid without width isn't laid out yet, for example in a dialog that isn't open yet,
    // so it keeps rendering columns, as removing them would change the width of a grid sized by its content
    // when the ResizeObserver measures it, causing a ResizeObserver loop error.
    if (gridWidth > 0 && totalStartFrozenColumnWidth + totalEndFrozenColumnWidth >= gridWidth) {
      return [0, -1];
    }

    // get the viewport's left side and right side positions for non-frozen columns
    const viewportLeft = scrollLeft + totalStartFrozenColumnWidth;
    const viewportRight = scrollLeft + gridWidth - totalEndFrozenColumnWidth;

    // get the first visible non-frozen column index
    let colOverscanStartIdx = firstUnfrozenColumnIdx;
    while (colOverscanStartIdx < lastUnfrozenColumnIdx) {
      const { right } = columnMetrics.get(columns[colOverscanStartIdx])!;
      // if the right side of the column is beyond the left side of the available viewport,
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
      // then it is the last column that's at least partially visible, as the previous column's right side is not beyond the viewport.
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

  const { gridTemplateColumns, measuredColumns } = useMemo((): {
    gridTemplateColumns: string;
    measuredColumns: ReadonlySet<CalculatedColumn<R, SR>>;
  } => {
    const gridTemplateColumns: string[] = [];
    const measuredColumns = new Set<CalculatedColumn<R, SR>>();

    for (const column of columns) {
      const { idx } = column;
      const isInViewport =
        idx <= lastStartFrozenColumnIndex ||
        (idx >= colOverscanStartIdx && idx <= colOverscanEndIdx) ||
        (firstEndFrozenColumnIndex !== -1 && idx >= firstEndFrozenColumnIndex);

      // The columns outside of the viewport have no cells that their width could depend on,
      // so they keep the width they had when they were rendered, or their `minWidth`,
      // otherwise `auto` or `max-content` columns would collapse, for example.
      if (isInViewport) {
        gridTemplateColumns.push(templateColumns[idx]);

        if (flexibleColumns.has(column)) {
          measuredColumns.add(column);
        }
      } else {
        gridTemplateColumns.push(`${columnMetrics.get(column)!.width}px`);
      }
    }

    return { gridTemplateColumns: gridTemplateColumns.join(' '), measuredColumns };
  }, [
    columns,
    templateColumns,
    flexibleColumns,
    columnMetrics,
    lastStartFrozenColumnIndex,
    firstEndFrozenColumnIndex,
    colOverscanStartIdx,
    colOverscanEndIdx
  ]);

  function getPublicWidths({ base, widths }: ColumnWidthsStore): ColumnWidths {
    // Measurements are only a cache for the columns whose width is not a number,
    // but a `resized` width is intentional and must be preserved,
    // including for columns that are not rendered, for example because they were filtered out.
    const measuredKeys = new Set<string>();
    for (const column of columns) {
      if (typeof column.width !== 'number') {
        measuredKeys.add(column.key);
      }
    }

    const publicWidths = new Map<string, ColumnWidth>();

    for (const [key, widthItem] of base ?? []) {
      if (widthItem.type === 'resized' || measuredKeys.has(key)) {
        publicWidths.set(key, widthItem);
      }
    }

    for (const [key, widthItem] of widths) {
      if (!isPublicWidth(widthItem)) continue;

      if (widthItem.type === 'resized' || measuredKeys.has(key)) {
        publicWidths.set(key, widthItem);
      } else {
        publicWidths.delete(key);
      }
    }

    return publicWidths;
  }

  // The ref callback changes with `columnWidths`, so React attaches it again to every measuring cell
  // after rendering a new `columnWidths`: the store discards the widths that were measured and resized
  // since the previous one, and observing the cells again measures them again, even if their size didn't change.
  const observeMeasuringCellRef = useCallback(
    (cell: HTMLDivElement) => {
      const store = getSnapshot();
      const rebasedStore = rebaseStore(store, columnWidths);
      if (rebasedStore !== store) {
        setStore(gridRef, rebasedStore);
      }

      const resizeObserver = getResizeObserver(cell);
      // return a cleanup function regardless, or React would call the ref callback with `null`
      if (resizeObserver === null) return noop;

      cellToGridRefMap.set(cell, gridRef);
      // The cell can be attached while the ResizeObserver delivers measurements,
      // when they change the columns in the viewport, so it is observed in the next animation frame.
      const cellWindow = cell.ownerDocument.defaultView!;
      const frameRequest = cellWindow.requestAnimationFrame(() => {
        resizeObserver.observe(cell);
      });

      return () => {
        cellWindow.cancelAnimationFrame(frameRequest);
        resizeObserver.unobserve(cell);
      };
    },
    [gridRef, getSnapshot, columnWidths]
  );

  // force the observer to measure the cell again, as ResizeObserver only reports size changes
  function measureColumnAgain(key: string) {
    const cell = gridRef.current?.querySelector<HTMLDivElement>(
      `& > [data-measuring-cell-key="${CSS.escape(key)}"]`
    );

    if (cell == null) return;

    const resizeObserver = getResizeObserver(cell);
    resizeObserver?.unobserve(cell);
    resizeObserver?.observe(cell);
  }

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
      const { base, widths, revalidation } = getSnapshot();

      if (typeof nextWidth === 'number') {
        setStore(gridRef, {
          base,
          widths: new Map(widths).set(key, { type: 'resizing', width: nextWidth }),
          revalidation
        });
        onColumnResize?.(column, nextWidth);
        return;
      }

      const gridWindow = gridRef.current!.ownerDocument.defaultView!;
      const previousWidthItem = widths.get(key);

      function onMeasure(newWidth: number): ColumnWidth | undefined {
        // keep the width the column had if auto-sizing doesn't change it
        if (newWidth === previousWidth) {
          return previousWidthItem !== undefined && isPublicWidth(previousWidthItem)
            ? previousWidthItem
            : undefined;
        }

        // Report the new width in a new task, instead of while the ResizeObserver delivers it:
        // rendering the grid with the new `columnWidths` observes the measuring cells again,
        // which would lead to a ResizeObserver loop error.
        gridWindow.setTimeout(() => {
          onColumnResize?.(column, newWidth);
          onColumnWidthsChangeRaw?.(getPublicWidths(getSnapshot()));
        });

        return { type: 'resized', width: newWidth };
      }

      setStore(gridRef, {
        base,
        widths: new Map(widths).set(key, { type: 'autosizing', width: nextWidth, onMeasure }),
        revalidation
      });

      // this is necessary if the nextWidth is the same as the previous width
      measureColumnAgain(key);
    }
  );

  const handleColumnResizeEndLatest = useLatestFunc(() => {
    const { base, widths } = getSnapshot();
    const newWidths = new Map(widths);
    let hasUpdated = false;

    for (const [key, widthItem] of newWidths) {
      if (widthItem.type === 'resizing') {
        newWidths.set(key, { type: 'resized', width: widthItem.width });
        // The ResizeObserver may not have measured the other columns with the final width
        // of the resized column yet, for example when the pointer is released in the same frame
        // as it last moved, so the widths are revalidated until the column is measured again.
        measureColumnAgain(key);
        hasUpdated = true;
      }
    }

    if (!hasUpdated) return;

    const newStore: ColumnWidthsStore = { base, widths: newWidths, revalidation: 'measuring' };
    setStore(gridRef, newStore);
    onColumnWidthsChangeRaw?.(getPublicWidths(newStore));
  });

  return {
    colOverscanStartIdx,
    colOverscanEndIdx,
    totalStartFrozenColumnWidth,
    totalEndFrozenColumnWidth,
    gridTemplateColumns,
    layoutCssVars,
    columnMetrics,
    measuredColumns,
    observeMeasuringCellRef,
    handleColumnResizeLatest,
    handleColumnResizeEndLatest
  } as const;
}

const lengthPercentageRegex =
  /^(?:[+-]?(?:\d+\.?\d*|\.\d+)(?:%|[a-z]+)|(?:calc|min|max|clamp)\(.*\))$/i;

// lengths, percentages, and math functions like `calc()`, which can be clamped, unlike `fr` or keywords
function isLengthPercentage(width: string): boolean {
  return lengthPercentageRegex.test(width) && !width.endsWith('fr');
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
