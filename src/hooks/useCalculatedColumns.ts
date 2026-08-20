import { useMemo } from 'react';

import { isStartFrozen } from '../utils';
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

const DEFAULT_COLUMN_WIDTH = 'auto';
const DEFAULT_COLUMN_MIN_WIDTH = 50;

interface CalculatedColumnsArgs<R, SR> {
  rawColumns: readonly ColumnOrColumnGroup<R, SR>[];
  defaultColumnOptions: DataGridProps<R, SR>['defaultColumnOptions'];
}

export function useCalculatedColumns<R, SR>({
  rawColumns,
  defaultColumnOptions
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
    let lastStartFrozenColumnIndex = -1;
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
          lastStartFrozenColumnIndex++;
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
      lastStartFrozenColumnIndex,
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

  return {
    columns,
    colSpanColumns,
    headerRowsCount,
    lastStartFrozenColumnIndex,
    firstEndFrozenColumnIndex
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
