import { useMemo } from 'react';

import { clampColumnWidth, isStartFrozen, max, min } from '../utils';
import type {
  CalculatedColumn,
  CalculatedColumnParent,
  ColumnFrozen,
  ColumnOrColumnGroup,
  Omit
} from '../types';
import { renderValue } from '../cellRenderers';
import { SELECT_COLUMN_KEY } from '../Columns';
import type { DataGridProps } from '../DataGrid';
import renderHeaderCell from '../renderHeaderCell';

type Mutable<T> = {
  -readonly [P in keyof T]: T[P] extends readonly (infer V)[] ? Mutable<V>[] : T[P];
};

interface WithParent<R, SR> {
  readonly parent: MutableCalculatedColumnParent<R, SR> | undefined;
}

type MutableCalculatedColumnParent<R, SR> = Omit<Mutable<CalculatedColumnParent<R, SR>>, 'parent'> &
  WithParent<R, SR>;
type MutableCalculatedColumn<R, SR> = Omit<Mutable<CalculatedColumn<R, SR>>, 'parent'> &
  WithParent<R, SR>;

interface ColumnMetric {
  width: number;
  left: number;
}

const DEFAULT_COLUMN_WIDTH = 'auto';
const DEFAULT_COLUMN_MIN_WIDTH = 50;

interface CalculatedColumnsArgs<R, SR> {
  rawColumns: readonly ColumnOrColumnGroup<R, SR>[];
  defaultColumnOptions: DataGridProps<R, SR>['defaultColumnOptions'];
  viewportWidth: number;
  scrollLeft: number;
  getColumnWidth: (column: CalculatedColumn<R, SR>) => string | number;
  enableVirtualization: boolean;
}

export function useCalculatedColumns<R, SR>({
  rawColumns,
  defaultColumnOptions,
  getColumnWidth,
  viewportWidth,
  scrollLeft,
  enableVirtualization
}: CalculatedColumnsArgs<R, SR>) {
  const defaultWidth = defaultColumnOptions?.width ?? DEFAULT_COLUMN_WIDTH;
  const defaultMinWidth = defaultColumnOptions?.minWidth ?? DEFAULT_COLUMN_MIN_WIDTH;
  const defaultMaxWidth = defaultColumnOptions?.maxWidth ?? undefined;
  const defaultRenderCell = defaultColumnOptions?.renderCell ?? renderValue;
  const defaultRenderHeaderCell = defaultColumnOptions?.renderHeaderCell ?? renderHeaderCell;
  const defaultSortable = defaultColumnOptions?.sortable ?? false;
  const defaultResizable = defaultColumnOptions?.resizable ?? false;
  const defaultDraggable = defaultColumnOptions?.draggable ?? false;

  const {
    columns,
    colSpanColumns,
    lastFrozenColumnIndex,
    firstEndFrozenColumnIndex,
    headerRowsCount
  } = useMemo((): {
    readonly columns: readonly CalculatedColumn<R, SR>[];
    readonly colSpanColumns: readonly CalculatedColumn<R, SR>[];
    readonly lastFrozenColumnIndex: number;
    readonly firstEndFrozenColumnIndex: number;
    readonly headerRowsCount: number;
  } => {
    let lastFrozenColumnIndex = -1;
    let firstEndFrozenColumnIndex = -1;
    let headerRowsCount = 1;
    const columns: MutableCalculatedColumn<R, SR>[] = [];

    collectColumns(rawColumns, 1);

    function collectColumns(
      rawColumns: readonly ColumnOrColumnGroup<R, SR>[],
      level: number,
      parent?: MutableCalculatedColumnParent<R, SR>
    ) {
      for (const rawColumn of rawColumns) {
        if ('children' in rawColumn) {
          const calculatedColumnParent: MutableCalculatedColumnParent<R, SR> = {
            name: rawColumn.name,
            parent,
            idx: -1,
            colSpan: 0,
            level: 0,
            headerCellClass: rawColumn.headerCellClass
          };

          collectColumns(rawColumn.children, level + 1, calculatedColumnParent);
          continue;
        }

        const frozen: ColumnFrozen = rawColumn.frozen ?? false;

        const column: MutableCalculatedColumn<R, SR> = {
          ...rawColumn,
          parent,
          idx: 0,
          level: 0,
          frozen,
          width: rawColumn.width ?? defaultWidth,
          minWidth: rawColumn.minWidth ?? defaultMinWidth,
          maxWidth: rawColumn.maxWidth ?? defaultMaxWidth,
          sortable: rawColumn.sortable ?? defaultSortable,
          resizable: rawColumn.resizable ?? defaultResizable,
          draggable: rawColumn.draggable ?? defaultDraggable,
          renderCell: rawColumn.renderCell ?? defaultRenderCell,
          renderHeaderCell: rawColumn.renderHeaderCell ?? defaultRenderHeaderCell
        };

        columns.push(column);

        if (isStartFrozen(frozen)) {
          lastFrozenColumnIndex++;
        }

        if (level > headerRowsCount) {
          headerRowsCount = level;
        }
      }
    }

    columns.sort((a, b) => {
      // Sort select column first:
      if (a.key === SELECT_COLUMN_KEY) return -1;
      if (b.key === SELECT_COLUMN_KEY) return 1;

      // Sort by band: start-frozen → unfrozen → end-frozen.
      // Stable sort preserves definition order within each band.
      const ra = a.frozen === 'end' ? 2 : a.frozen === false ? 1 : 0;
      const rb = b.frozen === 'end' ? 2 : b.frozen === false ? 1 : 0;
      return ra - rb;
    });

    const colSpanColumns: CalculatedColumn<R, SR>[] = [];
    columns.forEach((column, idx) => {
      column.idx = idx;
      updateColumnParent(column, idx, 0);

      if (column.colSpan != null) {
        colSpanColumns.push(column);
      }

      if (column.frozen === 'end' && firstEndFrozenColumnIndex === -1) {
        firstEndFrozenColumnIndex = idx;
      }
    });

    return {
      columns,
      colSpanColumns,
      lastFrozenColumnIndex,
      firstEndFrozenColumnIndex,
      headerRowsCount
    };
  }, [
    rawColumns,
    defaultWidth,
    defaultMinWidth,
    defaultMaxWidth,
    defaultRenderCell,
    defaultRenderHeaderCell,
    defaultResizable,
    defaultSortable,
    defaultDraggable
  ]);

  const {
    templateColumns,
    layoutCssVars,
    totalFrozenColumnWidth,
    totalEndFrozenColumnWidth,
    columnMetrics
  } = useMemo((): {
    templateColumns: readonly string[];
    layoutCssVars: Readonly<Record<string, string>>;
    totalFrozenColumnWidth: number;
    totalEndFrozenColumnWidth: number;
    columnMetrics: ReadonlyMap<CalculatedColumn<R, SR>, ColumnMetric>;
  } => {
    const columnMetrics = new Map<CalculatedColumn<R, SR>, ColumnMetric>();
    let left = 0;
    let totalFrozenColumnWidth = 0;
    let totalEndFrozenColumnWidth = 0;
    const templateColumns: string[] = [];

    for (const column of columns) {
      let width = getColumnWidth(column);

      if (typeof width === 'number') {
        width = clampColumnWidth(width, column);
      } else {
        // This is a placeholder width so we can continue to use virtualization.
        // The actual value is set after the column is rendered
        width = column.minWidth;
      }
      templateColumns.push(`${width}px`);
      columnMetrics.set(column, { width, left });
      left += width;
    }

    if (lastFrozenColumnIndex !== -1) {
      const columnMetric = columnMetrics.get(columns[lastFrozenColumnIndex])!;
      totalFrozenColumnWidth = columnMetric.left + columnMetric.width;
    }

    const layoutCssVars: Record<string, string> = {};

    for (let i = 0; i <= lastFrozenColumnIndex; i++) {
      const column = columns[i];
      layoutCssVars[`--rdg-frozen-left-${column.idx}`] = `${columnMetrics.get(column)!.left}px`;
    }

    if (firstEndFrozenColumnIndex !== -1) {
      const lastColumn = columns[columns.length - 1];
      const lastMetric = columnMetrics.get(lastColumn)!;
      const gridEnd = lastMetric.left + lastMetric.width;
      const firstEndMetric = columnMetrics.get(columns[firstEndFrozenColumnIndex])!;
      totalEndFrozenColumnWidth = gridEnd - firstEndMetric.left;

      for (let i = firstEndFrozenColumnIndex; i < columns.length; i++) {
        const column = columns[i];
        const metric = columnMetrics.get(column)!;
        layoutCssVars[`--rdg-frozen-end-${column.idx}`] =
          `${gridEnd - (metric.left + metric.width)}px`;
      }
    }

    return {
      templateColumns,
      layoutCssVars,
      totalFrozenColumnWidth,
      totalEndFrozenColumnWidth,
      columnMetrics
    };
  }, [getColumnWidth, columns, lastFrozenColumnIndex, firstEndFrozenColumnIndex]);

  const [colOverscanStartIdx, colOverscanEndIdx] = useMemo((): [number, number] => {
    if (!enableVirtualization) {
      return [0, columns.length - 1];
    }
    // get the viewport's left side and right side positions for non-frozen columns
    const viewportLeft = scrollLeft + totalFrozenColumnWidth;
    const viewportRight = scrollLeft + viewportWidth;
    // get first and last non-frozen column indexes
    const lastColIdx = columns.length - 1;
    const firstUnfrozenColumnIdx = min(lastFrozenColumnIndex + 1, lastColIdx);

    // skip rendering non-frozen columns if the frozen columns cover the entire viewport
    if (viewportLeft >= viewportRight) {
      return [firstUnfrozenColumnIdx, firstUnfrozenColumnIdx];
    }

    // get the first visible non-frozen column index
    let colVisibleStartIdx = firstUnfrozenColumnIdx;
    while (colVisibleStartIdx < lastColIdx) {
      const { left, width } = columnMetrics.get(columns[colVisibleStartIdx])!;
      // if the right side of the columnn is beyond the left side of the available viewport,
      // then it is the first column that's at least partially visible
      if (left + width > viewportLeft) {
        break;
      }
      colVisibleStartIdx++;
    }

    // get the last visible non-frozen column index
    let colVisibleEndIdx = colVisibleStartIdx;
    while (colVisibleEndIdx < lastColIdx) {
      const { left, width } = columnMetrics.get(columns[colVisibleEndIdx])!;
      // if the right side of the column is beyond or equal to the right side of the available viewport,
      // then it the last column that's at least partially visible, as the previous column's right side is not beyond the viewport.
      if (left + width >= viewportRight) {
        break;
      }
      colVisibleEndIdx++;
    }

    const colOverscanStartIdx = max(firstUnfrozenColumnIdx, colVisibleStartIdx - 1);
    const colOverscanEndIdx = min(lastColIdx, colVisibleEndIdx + 1);

    return [colOverscanStartIdx, colOverscanEndIdx];
  }, [
    columnMetrics,
    columns,
    lastFrozenColumnIndex,
    scrollLeft,
    totalFrozenColumnWidth,
    viewportWidth,
    enableVirtualization
  ]);

  return {
    columns,
    colSpanColumns,
    colOverscanStartIdx,
    colOverscanEndIdx,
    templateColumns,
    layoutCssVars,
    headerRowsCount,
    lastFrozenColumnIndex,
    firstEndFrozenColumnIndex,
    totalFrozenColumnWidth,
    totalEndFrozenColumnWidth
  };
}

function updateColumnParent<R, SR>(
  column: MutableCalculatedColumn<R, SR> | MutableCalculatedColumnParent<R, SR>,
  index: number,
  level: number
) {
  if (level < column.level) {
    column.level = level;
  }

  if (column.parent !== undefined) {
    const { parent } = column;
    if (parent.idx === -1) {
      parent.idx = index;
    }
    parent.colSpan += 1;
    updateColumnParent(parent, index, level - 1);
  }
}
