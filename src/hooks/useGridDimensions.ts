import { useLayoutEffect, useRef, useState, type ActivityProps } from 'react';
import { flushSync } from 'react-dom';

export function useGridDimensions() {
  const gridRef = useRef<HTMLDivElement>(null);
  const [inlineSize, setInlineSize] = useState(1);
  const [blockSize, setBlockSize] = useState(1);
  const [horizontalScrollbarHeight, setHorizontalScrollbarHeight] = useState(0);
  const [isMeasured, setIsMeasured] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isDocumentVisible, setIsDocumentVisible] = useState(false);
  const activityMode: NonNullable<ActivityProps['mode']> =
    isMeasured && isVisible && isDocumentVisible ? 'visible' : 'hidden';

  useLayoutEffect(() => {
    const { ResizeObserver, IntersectionObserver } = window;

    // don't break in environments like JSDOM that do not support observers
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (ResizeObserver == null || IntersectionObserver == null) return;

    const grid = gridRef.current!;
    const { clientWidth, clientHeight, offsetWidth, offsetHeight } = grid;
    const { width, height } = grid.getBoundingClientRect();
    const initialHorizontalScrollbarHeight = offsetHeight - clientHeight;
    const initialWidth = width - offsetWidth + clientWidth;
    const initialHeight = height - initialHorizontalScrollbarHeight;

    setInlineSize(initialWidth);
    setBlockSize(initialHeight);
    setHorizontalScrollbarHeight(initialHorizontalScrollbarHeight);
    setIsMeasured(true);

    const resizeObserver = new ResizeObserver((entries) => {
      const size = entries[0].contentBoxSize[0];
      const { clientHeight, offsetHeight } = grid;

      // we use flushSync here to avoid flashing scrollbars
      flushSync(() => {
        setInlineSize(size.inlineSize);
        setBlockSize(size.blockSize);
        setHorizontalScrollbarHeight(offsetHeight - clientHeight);
      });
    });

    const intersectionObserver = new IntersectionObserver((entries) => {
      flushSync(() => {
        setIsVisible(entries[0].isIntersecting);
      });
    });

    function onVisibilityChange() {
      setIsDocumentVisible(!document.hidden);
    }

    resizeObserver.observe(grid);
    intersectionObserver.observe(grid);
    document.addEventListener('visibilitychange', onVisibilityChange);
    onVisibilityChange();

    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return [gridRef, activityMode, inlineSize, blockSize, horizontalScrollbarHeight] as const;
}
