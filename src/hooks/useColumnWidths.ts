import { useLayoutEffect, useState } from 'react';
import { flushSync } from 'react-dom';

import type { CalculatedColumn, ColumnWidths, ResizedWidth } from '../types';
import type { DataGridProps } from '../DataGrid';

export function useColumnWidths<R, SR>(
  columns: readonly CalculatedColumn<R, SR>[],
  viewportColumns: readonly CalculatedColumn<R, SR>[],
  templateColumns: readonly string[],
  gridRef: React.RefObject<HTMLDivElement | null>,
  gridWidth: number,
  columnWidths: ColumnWidths,
  onColumnWidthsChange: (columnWidths: ColumnWidths) => void,
  onColumnResize: DataGridProps<R, SR>['onColumnResize'],
  setColumnResizing: (isColumnResizing: boolean) => void
) {
  const [columnToAutoResize, setColumnToAutoResize] = useState<{
    readonly key: string;
    readonly width: ResizedWidth;
  } | null>(null);
  const [columnsToMeasureOnResize, setColumnsToMeasureOnResize] =
    useState<ReadonlySet<string> | null>(null);
  const [prevGridWidth, setPreviousGridWidth] = useState(gridWidth);
  const columnsCanFlex: boolean = columns.length === viewportColumns.length;
  const ignorePreviouslyMeasuredColumnsOnGridWidthChange =
    // Allow columns to flex again when...
    columnsCanFlex &&
    // there is enough space for columns to flex and the grid was resized
    gridWidth !== prevGridWidth;
  const newTemplateColumns = [...templateColumns];
  const columnsToMeasure: string[] = [];

  for (const { key, idx, width } of viewportColumns) {
    const columnWidth = columnWidths.get(key);
    if (key === columnToAutoResize?.key) {
      newTemplateColumns[idx] =
        columnToAutoResize.width === 'max-content'
          ? columnToAutoResize.width
          : `${columnToAutoResize.width}px`;
      columnsToMeasure.push(key);
    } else if (
      typeof width === 'string' &&
      // If the column is resized by the user, we don't want to measure it again
      columnWidth?.type !== 'resized' &&
      (ignorePreviouslyMeasuredColumnsOnGridWidthChange ||
        columnsToMeasureOnResize?.has(key) === true ||
        columnWidth === undefined)
    ) {
      newTemplateColumns[idx] = width;
      columnsToMeasure.push(key);
    }
  }

  const gridTemplateColumns = newTemplateColumns.join(' ');

  useLayoutEffect(updateMeasuredAndResizedWidths);

  function updateMeasuredAndResizedWidths() {
    setPreviousGridWidth(gridWidth);
    if (columnsToMeasure.length === 0) return;

    const newColumnWidths = new Map(columnWidths);
    let hasChanges = false;

    for (const key of columnsToMeasure) {
      const measuredWidth = measureColumnWidth(gridRef, key);
      hasChanges ||= measuredWidth !== columnWidths.get(key)?.width;
      if (measuredWidth === undefined) {
        newColumnWidths.delete(key);
      } else {
        newColumnWidths.set(key, { type: 'measured', width: measuredWidth });
      }
    }

    if (columnToAutoResize !== null) {
      const resizingKey = columnToAutoResize.key;
      const oldWidth = columnWidths.get(resizingKey)?.width;
      const newWidth = measureColumnWidth(gridRef, resizingKey);
      if (newWidth !== undefined && oldWidth !== newWidth) {
        hasChanges = true;
        newColumnWidths.set(resizingKey, {
          type: 'resized',
          width: newWidth
        });
      }
      setColumnToAutoResize(null);
    }

    if (hasChanges) {
      onColumnWidthsChange(newColumnWidths);
    }
  }

  function handleColumnResize(column: CalculatedColumn<R, SR>, nextWidth: ResizedWidth) {
    const { key: resizingKey } = column;

    flushSync(() => {
      if (columnsCanFlex) {
        // remeasure all the columns that can flex and are not resized by the user
        const columnsToRemeasure = new Set<string>();
        for (const { key, width } of viewportColumns) {
          if (
            resizingKey !== key &&
            typeof width === 'string' &&
            columnWidths.get(key)?.type !== 'resized'
          ) {
            columnsToRemeasure.add(key);
          }
        }

        setColumnsToMeasureOnResize(columnsToRemeasure);
      }

      setColumnToAutoResize({
        key: resizingKey,
        width: nextWidth
      });

      setColumnResizing(typeof nextWidth === 'number');
    });

    setColumnsToMeasureOnResize(null);

    if (onColumnResize) {
      const previousWidth = columnWidths.get(resizingKey)?.width;
      const newWidth =
        typeof nextWidth === 'number' ? nextWidth : measureColumnWidth(gridRef, resizingKey);
      if (newWidth !== undefined && newWidth !== previousWidth) {
        onColumnResize(column, newWidth);
      }
    }
  }

  return {
    gridTemplateColumns,
    handleColumnResize
  } as const;
}

function measureColumnWidth(gridRef: React.RefObject<HTMLDivElement | null>, key: string) {
  const selector = `[data-measuring-cell-key="${CSS.escape(key)}"]`;
  const measuringCell = gridRef.current?.querySelector(selector);
  return measuringCell?.getBoundingClientRect().width;
}
