import { memo, useMemo, useState } from 'react';
import { css } from 'ecij';

import { useLatestFunc } from './hooks';
import { classnames } from './utils';
import type {
  CalculatedColumn,
  Direction,
  IterateOverViewportColumnsForRow,
  Maybe,
  Position,
  ResizedWidth,
  SortColumn,
  SortDirection
} from './types';
import type { DataGridProps } from './DataGrid';
import HeaderCell from './HeaderCell';
import { cell, cellFrozen } from './style/cell';
import { rowActiveClassname } from './style/row';

type SharedDataGridProps<R, SR, K extends React.Key> = Pick<
  DataGridProps<R, SR, K>,
  'sortColumns' | 'onSortColumnsChange' | 'onColumnsReorder'
>;

export interface HeaderRowProps<R, SR, K extends React.Key> extends SharedDataGridProps<R, SR, K> {
  rowIdx: number;
  iterateOverViewportColumnsForRow: IterateOverViewportColumnsForRow<R, SR>;
  onColumnResize: (column: CalculatedColumn<R, SR>, width: ResizedWidth) => void;
  onColumnResizeEnd: () => void;
  activeCellIdx: number | undefined;
  setPosition: (position: Position) => void;
  shouldFocusGrid: boolean;
  direction: Direction;
  headerRowClass: Maybe<string>;
}

const headerRow = css`
  @layer rdg.HeaderRow {
    display: contents;
    background-color: var(--rdg-header-background-color);
    font-weight: bold;

    & > .${cell} {
      /* Should have a higher value than 1 to show up above regular cells and the focus sink */
      z-index: 2;
      position: sticky;
    }

    & > .${cellFrozen} {
      z-index: 3;
    }
  }
`;

export const headerRowClassname = `rdg-header-row ${headerRow}`;

interface SortInfo {
  direction: SortDirection;
  priority: number | undefined;
  index: number;
}

function HeaderRow<R, SR, K extends React.Key>({
  headerRowClass,
  rowIdx,
  iterateOverViewportColumnsForRow,
  onColumnResize,
  onColumnResizeEnd,
  onColumnsReorder,
  sortColumns,
  onSortColumnsChange,
  activeCellIdx,
  setPosition,
  shouldFocusGrid,
  direction
}: HeaderRowProps<R, SR, K>) {
  const [draggedColumnKey, setDraggedColumnKey] = useState<string>();
  const isPositionOnRow = activeCellIdx === -1;

  const sortMap = useMemo(() => {
    if (!sortColumns?.length) return undefined;
    const map = new Map<string, SortInfo>();
    for (let i = 0; i < sortColumns.length; i++) {
      const sc = sortColumns[i];
      map.set(sc.columnKey, {
        direction: sc.direction,
        priority: sortColumns.length > 1 ? i + 1 : undefined,
        index: i
      });
    }
    return map;
  }, [sortColumns]);

  function handleSort(column: CalculatedColumn<R, SR>, ctrlClick: boolean) {
    if (onSortColumnsChange == null) return;
    const { sortDescendingFirst } = column;
    const sortInfo = sortMap?.get(column.key);
    const currentSortDirection = sortInfo?.direction;

    if (currentSortDirection === undefined) {
      // not currently sorted
      const nextSort: SortColumn = {
        columnKey: column.key,
        direction: sortDescendingFirst ? 'DESC' : 'ASC'
      };
      onSortColumnsChange(sortColumns && ctrlClick ? [...sortColumns, nextSort] : [nextSort]);
    } else {
      let nextSortColumn: SortColumn | undefined;
      if (
        (sortDescendingFirst === true && currentSortDirection === 'DESC') ||
        (sortDescendingFirst !== true && currentSortDirection === 'ASC')
      ) {
        nextSortColumn = {
          columnKey: column.key,
          direction: currentSortDirection === 'ASC' ? 'DESC' : 'ASC'
        };
      }
      if (ctrlClick) {
        const nextSortColumns = [...sortColumns!];
        if (nextSortColumn) {
          // swap direction
          nextSortColumns[sortInfo!.index] = nextSortColumn;
        } else {
          // remove sort
          nextSortColumns.splice(sortInfo!.index, 1);
        }
        onSortColumnsChange(nextSortColumns);
      } else {
        onSortColumnsChange(nextSortColumn ? [nextSortColumn] : []);
      }
    }
  }

  const handleSortLatest = useLatestFunc(handleSort);

  const cells = iterateOverViewportColumnsForRow(activeCellIdx, { type: 'HEADER' })
    .map(([column, isCellActive, colSpan], index) => {
      const sortInfo = sortMap?.get(column.key);
      return (
        <HeaderCell<R, SR>
          key={column.key}
          column={column}
          colSpan={colSpan}
          rowIdx={rowIdx}
          isCellActive={isCellActive}
          onColumnResize={onColumnResize}
          onColumnResizeEnd={onColumnResizeEnd}
          onColumnsReorder={onColumnsReorder}
          sortDirection={sortInfo?.direction}
          priority={sortInfo?.priority}
          onSort={handleSortLatest}
          setPosition={setPosition}
          shouldFocusGrid={shouldFocusGrid && index === 0}
          direction={direction}
          draggedColumnKey={draggedColumnKey}
          setDraggedColumnKey={setDraggedColumnKey}
        />
      );
    })
    .toArray();

  return (
    <div
      role="row"
      aria-rowindex={rowIdx} // aria-rowindex is 1 based
      className={classnames(
        headerRowClassname,
        isPositionOnRow && rowActiveClassname,
        headerRowClass
      )}
    >
      {cells}
    </div>
  );
}

export default memo(HeaderRow) as <R, SR, K extends React.Key>(
  props: HeaderRowProps<R, SR, K>
) => React.JSX.Element;
