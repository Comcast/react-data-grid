import { useCallback, useSyncExternalStore } from 'react';

import { abs } from '../utils';

interface ScrollState {
  readonly scrollTop: number;
  readonly scrollLeft: number;
}

const initialScrollState: ScrollState = {
  scrollTop: 0,
  scrollLeft: 0
};

function getServerSnapshot() {
  return initialScrollState;
}

const scrollStateMap = new WeakMap<React.RefObject<HTMLDivElement | null>, ScrollState>();

export function useScrollState(gridRef: React.RefObject<HTMLDivElement | null>): ScrollState {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (gridRef.current === null) return () => {};

      const el = gridRef.current;

      // prime the scroll state map with the initial values
      setScrollState();

      function setScrollState() {
        const { scrollTop } = el;
        // scrollLeft is negative when direction is rtl
        const scrollLeft = abs(el.scrollLeft);

        const prev = scrollStateMap.get(gridRef) ?? initialScrollState;
        if (prev.scrollTop === scrollTop && prev.scrollLeft === scrollLeft) {
          return false;
        }

        scrollStateMap.set(gridRef, { scrollTop, scrollLeft });
        return true;
      }

      function onScroll() {
        if (setScrollState()) {
          onStoreChange();
        }
      }

      el.addEventListener('scroll', onScroll);

      return () => el.removeEventListener('scroll', onScroll);
    },
    [gridRef]
  );

  const getSnapshot = useCallback((): ScrollState => {
    // gridRef.current is null during initial render, suspending, or <Activity mode="hidden">
    // to avoid returning a different state in those cases,
    // we key the ref object instead of the element itself
    return scrollStateMap.get(gridRef) ?? initialScrollState;
  }, [gridRef]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
