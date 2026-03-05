import { page, userEvent } from 'vitest/browser';

import type { Column } from '../../src';
import { safeTab, setup } from './utils';

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
  await setup({ rows, columns });
  await expect.element(grid).toHaveAttribute('dir', 'ltr');
  await safeTab();
  await expect.element(activeCell).toHaveTextContent('ID');
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(activeCell).toHaveTextContent('Name');
});

test('should use left to right direction if direction prop is set to ltr', async () => {
  await setup({ rows, columns, direction: 'ltr' });
  await expect.element(grid).toHaveAttribute('dir', 'ltr');
  await safeTab();
  await expect.element(activeCell).toHaveTextContent('ID');
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(activeCell).toHaveTextContent('Name');
});

test('should use right to left direction if direction prop is set to rtl', async () => {
  await setup({ rows, columns, direction: 'rtl' });
  await expect.element(grid).toHaveAttribute('dir', 'rtl');
  await safeTab();
  await expect.element(activeCell).toHaveTextContent('ID');
  await userEvent.keyboard('{ArrowLeft}');
  await expect.element(activeCell).toHaveTextContent('Name');
});
