import { useState } from 'react';

import { scrollIntoView } from '../utils';

export interface PartialPosition {
  readonly idx?: number | undefined;
  readonly rowIdx?: number | undefined;
}

interface Props {
  gridRef: React.RefObject<HTMLDivElement | null>;
}

export function useScrollToPosition({ gridRef }: Props) {
  const [scrollToPosition, setScrollToPosition] = useState<PartialPosition | null>(null);

  return {
    setScrollToPosition,
    scrollToPositionElement: scrollToPosition && (
      <ScrollToCell
        gridRef={gridRef}
        scrollToPosition={scrollToPosition}
        setScrollToCellPosition={setScrollToPosition}
      />
    )
  } as const;
}

interface ScrollToCellProps extends Props {
  scrollToPosition: PartialPosition;
  setScrollToCellPosition: (cell: null) => void;
}

function ScrollToCell({
  gridRef,
  scrollToPosition: { idx, rowIdx },
  setScrollToCellPosition
}: ScrollToCellProps) {
  return (
    <div
      ref={(div) => {
        if (div === null) return;
        const grid = gridRef.current!;
        const { scrollLeft, scrollTop } = grid;
        // scroll until the cell is completely visible
        // this is needed if the grid has auto-sized columns
        // setting the behavior to auto so it can be overridden
        scrollIntoView(div, 'auto');
        if (grid.scrollLeft === scrollLeft && grid.scrollTop === scrollTop) {
          setScrollToCellPosition(null);
        }
      }}
      style={{
        gridColumn: idx === undefined ? '1/-1' : idx + 1,
        gridRow: rowIdx === undefined ? '1/-1' : rowIdx + 1
      }}
    />
  );
}
