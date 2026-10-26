import { page } from 'vite-plus/test/browser';

import type { Column } from '../../../src';
import { setup } from '../utils';

const grid = page.getGrid();

test('auto columns are at least as wide as their content, within their minWidth and maxWidth', async () => {
  const longName = 'x'.repeat(50);
  const columns: Column<unknown>[] = [
    { key: 'min', name: '', minWidth: 120 },
    { key: 'max', name: longName, maxWidth: 100 }
  ];

  // the columns are wider than the grid
  for (let i = 0; i < 10; i++) {
    columns.push({ key: String(i), name: `${i}${longName}` });
  }

  await setup<unknown, unknown>({ columns, rows: [] });

  await expect.poll(() => grid.element().style.gridTemplateColumns).toMatch(/^120px 100px /);
  // the content of the other columns is not truncated
  const headerCell = page.getHeaderCell({ name: `0${longName}` }).element();
  expect(headerCell.clientWidth).toBe(headerCell.scrollWidth);
});
