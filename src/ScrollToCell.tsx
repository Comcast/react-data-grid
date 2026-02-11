import { useLayoutEffect, useRef } from 'react';

import { scrollIntoView } from './utils';

export interface PartialPosition {
  readonly idx?: number | undefined;
  readonly rowIdx?: number | undefined;
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
  // When scrolling to a specific cell, we need threshold: 1 to ensure it's fully visible.
  // When scrolling to just a row or column, the div spans the full width/height,
  // so threshold: 1 would never be met. Use threshold: 0 instead.
  const threshold = idx !== undefined && rowIdx !== undefined ? 1 : 0;

  useLayoutEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setScrollToCellPosition(null);
        } else {
          // scroll until the cell is completely visible
          // this is needed if the grid has auto-sized columns
          // setting the behavior to auto so it can be overridden
          scrollIntoView(ref.current, 'auto');
        }
      },
      {
        root: gridRef.current!,
        threshold
      }
    );

    scrollIntoView(ref.current, 'auto');
    observer.observe(ref.current!);

    return () => {
      observer.disconnect();
    };
  }, [gridRef, setScrollToCellPosition, threshold]);

  return (
    <div
      ref={ref}
      style={{
        gridColumn: idx === undefined ? '1/-1' : idx + 1,
        gridRow: rowIdx === undefined ? '1/-1' : rowIdx + 1
      }}
    />
  );
}
