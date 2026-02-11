import { page } from 'vitest/browser';

import type { Column } from '../../../src';
import { cellClassname, cellFrozenClassname } from '../../../src/style/cell';
import { setup } from '../utils';

const headerCells = page.getHeaderCell();

test('frozen column have a specific class, and are stable-sorted before non-frozen columns', async () => {
  const columns: readonly Column<never>[] = [
    {
      key: 'col1',
      name: 'col1',
      frozen: true
    },
    {
      key: 'col2',
      name: 'col2'
    },
    {
      key: 'col3',
      name: 'col3',
      frozen: true
    },
    {
      key: 'col4',
      name: 'col4',
      frozen: false
    }
  ];

  await setup({ columns, rows: [] });

  const [cell1, cell2, cell3, cell4] = headerCells.all();

  await expect.element(cell1).toHaveTextContent('col1');
  await expect.element(cell2).toHaveTextContent('col3');
  await expect.element(cell3).toHaveTextContent('col2');
  await expect.element(cell4).toHaveTextContent('col4');

  await expect
    .element(cell1)
    .toHaveClass(`${cellClassname} ${cellFrozenClassname}`, { exact: true });
  await expect
    .element(cell2)
    .toHaveClass(`${cellClassname} ${cellFrozenClassname}`, { exact: true });
  await expect.element(cell3).toHaveClass(cellClassname, { exact: true });
  await expect.element(cell4).toHaveClass(cellClassname, { exact: true });
});
