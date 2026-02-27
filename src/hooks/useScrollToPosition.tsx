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
      <div
        ref={(div) => {
          if (div === null) return;
          const grid = gridRef.current!;
          const { scrollLeft, scrollTop } = grid;
          // scroll until the cell/column is completely visible
          // this is needed if the grid has auto-sized columns
          // setting the behavior to auto so it can be overridden
          scrollIntoView(div, 'auto');
          if (grid.scrollLeft === scrollLeft && grid.scrollTop === scrollTop) {
            setScrollToPosition(null);
          }
        }}
        style={{
          gridColumn: scrollToPosition.idx === undefined ? '1/-1' : scrollToPosition.idx + 1,
          gridRow: scrollToPosition.rowIdx === undefined ? '1/-1' : scrollToPosition.rowIdx + 1
        }}
      />
    )
  } as const;
}
