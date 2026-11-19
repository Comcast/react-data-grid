import type { CalculatedColumnOrColumnGroup, Maybe } from '../types';

export * from './activePositionUtils';
export * from './domUtils';
export * from './eventUtils';
export * from './keyboardUtils';
export * from './renderMeasuringCells';
export * from './styleUtils';
export * from './viewportUtils';

export const { min, max, floor, abs } = Math;

export function assertIsValidGetRowKey<R, K extends React.Key>(
  getRowKey: Maybe<(row: NoInfer<R>) => K>
): asserts getRowKey is (row: R) => K {
  if (typeof getRowKey !== 'function') {
    throw new TypeError('Please specify the getRowKey prop to use selection');
  }
}

export function getHeaderCellRowSpan<R, SR>(
  column: CalculatedColumnOrColumnGroup<R, SR>,
  rowIdx: number
) {
  return column.parent === undefined ? rowIdx : column.level - column.parent.level;
}
