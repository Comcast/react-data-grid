import { useLayoutEffect, useRef, useState } from 'react';

import { focusCell, focusRow } from '../utils';
import type { CalculatedColumn, Position, StateSetter } from '../types';

export interface ActivePosition extends Position {
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
  gridRef,
  columns,
  rows,
  isTreeGrid,
  maxColIdx,
  minRowIdx,
  maxRowIdx,
  setDraggedOverRowIdx
}: {
  gridRef: React.RefObject<HTMLDivElement | null>;
  columns: readonly CalculatedColumn<R, SR>[];
  rows: readonly R[];
  isTreeGrid: boolean;
  maxColIdx: number;
  minRowIdx: number;
  maxRowIdx: number;
  setDraggedOverRowIdx: StateSetter<number | undefined>;
}) {
  const [activePosition, setActivePosition] = useState<ActivePosition | EditPosition<R>>(
    initialActivePosition
  );
  const [positionToFocus, setPositionToFocus] = useState<ActivePosition | EditPosition<R> | null>(
    null
  );
  const positionToFocusRef = useRef<ActivePosition | EditPosition<R>>(null);

  /**
   * Returns whether the given position represents a valid cell or row position in the grid.
   * Active bounds: any valid position in the grid
   * Viewport: any valid position in the grid outside of header rows and summary rows
   * Only TreeDataGrid allows the active position to be on a row (`idx: -1`)
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

  function resolveActivePosition(position: ActivePosition | EditPosition<R>) {
    const validatedPosition = validatePosition(position);

    if (position !== initialActivePosition) {
      // Reinitialize the active position and immediately use the new state if it is no longer valid.
      // This can happen when a column or row is removed.
      if (!validatedPosition.isPositionInActiveBounds) {
        setActivePosition(initialActivePosition);
        setDraggedOverRowIdx(undefined);
        return resolveActivePosition(initialActivePosition);
      }

      if (position.mode === 'EDIT') {
        const closeOnExternalRowChange =
          columns[position.idx].editorOptions?.closeOnExternalRowChange ?? true;

        // Discard changes if the row is updated from outside,
        // or if removing rows moved the position to a summary row
        if (
          !validatedPosition.isCellInViewport ||
          (closeOnExternalRowChange && rows[position.rowIdx] !== position.originalRow)
        ) {
          const newPosition: ActivePosition = {
            idx: position.idx,
            rowIdx: position.rowIdx,
            mode: 'ACTIVE'
          };
          setActivePosition(newPosition);
          setPositionToFocus(null);
          return resolveActivePosition(newPosition);
        }
      }
    }

    return {
      resolvedActivePosition: position,
      validatedPosition
    };
  }

  const { resolvedActivePosition, validatedPosition } = resolveActivePosition(activePosition);

  function queryActiveColumn(): CalculatedColumn<R, SR> | undefined {
    if (!validatedPosition.isCellInActiveBounds) return;
    return columns[resolvedActivePosition.idx];
  }

  function getActiveColumn() {
    const column = queryActiveColumn();
    if (column === undefined) {
      throw new Error('No column for active position');
    }
    return column;
  }

  function getActiveRow() {
    if (!validatedPosition.isPositionInViewport) {
      throw new Error('No row for active position');
    }
    return rows[resolvedActivePosition.rowIdx];
  }

  useLayoutEffect(() => {
    // Layout effects clean up when the component is replaced by a suspense fallback,
    // or when under <Activity mode="hidden">, then re-mount when the suspense boundary resolves,
    // or when Activity switches back to `mode="visible"`.
    // So we use a ref to:
    // 1. avoid re-focusing after the effect re-mounts
    // 2. avoid re-rendering by not re-setting the state
    if (positionToFocus !== null && positionToFocus !== positionToFocusRef.current) {
      positionToFocusRef.current = positionToFocus;

      if (positionToFocus.idx === -1) {
        focusRow(gridRef.current!);
      } else {
        focusCell(gridRef.current!);
      }
    }
  }, [positionToFocus, gridRef]);

  return {
    activePosition: resolvedActivePosition,
    setActivePosition,
    setPositionToFocus,
    activePositionIsInActiveBounds: validatedPosition.isPositionInActiveBounds,
    activePositionIsInViewport: validatedPosition.isPositionInViewport,
    activePositionIsRow: validatedPosition.isRowInActiveBounds,
    activePositionIsCellInViewport: validatedPosition.isCellInViewport,
    validatePosition,
    queryActiveColumn,
    getActiveColumn,
    getActiveRow
  } as const;
}
