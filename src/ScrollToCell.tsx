import { useLayoutEffect, useRef } from 'react';

import { scrollIntoView } from './utils';
import type { Maybe } from './types';

export interface PartialPosition {
  readonly idx?: Maybe<number>;
  readonly rowIdx?: Maybe<number>;
}

export default function ScrollToCell({
  scrollToPosition: { idx, rowIdx },
  gridRef,
  setScrollToCellPosition
}: {
  scrollToPosition: PartialPosition;
  gridRef: React.RefObject<HTMLDivElement | null>;
  setScrollToCellPosition: (cell: null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const grid = gridRef.current!;
    const { scrollLeft, scrollTop } = grid;
    // scroll until the cell is completely visible
    // this is needed if the grid has auto-sized columns
    // setting the behavior to auto so it can be overridden
    scrollIntoView(ref.current, 'auto');
    if (grid.scrollLeft === scrollLeft && grid.scrollTop === scrollTop) {
      setScrollToCellPosition(null);
    }
  });

  return (
    <div
      ref={ref}
      style={{
        gridColumn: idx == null ? '1/-1' : idx + 1,
        gridRow: rowIdx == null ? '1/-1' : rowIdx + 1
      }}
    />
  );
}
