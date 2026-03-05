import { useLayoutEffect, useRef } from 'react';

import { focusCell, focusRow } from '../utils';
import type { Position } from '../types';

export function useShouldFocusPosition({
  gridRef,
  activePosition
}: {
  gridRef: React.RefObject<HTMLDivElement | null>;
  activePosition: Position;
}) {
  const shouldFocusPositionRef = useRef(false);

  useLayoutEffect(() => {
    if (shouldFocusPositionRef.current) {
      if (activePosition.idx === -1) {
        focusRow(gridRef.current!);
      } else {
        focusCell(gridRef.current!);
      }
      shouldFocusPositionRef.current = false;
    }
  }, [activePosition, gridRef]);

  return { shouldFocusPositionRef } as const;
}
