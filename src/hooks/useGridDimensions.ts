import { useCallback, useLayoutEffect, useRef, useSyncExternalStore, type RefObject } from 'react';

const initialSize: ResizeObserverSize = {
  inlineSize: 1,
  blockSize: 1
};

const targetToRefMap = new Map<HTMLDivElement, RefObject<HTMLDivElement | null>>();
// use an unmanaged WeakMap so we preserve the cache even when
// the component partially unmounts via Suspense or Activity
const sizeMap = new WeakMap<RefObject<HTMLDivElement | null>, ResizeObserverSize>();
const subscribers = new Map<RefObject<HTMLDivElement | null>, () => void>();

// don't break in Node.js (SSR), jsdom, and environments that don't support ResizeObserver
const resizeObserver =
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  globalThis.ResizeObserver == null ? null : new ResizeObserver(resizeObserverCallback);

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

export function useGridDimensions() {
  const ref = useRef<HTMLDivElement>(null);

  const subscribe = useCallback((onStoreChange: () => void) => {
    subscribers.set(ref, onStoreChange);

    return () => {
      subscribers.delete(ref);
    };
  }, []);

  const getSnapshot = useCallback((): ResizeObserverSize => {
    // ref.current is null during the initial render, when suspending, or in <Activity mode="hidden">.
    // We use ref as key instead to access stable values regardless of rendering state.
    return sizeMap.has(ref) ? sizeMap.get(ref)! : initialSize;
  }, []);

  // We use `useSyncExternalStore` instead of `useState` to avoid tearing,
  // which can lead to flashing scrollbars.
  const { inlineSize, blockSize } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useLayoutEffect(() => {
    const target = ref.current!;

    targetToRefMap.set(target, ref);
    resizeObserver?.observe(target);

    if (!sizeMap.has(ref)) {
      updateSize(ref, {
        inlineSize: target.clientWidth,
        blockSize: target.clientHeight
      });
    }

    return () => {
      targetToRefMap.delete(target);
      resizeObserver?.unobserve(target);
    };
  }, []);

  return [ref, inlineSize, blockSize] as const;
}
