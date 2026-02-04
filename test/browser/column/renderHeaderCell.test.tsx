import type { Column } from '../../../src';
import { getHeaderCells, setup } from '../utils';

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
  const [cell1, cell2] = getHeaderCells();
  await expect.element(cell1).toHaveTextContent('ID');
  await expect.element(cell2).toHaveTextContent('Fancy! Name');
});
