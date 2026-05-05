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

test('start and end frozen columns use logical insets under RTL', async () => {
  interface RtlRow {
    id: number;
    name: string;
    trailing: string;
  }

  const rtlColumns: readonly Column<RtlRow>[] = [
    { key: 'id', name: 'ID', frozen: 'start', width: 60 },
    { key: 'name', name: 'Name', width: 100 },
    { key: 'trailing', name: 'Trailing', frozen: 'end', width: 80 }
  ];
  const rtlRows: readonly RtlRow[] = [];

  await setup({ rows: rtlRows, columns: rtlColumns, direction: 'rtl' });

  await expect.element(grid).toHaveAttribute('dir', 'rtl');

  const headerById = page.getHeaderCell({ name: 'ID' }).element();
  const headerByTrailing = page.getHeaderCell({ name: 'Trailing' }).element();

  // Logical properties: both cells use logical insets which the browser flips physically in RTL
  expect(getComputedStyle(headerById).position).toBe('sticky');
  expect(getComputedStyle(headerById).insetInlineStart).toBe('0px');

  expect(getComputedStyle(headerByTrailing).position).toBe('sticky');
  expect(getComputedStyle(headerByTrailing).insetInlineEnd).toBe('0px');
});
