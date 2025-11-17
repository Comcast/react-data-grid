import type { Column } from '../../../src';
import { cellClassname } from '../../../src/style/cell';
import { getCellsNew, setup } from '../utils';

interface Row {
  id: number;
}

const rows: readonly Row[] = [{ id: 0 }, { id: 1 }];

test('cellClass is undefined', async () => {
  const columns: readonly Column<Row>[] = [
    {
      key: 'id',
      name: 'ID'
    }
  ];
  await setup({ columns, rows });
  const [cell1, cell2] = getCellsNew('0', '1');
  await expect.element(cell1).toHaveClass(cellClassname, { exact: true });
  await expect.element(cell2).toHaveClass(cellClassname, { exact: true });
});

test('cellClass is a string', async () => {
  const columns: readonly Column<Row>[] = [
    {
      key: 'id',
      name: 'ID',
      cellClass: 'my-cell'
    }
  ];
  await setup({ columns, rows });
  const [cell1, cell2] = getCellsNew('0', '1');
  await expect.element(cell1).toHaveClass(`${cellClassname} my-cell`, { exact: true });
  await expect.element(cell2).toHaveClass(`${cellClassname} my-cell`, { exact: true });
});

test('cellClass returns a string', async () => {
  const columns: readonly Column<Row>[] = [
    {
      key: 'id',
      name: 'ID',
      cellClass: (row) => `my-cell-${row.id}`
    }
  ];
  await setup({ columns, rows });
  const [cell1, cell2] = getCellsNew('0', '1');
  await expect.element(cell1).toHaveClass(`${cellClassname} my-cell-0`, { exact: true });
  await expect.element(cell2).toHaveClass(`${cellClassname} my-cell-1`, { exact: true });
});

test('cellClass returns undefined', async () => {
  const columns: readonly Column<Row>[] = [
    {
      key: 'id',
      name: 'ID',
      cellClass: () => undefined
    }
  ];
  await setup({ columns, rows });
  const [cell1, cell2] = getCellsNew('0', '1');
  await expect.element(cell1).toHaveClass(cellClassname, { exact: true });
  await expect.element(cell2).toHaveClass(cellClassname, { exact: true });
});
