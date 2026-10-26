import { page, userEvent } from 'vite-plus/test/browser';

import type { Column } from '../../../src';
import { cellClassname, cellFrozenStartClassname } from '../../../src/style/cell';
import { getCellsAtRowIndex, scrollGrid, setup } from '../utils';

const headerCells = page.getHeaderCell();

test('frozen columns have a specific class and are stable-sorted before non-frozen columns', async () => {
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

  await expect.element(cell1).toHaveClass(cellClassname, cellFrozenStartClassname, { exact: true });
  await expect.element(cell2).toHaveClass(cellClassname, cellFrozenStartClassname, { exact: true });
  await expect.element(cell3).toHaveClass(cellClassname, { exact: true });
  await expect.element(cell4).toHaveClass(cellClassname, { exact: true });
});

test('focusing a frozen cell does not scroll the grid', async () => {
  const columns: Column<number>[] = [];
  for (let i = 0; i < 50; i++) {
    columns.push({
      key: `col${i}`,
      name: `col${i}`,
      width: 100,
      frozen: i === 0
    });
  }

  await setup({ columns, rows: [0, 1] });
  // activate the frozen cell before scrolling, as clicking scrolls the cell into view
  await userEvent.click(getCellsAtRowIndex(0).nth(0));
  scrollGrid({ left: 1000 });
  await userEvent.keyboard('{arrowdown}');
  await expect.element(getCellsAtRowIndex(1).nth(0)).toHaveFocus();
  expect(page.getGrid().element().scrollLeft).toBe(1000);
});
