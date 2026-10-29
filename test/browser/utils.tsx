import { page, type Locator } from 'vite-plus/test/browser';

import { DataGrid } from '../../src';
import type { DataGridProps } from '../../src';

export function setup<R, SR, K extends React.Key = React.Key>(props: DataGridProps<R, SR, K>) {
  return page.render(<DataGrid {...props} />);
}

export function getRowKey<K extends React.Key>(row: { readonly id: K }): K {
  return row.id;
}

export function getRowWithCell(cell: Locator) {
  return page.getRow().filter({ has: cell });
}

export function getCellsAtRowIndex(rowIdx: number) {
  return page
    .getRow()
    .and(page.getBySelector(`[aria-rowindex="${rowIdx + 2}"]`))
    .getCell();
}

export async function validateCellPosition(columnIdx: number, rowIdx: number) {
  const cell = page.getActiveCell();
  const row = page.getRow().or(page.getHeaderRow()).filter({ has: cell });
  await expect.element(cell).toHaveAttribute('aria-colindex', `${columnIdx + 1}`);
  await expect.element(row).toHaveAttribute('aria-rowindex', `${rowIdx + 1}`);
}

export function scrollGrid(options: ScrollToOptions) {
  const grid = page.getGrid().element();
  grid.scroll(options);
}

export function testCount(locator: Locator, expectedCount: number) {
  return expect.element(locator).toHaveLength(expectedCount);
}

export function testRowCount(expectedCount: number) {
  return testCount(page.getRow(), expectedCount);
}
