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
  validatePosition,
  setDraggedOverRowIdx,
  setShouldFocusPosition
}: {
  columns: readonly CalculatedColumn<R, SR>[];
  rows: readonly R[];
  validatePosition: (position: Position) => {
    isPositionInActiveBounds: boolean;
    isPositionInViewport: boolean;
    isRowInActiveBounds: boolean;
    isRowInViewport: boolean;
    isCellInActiveBounds: boolean;
    isCellInViewport: boolean;
  };
  setDraggedOverRowIdx: StateSetter<number | undefined>;
  setShouldFocusPosition: StateSetter<boolean>;
}) {
  const [activePosition, setActivePosition] = useState<ActivePosition | EditPosition<R>>(
    initialActivePosition
  );

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
    getActiveColumn,
    getActiveRow
  } as const;
}
