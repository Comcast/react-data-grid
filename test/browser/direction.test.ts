import { userEvent } from 'vitest/browser';
import type { Column } from '../../src';
import { getGrid, getSelectedCell, setup, tabIntoGrid } from './utils';

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
  await expect.element(getGrid()).toHaveAttribute('dir', 'ltr');
  await tabIntoGrid();
  await expect.element(getSelectedCell()).toHaveTextContent('ID');
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(getSelectedCell()).toHaveTextContent('Name');
});

test('should use left to right direction if direction prop is set to ltr', async () => {
  await setup({ rows, columns, direction: 'ltr' }, true);
  await expect.element(getGrid()).toHaveAttribute('dir', 'ltr');
  await tabIntoGrid();
  await expect.element(getSelectedCell()).toHaveTextContent('ID');
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(getSelectedCell()).toHaveTextContent('Name');
});

test('should use right to left direction if direction prop is set to rtl', async () => {
  await setup({ rows, columns, direction: 'rtl' }, true);
  await expect.element(getGrid()).toHaveAttribute('dir', 'rtl');
  await tabIntoGrid();
  await expect.element(getSelectedCell()).toHaveTextContent('ID');
  await userEvent.keyboard('{ArrowLeft}');
  await expect.element(getSelectedCell()).toHaveTextContent('Name');
});
