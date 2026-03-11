import { useState } from 'react';

import type { CalculatedColumn, Position, StateSetter } from '../types';

interface ActivePosition extends Position {
  readonly mode: 'ACTIVE';
}

interface EditPosition<R> extends Position {
  readonly mode: 'EDIT';
  readonly row: R;
  readonly originalRow: R;
}

const initialActivePosition: ActivePosition = {
  idx: -1,
  // use -Infinity to avoid issues when adding header rows or top summary rows
  rowIdx: Number.NEGATIVE_INFINITY,
  mode: 'ACTIVE'
};

export function useActivePosition<R, SR>({
  columns,
  rows,
  isTreeGrid,
  maxColIdx,
  minRowIdx,
  maxRowIdx,
  setDraggedOverRowIdx,
  setShouldFocusPosition
}: {
  columns: readonly CalculatedColumn<R, SR>[];
  rows: readonly R[];
  isTreeGrid: boolean;
  maxColIdx: number;
  minRowIdx: number;
  maxRowIdx: number;
  setDraggedOverRowIdx: StateSetter<number | undefined>;
  setShouldFocusPosition: StateSetter<boolean>;
}) {
  const [activePosition, setActivePosition] = useState<ActivePosition | EditPosition<R>>(
    initialActivePosition
  );

  /**
   * Returns whether the given position represents a valid cell or row position in the grid.
   * Active bounds: any valid position in the grid
   * Viewport: any valid position in the grid outside of header rows and summary rows
   * Row selection is only allowed in TreeDataGrid
   */
  function validatePosition({ idx, rowIdx }: Position) {
    // check column position
    const isColumnPositionAllColumns = isTreeGrid && idx === -1;
    const isColumnPositionInActiveBounds = idx >= 0 && idx <= maxColIdx;

    // check row position
    const isRowPositionInActiveBounds = rowIdx >= minRowIdx && rowIdx <= maxRowIdx;
    const isRowPositionInViewport = rowIdx >= 0 && rowIdx < rows.length;

    // row status
    const isRowInActiveBounds = isColumnPositionAllColumns && isRowPositionInActiveBounds;
    const isRowInViewport = isColumnPositionAllColumns && isRowPositionInViewport;

    // cell status
    const isCellInActiveBounds = isColumnPositionInActiveBounds && isRowPositionInActiveBounds;
    const isCellInViewport = isColumnPositionInActiveBounds && isRowPositionInViewport;

    // position status
    const isPositionInActiveBounds = isRowInActiveBounds || isCellInActiveBounds;
    const isPositionInViewport = isRowInViewport || isCellInViewport;

    return {
      isPositionInActiveBounds,
      isPositionInViewport,
      isRowInActiveBounds,
      isRowInViewport,
      isCellInActiveBounds,
      isCellInViewport
    };
  }

  function getResolvedValues(position: ActivePosition | EditPosition<R>) {
    return {
      resolvedActivePosition: position,
      validatedPosition: validatePosition(position)
    };
  }

  function getActiveColumn() {
    if (!validatedPosition.isCellInActiveBounds) {
      throw new Error('No column for active position');
    }
    return columns[resolvedActivePosition.idx];
  }

  function getActiveRow() {
    if (!validatedPosition.isPositionInViewport) {
      throw new Error('No row for active position');
    }
    return rows[resolvedActivePosition.rowIdx];
  }

  let { resolvedActivePosition, validatedPosition } = getResolvedValues(activePosition);

  // Reinitialize the active position and immediately use the new state if it is no longer valid.
  // This can happen when a column or row is removed.
  if (
    !validatedPosition.isPositionInActiveBounds &&
    resolvedActivePosition !== initialActivePosition
  ) {
    setActivePosition(initialActivePosition);
    setDraggedOverRowIdx(undefined);
    ({ resolvedActivePosition, validatedPosition } = getResolvedValues(initialActivePosition));
  } else if (resolvedActivePosition.mode === 'EDIT') {
    const closeOnExternalRowChange =
      getActiveColumn().editorOptions?.closeOnExternalRowChange ?? true;

    // Discard changes if the row is updated from outside
    if (closeOnExternalRowChange && getActiveRow() !== resolvedActivePosition.originalRow) {
      const newPosition: ActivePosition = {
        idx: resolvedActivePosition.idx,
        rowIdx: resolvedActivePosition.rowIdx,
        mode: 'ACTIVE'
      };
      setActivePosition(newPosition);
      setShouldFocusPosition(false);
      ({ resolvedActivePosition, validatedPosition } = getResolvedValues(newPosition));
    }
  }

  return {
    activePosition: resolvedActivePosition,
    setActivePosition,
    activePositionIsInActiveBounds: validatedPosition.isPositionInActiveBounds,
    activePositionIsInViewport: validatedPosition.isPositionInViewport,
    activePositionIsRow: validatedPosition.isRowInActiveBounds,
    activePositionIsCellInViewport: validatedPosition.isCellInViewport,
    validatePosition,
    getActiveColumn,
    getActiveRow
  } as const;
}
