import { useMemo } from 'react';

import { clampColumnWidth, max, min } from '../utils';
import type {
  CalculatedColumn,
  CalculatedColumnParent,
  ColSpanArgs,
  ColumnFrozen,
  ColumnOrColumnGroup,
  Omit
} from '../types';
import { renderValue } from '../cellRenderers';
import { SELECT_COLUMN_KEY } from '../Columns';
import type { DataGridProps } from '../DataGrid';
import { renderHeaderCell } from '../renderHeaderCell';

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
    lastStartFrozenColumnIndex,
    firstEndFrozenColumnIndex,
    headerRowsCount
  } = useMemo((): {
    readonly columns: readonly CalculatedColumn<R, SR>[];
    readonly colSpanColumns: readonly CalculatedColumn<R, SR>[];
    readonly lastStartFrozenColumnIndex: number;
    readonly firstEndFrozenColumnIndex: number;
    readonly headerRowsCount: number;
  } => {
    let startFrozenColumnCount = 0;
    let endFrozenColumnCount = 0;
    let headerRowsCount = 1;
    const columns: MutableCalculatedColumn<R, SR>[] = [];
    const colSpanColumns: CalculatedColumn<R, SR>[] = [];

    collectColumns(rawColumns, 1);

    function getColSpan(
      column: CalculatedColumn<R, SR>,
      args: ColSpanArgs<R, SR> | undefined
    ): number {
      if (args === undefined) return 1;

      const colSpan = column.colSpan!(args) ?? 1;

      if (!Number.isInteger(colSpan) || colSpan <= 1) return 1;

      const { idx, frozen } = column;
      let maxColSpan;

      if (frozen === 'end') {
        maxColSpan = columns.length - idx;
      } else if (frozen === false) {
        maxColSpan = columns.length - endFrozenColumnCount - idx;
      } else {
        maxColSpan = startFrozenColumnCount - idx;
      }

      return min(colSpan, maxColSpan);
    }

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

        // normalize the `frozen` value
        const frozen: ColumnFrozen =
          rawColumn.frozen === true ? 'start' : (rawColumn.frozen ?? false);

        // Set every property in a fixed order instead of spreading `rawColumn`,
        // so that all calculated columns share a single hidden class (shape) in JS engines,
        // and the column property reads that run for every rendered cell stay monomorphic.
        const column: MutableCalculatedColumn<R, SR> = {
          name: rawColumn.name,
          key: rawColumn.key,
          parent,
          idx: 0,
          level: 0,
          width: rawColumn.width ?? defaultWidth,
          minWidth: rawColumn.minWidth ?? defaultMinWidth,
          maxWidth: rawColumn.maxWidth ?? defaultMaxWidth,
          cellClass: rawColumn.cellClass,
          headerCellClass: rawColumn.headerCellClass,
          summaryCellClass: rawColumn.summaryCellClass,
          renderCell: rawColumn.renderCell ?? defaultRenderCell,
          renderHeaderCell: rawColumn.renderHeaderCell ?? defaultRenderHeaderCell,
          renderSummaryCell: rawColumn.renderSummaryCell,
          renderGroupCell: rawColumn.renderGroupCell,
          renderEditCell: rawColumn.renderEditCell,
          editable: rawColumn.editable,
          colSpan: rawColumn.colSpan,
          getColSpan:
            rawColumn.colSpan == null ? getDefaultColSpan : (args) => getColSpan(column, args),
          frozen,
          resizable: rawColumn.resizable ?? defaultResizable,
          sortable: rawColumn.sortable ?? defaultSortable,
          draggable: rawColumn.draggable ?? defaultDraggable,
          sortDescendingFirst: rawColumn.sortDescendingFirst,
          editorOptions: rawColumn.editorOptions
        };

        columns.push(column);

        if (frozen === 'start') {
          startFrozenColumnCount += 1;
        } else if (frozen === 'end') {
          endFrozenColumnCount += 1;
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

      // TODO: sort columns to keep them grouped if they have a parent
      return ra - rb;
    });

    for (let idx = 0; idx < columns.length; idx++) {
      const column = columns[idx];
      column.idx = idx;
      updateColumnParent(column, idx, 0);

      if (column.colSpan != null) {
        colSpanColumns.push(column);
      }
    }

    return {
      columns,
      colSpanColumns,
      lastStartFrozenColumnIndex: startFrozenColumnCount - 1,
      firstEndFrozenColumnIndex:
        endFrozenColumnCount === 0 ? -1 : columns.length - endFrozenColumnCount,
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
    totalStartFrozenColumnWidth,
    totalEndFrozenColumnWidth,
    columnMetrics
  } = useMemo((): {
    templateColumns: readonly string[];
    layoutCssVars: Readonly<Record<string, string>>;
    totalStartFrozenColumnWidth: number;
    totalEndFrozenColumnWidth: number;
    columnMetrics: ReadonlyMap<CalculatedColumn<R, SR>, ColumnMetric>;
  } => {
    const columnMetrics = new Map<CalculatedColumn<R, SR>, ColumnMetric>();
    let left = 0;
    let totalStartFrozenColumnWidth = 0;
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

    if (lastStartFrozenColumnIndex !== -1) {
      const lastStartFrozenColumnMetric = columnMetrics.get(columns[lastStartFrozenColumnIndex])!;
      totalStartFrozenColumnWidth =
        lastStartFrozenColumnMetric.left + lastStartFrozenColumnMetric.width;
    }

    const layoutCssVars: Record<string, string> = {};

    for (let i = 0; i <= lastStartFrozenColumnIndex; i++) {
      const column = columns[i];
      layoutCssVars[`--rdg-frozen-start-${column.idx}`] = `${columnMetrics.get(column)!.left}px`;
    }

    if (firstEndFrozenColumnIndex !== -1) {
      const lastColumn = columns[columns.length - 1];
      const lastColumnMetric = columnMetrics.get(lastColumn)!;
      const gridEnd = lastColumnMetric.left + lastColumnMetric.width;
      const firstEndFrozenColumnMetric = columnMetrics.get(columns[firstEndFrozenColumnIndex])!;
      totalEndFrozenColumnWidth = gridEnd - firstEndFrozenColumnMetric.left;

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
      totalStartFrozenColumnWidth,
      totalEndFrozenColumnWidth,
      columnMetrics
    };
  }, [getColumnWidth, columns, lastStartFrozenColumnIndex, firstEndFrozenColumnIndex]);

  const [colOverscanStartIdx, colOverscanEndIdx] = useMemo((): [number, number] => {
    if (!enableVirtualization) {
      // start-frozen columns are always rendered, so the overscan range starts after them
      return [lastStartFrozenColumnIndex + 1, columns.length - 1];
    }
    // get the viewport's left side and right side positions for non-frozen columns
    const viewportLeft = scrollLeft + totalStartFrozenColumnWidth;
    const viewportRight = scrollLeft + viewportWidth - totalEndFrozenColumnWidth;
    // get first and last non-frozen column indexes
    const lastColIdx = columns.length - 1;
    const firstUnfrozenColumnIdx = min(lastStartFrozenColumnIndex + 1, lastColIdx);

    // skip rendering non-frozen columns if the frozen columns cover the entire viewport
    if (viewportLeft >= viewportRight) {
      return [firstUnfrozenColumnIdx, firstUnfrozenColumnIdx];
    }

    // get the first visible non-frozen column index
    let colVisibleStartIdx = firstUnfrozenColumnIdx;
    while (colVisibleStartIdx < lastColIdx) {
      const { left, width } = columnMetrics.get(columns[colVisibleStartIdx])!;
      // if the right side of the column is beyond the left side of the available viewport,
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
      // then it is the last column that's at least partially visible, as the previous column's right side is not beyond the viewport.
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
    lastStartFrozenColumnIndex,
    scrollLeft,
    totalStartFrozenColumnWidth,
    totalEndFrozenColumnWidth,
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
    lastStartFrozenColumnIndex,
    firstEndFrozenColumnIndex,
    totalStartFrozenColumnWidth,
    totalEndFrozenColumnWidth
  };
}

function getDefaultColSpan() {
  return 1;
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
