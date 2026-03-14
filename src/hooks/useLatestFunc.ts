import { useCallback, useLayoutEffect, useRef } from 'react';

import type { Maybe } from '../types';

// https://reactjs.org/docs/hooks-faq.html#what-can-i-do-if-my-effect-dependencies-change-too-often

export function useLatestFunc<Args extends unknown[]>(
  fn: (...args: Args) => void
): (...args: Args) => void;

export function useLatestFunc<Args extends unknown[]>(
  fn: Maybe<(...args: Args) => void>
): Maybe<(...args: Args) => void>;

export function useLatestFunc<Args extends unknown[]>(fn: Maybe<(...args: Args) => void>) {
  const ref = useRef(fn);

  useLayoutEffect(() => {
    ref.current = fn;
  });

  const callbackFn = useCallback((...args: Args): void => {
    ref.current!(...args);
  }, []);

  return fn ? callbackFn : fn;
}
