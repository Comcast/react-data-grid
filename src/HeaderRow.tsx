import { memo, useState } from 'react';
import { css } from 'ecij';

import { classnames } from './utils';
import type {
  CalculatedColumn,
  Direction,
  IterateOverViewportColumnsForRow,
  Maybe,
  Position,
  ResizedWidth
} from './types';
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
  iterateOverViewportColumnsForRow: IterateOverViewportColumnsForRow<R, SR>;
  onColumnResize: (column: CalculatedColumn<R, SR>, width: ResizedWidth) => void;
  onColumnResizeEnd: () => void;
  selectCell: (position: Position) => void;
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
  iterateOverViewportColumnsForRow,
  onColumnResize,
  onColumnResizeEnd,
  onColumnsReorder,
  sortColumns,
  onSortColumnsChange,
  selectedCellIdx,
  selectCell,
  shouldFocusGrid,
  direction
}: HeaderRowProps<R, SR, K>) {
  const [draggedColumnKey, setDraggedColumnKey] = useState<string>();
  const isPositionOnRow = selectedCellIdx === -1;

  const cells = iterateOverViewportColumnsForRow(selectedCellIdx, { type: 'HEADER' })
    .map(([column, colSpan], index) => (
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
    ))
    .toArray();

  return (
    <div
      role="row"
      aria-rowindex={rowIdx} // aria-rowindex is 1 based
      className={classnames(
        headerRowClassname,
        isPositionOnRow && rowSelectedClassname,
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
