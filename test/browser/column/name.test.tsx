import type { Column } from '../../../src';
import { getHeaderCellsNew, setup } from '../utils';

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
  const [cell1, cell2] = getHeaderCellsNew('ID', 'Fancy');
  await expect.element(cell1).toBeVisible();
  await expect.element(cell2).toBeVisible();
});
