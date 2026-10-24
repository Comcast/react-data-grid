import type { ColumnFrozen } from '../types';

// Shared predicate — `frozen: true` is the backward-compatible alias for `frozen: 'start'`.
export function isStartFrozen(frozen: ColumnFrozen): boolean {
  return frozen === true || frozen === 'start';
}
