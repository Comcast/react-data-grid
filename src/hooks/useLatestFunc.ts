import { useCallback, useInsertionEffect, useRef } from 'react';

import type { Maybe } from '../types';

// Returns a function with a stable identity that calls the latest `fn`,
// so the memoized components and contexts that receive it don't re-render when `fn` changes.
// Neither React Compiler nor `useEffectEvent` provides this guarantee.
// Insertion effects run before all layout effects, including those of child components,
// and also run under `<Activity mode="hidden">`, where layout effects don't.

export function useLatestFunc<Args extends unknown[]>(
  fn: (...args: Args) => void
): (...args: Args) => void;

export function useLatestFunc<Args extends unknown[]>(
  fn: Maybe<(...args: Args) => void>
): Maybe<(...args: Args) => void>;

export function useLatestFunc<Args extends unknown[]>(fn: Maybe<(...args: Args) => void>) {
  const ref = useRef(fn);

  useInsertionEffect(() => {
    ref.current = fn;
  });

  const callbackFn = useCallback((...args: Args): void => {
    ref.current!(...args);
  }, []);

  return fn ? callbackFn : fn;
}
