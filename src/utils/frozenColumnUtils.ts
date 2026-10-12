import type { ColumnFrozen } from '../types';

// Shared predicate — `frozen: true` is the backwards-compatible alias for `frozen: 'start'`.
export function isStartFrozen(frozen: ColumnFrozen): boolean {
  return frozen === true || frozen === 'start';
}

// A column group is frozen only when every child sits in the same frozen band.
export function combineFrozen(current: ColumnFrozen | undefined, next: ColumnFrozen): ColumnFrozen {
  if (current === undefined) return next;
  if (isStartFrozen(current) && isStartFrozen(next)) return 'start';
  if (current === 'end' && next === 'end') return 'end';
  return false;
}
