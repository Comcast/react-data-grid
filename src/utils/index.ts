import type { CalculatedColumn, CalculatedColumnOrColumnGroup, Maybe } from '../types';

export * from './activePositionUtils';
export * from './colSpanUtils';
export * from './domUtils';
export * from './eventUtils';
export * from './frozenColumnUtils';
export * from './keyboardUtils';
export * from './renderMeasuringCells';
export * from './styleUtils';
export * from './viewportUtils';

export const { min, max, floor, abs } = Math;

export function assertIsValidKeyGetter<R, K extends React.Key>(
  keyGetter: Maybe<(row: NoInfer<R>) => K>
): asserts keyGetter is (row: R) => K {
  if (typeof keyGetter !== 'function') {
    throw new TypeError('Please specify the rowKeyGetter prop to use selection');
  }
}

// the state of the select-all checkbox
export function getHeaderRowSelection<R, K extends React.Key>(
  rows: readonly R[],
  selectedRows: Maybe<ReadonlySet<K>>,
  rowKeyGetter: Maybe<(row: R) => K>
) {
  // no rows to select = explicitly unchecked
  let hasSelectedRow = false;
  let hasUnselectedRow = false;

  if (rowKeyGetter != null && selectedRows != null && selectedRows.size > 0) {
    for (const row of rows) {
      if (selectedRows.has(rowKeyGetter(row))) {
        hasSelectedRow = true;
      } else {
        hasUnselectedRow = true;
      }

      if (hasSelectedRow && hasUnselectedRow) break;
    }
  }

  return {
    isRowSelected: hasSelectedRow && !hasUnselectedRow,
    isIndeterminate: hasSelectedRow && hasUnselectedRow
  };
}

export function clampColumnWidth<R, SR>(
  width: number,
  { minWidth, maxWidth }: CalculatedColumn<R, SR>
): number {
  width = max(width, minWidth);

  // ignore maxWidth if it is less than minWidth
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
