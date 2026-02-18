import { page } from 'vitest/browser';

import type { Column } from '../../../src';
import { setup } from '../utils';

const headerCells = page.getHeaderCell();

test('renderHeaderCell is either undefined or a component', async () => {
  const columns: readonly Column<never>[] = [
    {
      key: 'id',
      name: 'ID'
    },
    {
      key: 'name',
      name: 'Name',
      renderHeaderCell: ({ column }) => `Fancy! ${column.name}`
    }
  ];

  await setup({ columns, rows: [] });
  await expect.element(headerCells.nth(0)).toHaveTextContent('ID');
  await expect.element(headerCells.nth(1)).toHaveTextContent('Fancy! Name');
});
