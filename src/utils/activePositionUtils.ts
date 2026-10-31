import type {
  CalculatedColumn,
  CalculatedColumnParent,
  CellNavigationMode,
  Maybe,
  Position
} from '../types';

// https://github.com/vercel/next.js/issues/56480
export function isCellEditableUtil<R, SR>(column: CalculatedColumn<R, SR>, row: R): boolean {
  return (
    column.renderEditCell != null &&
    (typeof column.editable === 'function' ? column.editable(row) : column.editable) !== false
  );
}

interface GetNextPositionOpts<R, SR> {
  moveUp: boolean;
  moveNext: boolean;
  cellNavigationMode: CellNavigationMode;
  columns: readonly CalculatedColumn<R, SR>[];
  colSpanColumns: readonly CalculatedColumn<R, SR>[];
  rows: readonly R[];
  topSummaryRows: Maybe<readonly SR[]>;
  bottomSummaryRows: Maybe<readonly SR[]>;
  minRowIdx: number;
  mainHeaderRowIdx: number;
  maxRowIdx: number;
  activePosition: Position;
  nextPosition: Position;
  nextPositionIsCellInActiveBounds: boolean;
}

function getCellColSpan<R, SR>({
  rows,
  topSummaryRows,
  bottomSummaryRows,
  rowIdx,
  mainHeaderRowIdx,
  column
}: Pick<
  GetNextPositionOpts<R, SR>,
  'rows' | 'topSummaryRows' | 'bottomSummaryRows' | 'mainHeaderRowIdx'
> & {
  rowIdx: number;
  column: CalculatedColumn<R, SR>;
}) {
  if (rowIdx === mainHeaderRowIdx) {
    return column.getColSpan({
      type: 'HEADER'
    });
  }

  const topSummaryRowsCount = topSummaryRows?.length ?? 0;

  if (
    topSummaryRows &&
    rowIdx > mainHeaderRowIdx &&
    rowIdx <= topSummaryRowsCount + mainHeaderRowIdx
  ) {
    return column.getColSpan({
      type: 'SUMMARY',
      row: topSummaryRows[rowIdx + topSummaryRowsCount]
    });
  }

  if (rowIdx >= 0 && rowIdx < rows.length) {
    const row = rows[rowIdx];
    return column.getColSpan({
      type: 'ROW',
      row
    });
  }

  if (bottomSummaryRows && rowIdx >= rows.length) {
    return column.getColSpan({
      type: 'SUMMARY',
      row: bottomSummaryRows[rowIdx - rows.length]
    });
  }

  // the header rows of column groups
  return 1;
}

export function getNextActivePosition<R, SR>({
  moveUp,
  moveNext,
  cellNavigationMode,
  columns,
  colSpanColumns,
  rows,
  topSummaryRows,
  bottomSummaryRows,
  minRowIdx,
  mainHeaderRowIdx,
  maxRowIdx,
  activePosition: { idx: activeIdx, rowIdx: activeRowIdx },
  nextPosition,
  nextPositionIsCellInActiveBounds
}: GetNextPositionOpts<R, SR>): Position {
  let { idx: nextIdx, rowIdx: nextRowIdx } = nextPosition;
  const columnsCount = columns.length;

  const setColSpan = (moveNext: boolean) => {
    // If a cell within the colspan range is active then move to the
    // previous or the next cell depending on the navigation direction
    for (const column of colSpanColumns) {
      const colIdx = column.idx;
      if (colIdx > nextIdx) break;
      const colSpan = getCellColSpan({
        rows,
        topSummaryRows,
        bottomSummaryRows,
        rowIdx: nextRowIdx,
        mainHeaderRowIdx,
        column
      });

      if (nextIdx > colIdx && nextIdx < colSpan + colIdx) {
        nextIdx = colIdx + (moveNext ? colSpan : 0);
        break;
      }
    }
  };

  const getParentRowIdx = (parent: CalculatedColumnParent<R, SR>) => {
    return parent.level + mainHeaderRowIdx;
  };

  const setHeaderGroupColAndRowSpan = () => {
    if (moveNext) {
      // find the parent at the same row level
      const nextColumn = columns[nextIdx];
      let { parent } = nextColumn;
      while (parent !== undefined) {
        const parentRowIdx = getParentRowIdx(parent);
        if (nextRowIdx === parentRowIdx) {
          nextIdx = parent.idx + parent.colSpan;
          break;
        }
        ({ parent } = parent);
      }
    } else if (moveUp) {
      // find the first reachable parent
      const nextColumn = columns[nextIdx];
      let { parent } = nextColumn;
      let found = false;
      while (parent !== undefined) {
        const parentRowIdx = getParentRowIdx(parent);
        if (nextRowIdx >= parentRowIdx) {
          nextIdx = parent.idx;
          nextRowIdx = parentRowIdx;
          found = true;
          break;
        }
        ({ parent } = parent);
      }

      // keep the current position if there is no parent matching the new row position
      if (!found) {
        nextIdx = activeIdx;
        nextRowIdx = activeRowIdx;
      }
    }
  };

  if (nextPositionIsCellInActiveBounds) {
    setColSpan(moveNext);

    if (nextRowIdx < mainHeaderRowIdx) {
      setHeaderGroupColAndRowSpan();
    }
  }

  if (cellNavigationMode === 'CHANGE_ROW') {
    const isAfterLastColumn = nextIdx === columnsCount;
    const isBeforeFirstColumn = nextIdx === -1;

    if (isAfterLastColumn) {
      const isLastRow = nextRowIdx === maxRowIdx;
      if (!isLastRow) {
        nextIdx = 0;
        nextRowIdx += 1;
      }
    } else if (isBeforeFirstColumn) {
      const isFirstRow = nextRowIdx === minRowIdx;
      if (!isFirstRow) {
        nextRowIdx -= 1;
        nextIdx = columnsCount - 1;
      }
      setColSpan(false);
    }
  }

  if (nextRowIdx < mainHeaderRowIdx && nextIdx > -1 && nextIdx < columnsCount) {
    // Find the last reachable parent for the new rowIdx
    // This check is needed when navigating to a column
    // that does not have a parent matching the new rowIdx
    const nextColumn = columns[nextIdx];
    let { parent } = nextColumn;
    const nextParentRowIdx = nextRowIdx;
    nextRowIdx = mainHeaderRowIdx;
    while (parent !== undefined) {
      const parentRowIdx = getParentRowIdx(parent);
      if (parentRowIdx >= nextParentRowIdx) {
        nextRowIdx = parentRowIdx;
        nextIdx = parent.idx;
      }
      ({ parent } = parent);
    }
  }

  return { idx: nextIdx, rowIdx: nextRowIdx };
}

interface CanExitGridOpts {
  maxColIdx: number;
  minRowIdx: number;
  maxRowIdx: number;
  activePosition: Position;
  shiftKey: boolean;
}

export function canExitGrid({
  maxColIdx,
  minRowIdx,
  maxRowIdx,
  activePosition: { rowIdx, idx },
  shiftKey
}: CanExitGridOpts): boolean {
  // Exit the grid if we're at the first or last cell of the grid
  const atLastCellInRow = idx === maxColIdx;
  const atFirstCellInRow = idx === 0;
  const atLastRow = rowIdx === maxRowIdx;
  const atFirstRow = rowIdx === minRowIdx;

  return shiftKey ? atFirstCellInRow && atFirstRow : atLastCellInRow && atLastRow;
}
