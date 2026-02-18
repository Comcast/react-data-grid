import { page } from 'vitest/browser';

import type { Column } from '../../src';
import { rowClassname } from '../../src/style/row';
import { setup } from './utils';

const rows = page.getRow();

interface Row {
  id: number;
}

const columns: readonly Column<Row>[] = [{ key: 'id', name: 'ID' }];
const initialRows: readonly Row[] = [{ id: 0 }, { id: 1 }, { id: 2 }];

test('rowClass is undefined', async () => {
  await setup({
    columns,
    rows: initialRows,
    rowClass: undefined
  });
  await expect.element(rows.nth(0)).toHaveClass(`${rowClassname} rdg-row-even`, { exact: true });
  await expect.element(rows.nth(1)).toHaveClass(`${rowClassname} rdg-row-odd`, { exact: true });
  await expect.element(rows.nth(2)).toHaveClass(`${rowClassname} rdg-row-even`, { exact: true });
});

test('rowClass returns a string', async () => {
  await setup({
    columns,
    rows: initialRows,
    rowClass: (row) => `my-row-${row.id}`
  });
  await expect
    .element(rows.nth(0))
    .toHaveClass(`${rowClassname} rdg-row-even my-row-0`, { exact: true });
  await expect
    .element(rows.nth(1))
    .toHaveClass(`${rowClassname} rdg-row-odd my-row-1`, { exact: true });
  await expect
    .element(rows.nth(2))
    .toHaveClass(`${rowClassname} rdg-row-even my-row-2`, { exact: true });
});

test('rowClass returns undefined', async () => {
  await setup({
    columns,
    rows: initialRows,
    rowClass: () => undefined
  });
  await expect.element(rows.nth(0)).toHaveClass(`${rowClassname} rdg-row-even`, { exact: true });
  await expect.element(rows.nth(1)).toHaveClass(`${rowClassname} rdg-row-odd`, { exact: true });
  await expect.element(rows.nth(2)).toHaveClass(`${rowClassname} rdg-row-even`, { exact: true });
});
