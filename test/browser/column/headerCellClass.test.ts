import type { Column, ColumnGroup } from '../../../src';
import { cellClassname } from '../../../src/style/cell';
import { getHeaderCells, setup } from '../utils';

test('headerCellClass is either nullish or a string', async () => {
  const columns: readonly Column<never>[] = [
    {
      key: 'id',
      name: 'ID'
    },
    {
      key: 'name',
      name: 'Name',
      headerCellClass: 'my-header'
    }
  ];

  await setup({ columns, rows: [] });
  const [cell1, cell2] = getHeaderCells();
  expect(cell1).toHaveClass(cellClassname, { exact: true });
  expect(cell2).toHaveClass(`${cellClassname} my-header`, { exact: true });
});

test('columnGroup.headerCellClass is either nullish or a string', async () => {
  const columns: readonly ColumnGroup<never>[] = [
    {
      name: 'Group 1',
      children: [{ key: '1', name: '1' }]
    },
    {
      name: 'Group 2',
      headerCellClass: 'my-header',
      children: [{ key: '2', name: '2' }]
    }
  ];

  await setup({ columns, rows: [] });
  const [cell1, cell2] = getHeaderCells();
  expect(cell1).toHaveClass(cellClassname, { exact: true });
  expect(cell2).toHaveClass(`${cellClassname} my-header`, { exact: true });
});
