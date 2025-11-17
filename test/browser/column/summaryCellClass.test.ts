import type { Column } from '../../../src';
import { cellClassname as cellClass } from '../../../src/style/cell';
import { summaryCellClassname } from '../../../src/SummaryCell';
import { getCells, setup } from '../utils';

interface SummaryRow {
  id: number;
}

const cellClassname = `${cellClass} ${summaryCellClassname}`;
const topSummaryRows: readonly SummaryRow[] = [{ id: 0 }, { id: 1 }];
const bottomSummaryRows: readonly SummaryRow[] = [{ id: 2 }, { id: 3 }];

test('summaryCellClass is undefined', async () => {
  const columns: readonly Column<never, SummaryRow>[] = [
    {
      key: 'id',
      name: 'ID'
    }
  ];
  await setup({ columns, topSummaryRows, bottomSummaryRows, rows: [] });
  const [cell1, cell2] = getCells();
  expect(cell1).toHaveClass(cellClassname, { exact: true });
  expect(cell2).toHaveClass(cellClassname, { exact: true });
});

test('summaryCellClass is a string', async () => {
  const columns: readonly Column<never, SummaryRow>[] = [
    {
      key: 'id',
      name: 'ID',
      summaryCellClass: 'my-cell'
    }
  ];
  await setup({ columns, topSummaryRows, bottomSummaryRows, rows: [] });
  const cells = getCells();
  for (const cell of cells) {
    expect(cell).toHaveClass(`${cellClassname} my-cell`, { exact: true });
  }
});

test('summaryCellClass returns a string', async () => {
  const columns: readonly Column<never, SummaryRow>[] = [
    {
      key: 'id',
      name: 'ID',
      summaryCellClass: (row) => `my-cell-${row.id}`
    }
  ];
  await setup({ columns, topSummaryRows, bottomSummaryRows, rows: [] });
  const [cell1, cell2, cell3, cell4] = getCells();
  expect(cell1).toHaveClass(`${cellClassname} my-cell-0`, { exact: true });
  expect(cell2).toHaveClass(`${cellClassname} my-cell-1`, { exact: true });
  expect(cell3).toHaveClass(`${cellClassname} my-cell-2`, { exact: true });
  expect(cell4).toHaveClass(`${cellClassname} my-cell-3`, { exact: true });
});

test('summaryCellClass returns undefined', async () => {
  const columns: readonly Column<never, SummaryRow>[] = [
    {
      key: 'id',
      name: 'ID',
      summaryCellClass: () => undefined
    }
  ];
  await setup({ columns, topSummaryRows, bottomSummaryRows, rows: [] });
  const cells = getCells();
  for (const cell of cells) {
    expect(cell).toHaveClass(cellClassname, { exact: true });
  }
});
