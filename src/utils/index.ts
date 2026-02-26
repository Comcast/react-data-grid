import type { CalculatedColumn, CalculatedColumnOrColumnGroup, Maybe } from '../types';

export * from './colSpanUtils';
export * from './domUtils';
export * from './eventUtils';
export * from './keyboardUtils';
export * from './renderMeasuringCells';
export * from './selectedCellUtils';
export * from './styleUtils';

export const { min, max, floor, sign, abs } = Math;

export function getColumnInColumns<R, SR>(
  columns: readonly CalculatedColumn<R, SR>[],
  index: number
) {
  if (index < 0 || index >= columns.length) {
    throw new Error(`columns[${index}] is out of bounds (length: ${columns.length})`);
  }
  return columns[index]!;
}

export function getRowInRows<R>(rows: readonly R[], index: number) {
  if (index < 0 || index >= rows.length) {
    throw new Error(`rows[${index}] is out of bounds (length: ${rows.length})`);
  }
  return rows[index]!;
}

export function assertIsValidKeyGetter<R, K extends React.Key>(
  keyGetter: Maybe<(row: NoInfer<R>) => K>
): asserts keyGetter is (row: R) => K {
  if (typeof keyGetter !== 'function') {
    throw new Error('Please specify the rowKeyGetter prop to use selection');
  }
}

export function clampColumnWidth<R, SR>(
  width: number,
  { minWidth, maxWidth }: CalculatedColumn<R, SR>
): number {
  width = max(width, minWidth);

  // ignore maxWidth if it less than minWidth
  if (typeof maxWidth === 'number' && maxWidth >= minWidth) {
    return min(width, maxWidth);
  }

  return width;
}

export function getHeaderCellRowSpan<R, SR>(
  column: CalculatedColumnOrColumnGroup<R, SR>,
  rowIdx: number
) {
  return column.parent === undefined ? rowIdx : column.level - column.parent.level;
}
