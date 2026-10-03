import { page } from 'vitest/browser';

import type { Column } from '../../../src';
import { setup } from '../utils';

const headerCells = page.getHeaderCell();

test('name is either a string or an element', async () => {
  function Header() {
    return 'Fancy';
  }

  const columns: readonly Column<never>[] = [
    {
      key: 'id',
      name: 'ID'
    },
    {
      key: 'name',
      name: <Header />
    }
  ];

  await setup({ columns, rows: [] });
  await expect.element(headerCells.nth(0)).toBeVisible();
  await expect.element(headerCells.nth(1)).toBeVisible();
});
