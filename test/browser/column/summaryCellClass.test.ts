import { page } from 'vitest/browser';

import type { Column } from '../../../src';
import { cellClassname } from '../../../src/style/cell';
import { setup } from '../utils';

const cells = page.getCell();

interface SummaryRow {
  id: number;
}

const topSummaryRows: readonly SummaryRow[] = [{ id: 0 }, { id: 1 }];
const bottomSummaryRows: readonly SummaryRow[] = [{ id: 2 }, { id: 3 }];

test('summaryCellClass is undefined', async () => {
  const columns: readonly Column<never, SummaryRow>[] = [
    {
      key: 'id',
      name: 'ID'
    }
  ];
  await setup({ columns, topSummaryRows, bottomSummaryRows, rows: [] });
  await expect.element(cells.nth(0)).toHaveClass(cellClassname, { exact: true });
  await expect.element(cells.nth(1)).toHaveClass(cellClassname, { exact: true });
});

test('summaryCellClass is a string', async () => {
  const columns: readonly Column<never, SummaryRow>[] = [
    {
      key: 'id',
      name: 'ID',
      summaryCellClass: 'my-cell'
    }
  ];
  await setup({ columns, topSummaryRows, bottomSummaryRows, rows: [] });
  for (const cell of cells.all()) {
    await expect.element(cell).toHaveClass(`${cellClassname} my-cell`, { exact: true });
  }
});

test('summaryCellClass returns a string', async () => {
  const columns: readonly Column<never, SummaryRow>[] = [
    {
      key: 'id',
      name: 'ID',
      summaryCellClass: (row) => `my-cell-${row.id}`
    }
  ];
  await setup({ columns, topSummaryRows, bottomSummaryRows, rows: [] });
  await expect.element(cells.nth(0)).toHaveClass(`${cellClassname} my-cell-0`, { exact: true });
  await expect.element(cells.nth(1)).toHaveClass(`${cellClassname} my-cell-1`, { exact: true });
  await expect.element(cells.nth(2)).toHaveClass(`${cellClassname} my-cell-2`, { exact: true });
  await expect.element(cells.nth(3)).toHaveClass(`${cellClassname} my-cell-3`, { exact: true });
});

test('summaryCellClass returns undefined', async () => {
  const columns: readonly Column<never, SummaryRow>[] = [
    {
      key: 'id',
      name: 'ID',
      summaryCellClass: () => undefined
    }
  ];
  await setup({ columns, topSummaryRows, bottomSummaryRows, rows: [] });
  for (const cell of cells.all()) {
    await expect.element(cell).toHaveClass(cellClassname, { exact: true });
  }
});
