import { useCallback, useId, useLayoutEffect, useRef, useSyncExternalStore } from 'react';

const initialSize: ResizeObserverSize = {
  inlineSize: 1,
  blockSize: 1
};

const targetToIdMap = new Map<HTMLDivElement, string>();
const idToTargetMap = new Map<string, HTMLDivElement>();
// use an unmanaged WeakMap so we preserve the cache even when
// the component partially unmounts via Suspense or Activity
const sizeMap = new WeakMap<HTMLDivElement, ResizeObserverSize>();
const subscribers = new Map<string, () => void>();

// don't break in Node.js (SSR), jsdom, and environments that don't support ResizeObserver
const resizeObserver =
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  globalThis.ResizeObserver == null ? null : new ResizeObserver(resizeObserverCallback);

function resizeObserverCallback(entries: ResizeObserverEntry[]) {
  for (const entry of entries) {
    const target = entry.target as HTMLDivElement;

    if (!targetToIdMap.has(target)) continue;

    const id = targetToIdMap.get(target)!;

    updateSize(target, id, entry.contentBoxSize[0]);
  }
}

function updateSize(target: HTMLDivElement, id: string, size: ResizeObserverSize) {
  if (sizeMap.has(target)) {
    const prevSize = sizeMap.get(target)!;
    if (prevSize.inlineSize === size.inlineSize && prevSize.blockSize === size.blockSize) {
      return;
    }
  }

  sizeMap.set(target, size);
  subscribers.get(id)?.();
}

function getServerSnapshot(): ResizeObserverSize {
  return initialSize;
}

export function useGridDimensions() {
  const id = useId();
  const gridRef = useRef<HTMLDivElement>(null);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      subscribers.set(id, onStoreChange);

      return () => {
        subscribers.delete(id);
      };
    },
    [id]
  );

  const getSnapshot = useCallback((): ResizeObserverSize => {
    if (idToTargetMap.has(id)) {
      const target = idToTargetMap.get(id)!;
      if (sizeMap.has(target)) {
        return sizeMap.get(target)!;
      }
    }
    return initialSize;
  }, [id]);

  // We use `useSyncExternalStore` instead of `useState` to avoid tearing,
  // which can lead to flashing scrollbars.
  const { inlineSize, blockSize } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useLayoutEffect(() => {
    const target = gridRef.current!;

    targetToIdMap.set(target, id);
    idToTargetMap.set(id, target);
    resizeObserver?.observe(target);

    if (!sizeMap.has(target)) {
      updateSize(target, id, {
        inlineSize: target.clientWidth,
        blockSize: target.clientHeight
      });
    }

    return () => {
      targetToIdMap.delete(target);
      idToTargetMap.delete(id);
      resizeObserver?.unobserve(target);
    };
  }, [id]);

  return [gridRef, inlineSize, blockSize] as const;
}
