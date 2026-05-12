import { useMemo } from 'react';

import { floor, max, min } from '../utils';

interface ViewportRowsBaseArgs<R> {
  rows: readonly R[];
  clientHeight: number;
  scrollTop: number;
  enableVirtualization: boolean;
  gridHeight?: number;
}

interface ViewportRowsArgsStringHeight {
  rowHeight: string;
  element: HTMLElement | null;
  gridHeight: number;
}

interface ViewportRowsArgsRegularHeight<R> {
  rowHeight: number | ((row: R) => number);
}

type ViewportRowsArgs<R> = ViewportRowsBaseArgs<R> &
  (ViewportRowsArgsStringHeight | ViewportRowsArgsRegularHeight<R>);

export function useViewportRows<R>({
  rows,
  rowHeight,
  clientHeight,
  scrollTop,
  enableVirtualization,
  ...rest
}: ViewportRowsArgs<R>) {
  const { totalRowHeight, gridTemplateRows, getRowTop, getRowHeight, findRowIdx } = useMemo(() => {
    if (typeof rowHeight === 'number') {
      return {
        totalRowHeight: rowHeight * rows.length,
        gridTemplateRows: ` repeat(${rows.length}, ${rowHeight}px)`,
        getRowTop: (rowIdx: number) => rowIdx * rowHeight,
        getRowHeight: () => rowHeight,
        findRowIdx: (offset: number) => floor(offset / rowHeight)
      };
    }

    if (typeof rowHeight === 'string') {
      const { element, gridHeight } = rest as ViewportRowsArgsStringHeight;
      if (!gridHeight) {
        throw new Error(
          'props.gridHeight is required when rowHeight is a string. This is needed to calculate the total height of the rows.'
        );
      }

      const getRowElementFirstCell = (element: Element, rowIdx: number): Element | null => {
        const nth = element.querySelector('.rdg-header-row') ? rowIdx + 2 : rowIdx + 1;
        return element.querySelector(`[role="row"][aria-rowindex="${nth}"] > [role="gridcell"]`);
      };

      const getRowYTop = (element: Element, rowIdx: number) => {
        const cell = getRowElementFirstCell(element, rowIdx);
        if (!cell) return -1;
        return cell.getBoundingClientRect().top + element.scrollTop;
      };

      return {
        totalRowHeight: gridHeight ?? 0,
        gridTemplateRows: ` repeat(${rows.length}, ${rowHeight})`,
        getRowTop(rowIdx: number) {
          if (!element) return -1;
          const cell = getRowElementFirstCell(element, rowIdx);
          if (!cell) return -1;
          return cell.getBoundingClientRect().top + element.scrollTop;
        },
        getRowHeight(rowIdx: number) {
          if (!element) return -1;
          const cell = getRowElementFirstCell(element, rowIdx);
          if (!cell) return -1;
          return cell.clientHeight;
        },
        findRowIdx(offset: number) {
          if (!element) return -1;
          let start = 0;
          let end = rows.length - 1;

          while (start <= end) {
            const middle = start + floor((end - start) / 2);
            const currentScrollTop = getRowYTop(element, middle);
            const prevScrollTop = getRowYTop(element, middle - 1);

            if (currentScrollTop >= offset && prevScrollTop < offset) return middle;

            if (currentScrollTop < offset) {
              start = middle + 1;
            } else if (currentScrollTop > offset) {
              end = middle - 1;
            }

            if (start > end) return end;
          }

          return -1;
        }
      };
    }

    // Calcule the height of all the rows upfront. This can cause performance issues
    // and we can consider using a similar approach as react-window
    // https://github.com/bvaughn/react-window/blob/b0a470cc264e9100afcaa1b78ed59d88f7914ad4/src/VariableSizeList.js#L68
    let totalRowHeight = 0;
    let gridTemplateRows = '';
    let currentHeight: number | null = null;
    let repeatCount = 0;

    const rowPositions = rows.map((row, index) => {
      const currentRowHeight = rowHeight(row);

      const position = {
        top: totalRowHeight,
        height: currentRowHeight
      };
      totalRowHeight += currentRowHeight;

      if (currentHeight === null) {
        currentHeight = currentRowHeight;
        repeatCount = 1;
      } else if (currentHeight === currentRowHeight) {
        // If the current row height is the same as the previous one, increment the repeat count
        repeatCount++;
      } else {
        if (repeatCount > 1) {
          gridTemplateRows += `repeat(${repeatCount}, ${currentHeight}px) `;
        } else {
          gridTemplateRows += `${currentHeight}px `;
        }

        currentHeight = currentRowHeight;
        repeatCount = 1;
      }

      if (index === rows.length - 1) {
        if (repeatCount > 1) {
          gridTemplateRows += `repeat(${repeatCount}, ${currentHeight}px)`;
        } else {
          gridTemplateRows += `${currentHeight}px`;
        }
      }

      return position;
    });

    const validateRowIdx = (rowIdx: number) => {
      return max(0, min(rows.length - 1, rowIdx));
    };

    return {
      totalRowHeight,
      gridTemplateRows,
      getRowTop: (rowIdx: number) => rowPositions[validateRowIdx(rowIdx)].top,
      getRowHeight: (rowIdx: number) => rowPositions[validateRowIdx(rowIdx)].height,
      findRowIdx(offset: number) {
        let start = 0;
        let end = rowPositions.length - 1;
        while (start <= end) {
          const middle = start + floor((end - start) / 2);
          const currentOffset = rowPositions[middle].top;

          if (currentOffset === offset) return middle;

          if (currentOffset < offset) {
            start = middle + 1;
          } else if (currentOffset > offset) {
            end = middle - 1;
          }

          if (start > end) return end;
        }
        return 0;
      }
    };
  }, [rowHeight, rows]);

  let rowOverscanStartIdx = 0;
  let rowOverscanEndIdx = rows.length - 1;

  if (enableVirtualization) {
    const overscanThreshold = 4;
    const rowVisibleStartIdx = findRowIdx(scrollTop);
    const rowVisibleEndIdx = findRowIdx(scrollTop + clientHeight);
    rowOverscanStartIdx = max(0, rowVisibleStartIdx - overscanThreshold);
    rowOverscanEndIdx = min(rows.length - 1, rowVisibleEndIdx + overscanThreshold);
  }

  return {
    rowOverscanStartIdx,
    rowOverscanEndIdx,
    totalRowHeight,
    gridTemplateRows,
    getRowTop,
    getRowHeight,
    findRowIdx
  };
}
