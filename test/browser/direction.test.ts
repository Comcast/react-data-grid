import { page, userEvent } from 'vitest/browser';

import type { Column } from '../../src';
import { setup, tabIntoGrid } from './utils';

const grid = page.getGrid();
const activeCell = grid.getActiveCell();

interface Row {
  id: number;
  name: string;
}

const columns: readonly Column<Row>[] = [
  {
    key: 'id',
    name: 'ID'
  },
  {
    key: 'name',
    name: 'Name'
  }
];

const rows: readonly Row[] = [];

test('should use left to right direction by default', async () => {
  await setup({ rows, columns }, true);
  await expect.element(grid).toHaveAttribute('dir', 'ltr');
  await tabIntoGrid();
  await expect.element(activeCell).toHaveTextContent('ID');
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(activeCell).toHaveTextContent('Name');
});

test('should use left to right direction if direction prop is set to ltr', async () => {
  await setup({ rows, columns, direction: 'ltr' }, true);
  await expect.element(grid).toHaveAttribute('dir', 'ltr');
  await tabIntoGrid();
  await expect.element(activeCell).toHaveTextContent('ID');
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(activeCell).toHaveTextContent('Name');
});

test('should use right to left direction if direction prop is set to rtl', async () => {
  await setup({ rows, columns, direction: 'rtl' }, true);
  await expect.element(grid).toHaveAttribute('dir', 'rtl');
  await tabIntoGrid();
  await expect.element(activeCell).toHaveTextContent('ID');
  await userEvent.keyboard('{ArrowLeft}');
  await expect.element(activeCell).toHaveTextContent('Name');
});
