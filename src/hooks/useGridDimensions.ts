import {
  useCallback,
  useDeferredValue,
  useLayoutEffect,
  useSyncExternalStore,
  type RefObject
} from 'react';

import { createResizeObserverGetter } from '../utils';

const initialSize: ResizeObserverSize = {
  inlineSize: 1,
  blockSize: 1
};

// use an unmanaged WeakMap so we preserve the cache even when
// the component partially unmounts via Suspense or Activity
const sizeMap = new WeakMap<RefObject<HTMLDivElement | null>, ResizeObserverSize>();
const targetToRefMap = new WeakMap<HTMLDivElement, RefObject<HTMLDivElement | null>>();
const subscribers = new WeakMap<RefObject<HTMLDivElement | null>, () => void>();
const getResizeObserver = createResizeObserverGetter(resizeObserverCallback);

function resizeObserverCallback(entries: ResizeObserverEntry[]) {
  for (const entry of entries) {
    const target = entry.target as HTMLDivElement;

    if (targetToRefMap.has(target)) {
      const ref = targetToRefMap.get(target)!;
      updateSize(ref, entry.contentBoxSize[0]);
    }
  }
}

function updateSize(ref: RefObject<HTMLDivElement | null>, size: ResizeObserverSize) {
  if (sizeMap.has(ref)) {
    const prevSize = sizeMap.get(ref)!;
    if (prevSize.inlineSize === size.inlineSize && prevSize.blockSize === size.blockSize) {
      return;
    }
  }

  sizeMap.set(ref, size);
  subscribers.get(ref)?.();
}

function getServerSnapshot(): ResizeObserverSize {
  return initialSize;
}

export function useGridDimensions(gridRef: React.RefObject<HTMLDivElement | null>) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      subscribers.set(gridRef, onStoreChange);

      return () => {
        subscribers.delete(gridRef);
      };
    },
    [gridRef]
  );

  const getSnapshot = useCallback((): ResizeObserverSize => {
    // ref.current is null during the initial render, when suspending, or in <Activity mode="hidden">.
    // We use the ref as the key instead to access stable values regardless of the rendering state.
    return sizeMap.get(gridRef) ?? initialSize;
  }, [gridRef]);

  // We use `useSyncExternalStore` instead of `useState` to avoid tearing,
  // which can lead to flashing scrollbars.
  const { inlineSize, blockSize } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const deferredInlineSize = useDeferredValue(inlineSize, -1);
  const isResizingWidth = inlineSize !== deferredInlineSize;

  useLayoutEffect(() => {
    const target = gridRef.current!;
    const resizeObserver = getResizeObserver(target);

    targetToRefMap.set(target, gridRef);
    resizeObserver?.observe(target);

    if (!sizeMap.has(gridRef)) {
      updateSize(gridRef, {
        inlineSize: target.clientWidth,
        blockSize: target.clientHeight
      });
    }

    return () => {
      resizeObserver?.unobserve(target);
    };
  }, [gridRef]);

  return [inlineSize, blockSize, isResizingWidth] as const;
}
