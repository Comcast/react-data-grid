import { useLayoutEffect, useRef } from 'react';

import { focusCell, focusRow } from '../utils';

export function useShouldFocusPosition({
  gridRef,
  selectedPosition
}: {
  gridRef: React.RefObject<HTMLDivElement | null>;
  selectedPosition: { idx: number; rowIdx: number };
}) {
  const shouldFocusPositionRef = useRef(false);

  useLayoutEffect(() => {
    if (shouldFocusPositionRef.current) {
      if (selectedPosition.idx === -1) {
        focusRow(gridRef.current!);
      } else {
        focusCell(gridRef.current!);
      }
      shouldFocusPositionRef.current = false;
    }
  }, [selectedPosition, gridRef]);

  return { shouldFocusPositionRef } as const;
}
