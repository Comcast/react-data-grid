import { page } from 'vitest/browser';
import type { Column } from '../../../src';
import { cellClassname, cellFrozenClassname } from '../../../src/style/cell';
import { getHeaderCellsNew, setup } from '../utils';

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
  await expect.element(page.getByRole('row')).toHaveTextContent('col1col3col2col4');
  const [cell1, cell2, cell3, cell4] = getHeaderCellsNew('col1', 'col2', 'col3', 'col4');

  await expect
    .element(cell1)
    .toHaveClass(`${cellClassname} ${cellFrozenClassname}`, { exact: true });
  await expect
    .element(cell3)
    .toHaveClass(`${cellClassname} ${cellFrozenClassname}`, { exact: true });
  await expect.element(cell2).toHaveClass(cellClassname, { exact: true });
  await expect.element(cell4).toHaveClass(cellClassname, { exact: true });
});
