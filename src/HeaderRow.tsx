import { memo, useState } from 'react';
import { css } from '@nstep/ecis';

import { classnames, getColSpan } from './utils';
import type { CalculatedColumn, Direction, Maybe, Position, ResizedWidth } from './types';
import type { DataGridProps } from './DataGrid';
import HeaderCell from './HeaderCell';
import { cell, cellFrozen } from './style/cell';
import { rowSelectedClassname } from './style/row';

type SharedDataGridProps<R, SR, K extends React.Key> = Pick<
  DataGridProps<R, SR, K>,
  'sortColumns' | 'onSortColumnsChange' | 'onColumnsReorder'
>;

export interface HeaderRowProps<R, SR, K extends React.Key> extends SharedDataGridProps<R, SR, K> {
  rowIdx: number;
  columns: readonly CalculatedColumn<R, SR>[];
  onColumnResize: (column: CalculatedColumn<R, SR>, width: ResizedWidth) => void;
  onColumnResizeEnd: () => void;
  selectCell: (position: Position) => void;
  lastFrozenColumnIndex: number;
  selectedCellIdx: number | undefined;
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

function HeaderRow<R, SR, K extends React.Key>({
  headerRowClass,
  rowIdx,
  columns,
  onColumnResize,
  onColumnResizeEnd,
  onColumnsReorder,
  sortColumns,
  onSortColumnsChange,
  lastFrozenColumnIndex,
  selectedCellIdx,
  selectCell,
  shouldFocusGrid,
  direction
}: HeaderRowProps<R, SR, K>) {
  const [draggedColumnKey, setDraggedColumnKey] = useState<string>();

  const cells = [];
  for (let index = 0; index < columns.length; index++) {
    const column = columns[index];
    const colSpan = getColSpan(column, lastFrozenColumnIndex, { type: 'HEADER' });
    if (colSpan !== undefined) {
      index += colSpan - 1;
    }

    cells.push(
      <HeaderCell<R, SR>
        key={column.key}
        column={column}
        colSpan={colSpan}
        rowIdx={rowIdx}
        isCellSelected={selectedCellIdx === column.idx}
        onColumnResize={onColumnResize}
        onColumnResizeEnd={onColumnResizeEnd}
        onColumnsReorder={onColumnsReorder}
        onSortColumnsChange={onSortColumnsChange}
        sortColumns={sortColumns}
        selectCell={selectCell}
        shouldFocusGrid={shouldFocusGrid && index === 0}
        direction={direction}
        draggedColumnKey={draggedColumnKey}
        setDraggedColumnKey={setDraggedColumnKey}
      />
    );
  }

  return (
    <div
      role="row"
      aria-rowindex={rowIdx} // aria-rowindex is 1 based
      className={classnames(
        headerRowClassname,
        {
          [rowSelectedClassname]: selectedCellIdx === -1
        },
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
