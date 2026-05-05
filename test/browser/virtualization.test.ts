import { page, type Locator } from 'vitest/browser';

import type { Column } from '../../src';
import { getCellsAtRowIndex, scrollGrid, setup } from './utils';

const headerCells = page.getHeaderCell();
const rows = page.getRow();
const cells = page.getCell();

const rowHeight = 35;

function setupGrid(
  enableVirtualization: boolean,
  columnCount: number,
  rowCount: number,
  frozenColumnCount = 0,
  summaryRowCount = 0
) {
  const columns: Column<unknown, null>[] = [];
  const rows = Array.from({ length: rowCount });
  const topSummaryRows = Array.from({ length: summaryRowCount }, () => null);
  const bottomSummaryRows = Array.from({ length: summaryRowCount }, () => null);

  for (let i = 0; i < columnCount; i++) {
    const key = String(i);
    columns.push({
      key,
      name: key,
      width: 100 + ((i * 10) % 50),
      frozen: i < frozenColumnCount
    });
  }

  return setup({
    columns,
    rows,
    topSummaryRows,
    bottomSummaryRows,
    rowHeight,
    enableVirtualization
  });
}

async function assertElements(
  locator: Locator,
  attribute: string,
  count: number,
  startIdx: number,
  endIdx: number
) {
  await expect.element(locator).toHaveLength(count);
  await expect.element(locator.first()).toHaveAttribute(attribute, String(startIdx));
  await expect.element(locator.last()).toHaveAttribute(attribute, String(endIdx));
}

async function assertIndexes(
  locator: Locator,
  indexes: number[],
  attribute: string,
  indexOffset: number
) {
  await expect.element(locator).toHaveLength(indexes.length);

  for (const [n, index] of indexes.entries()) {
    await expect.element(locator.nth(n)).toHaveAttribute(attribute, String(index + indexOffset));
  }
}

async function assertHeaderCells(count: number, startIdx: number, endIdx: number) {
  await assertElements(headerCells, 'aria-colindex', count, startIdx + 1, endIdx + 1);
}

async function assertHeaderCellIndexes(indexes: number[]) {
  await assertIndexes(headerCells, indexes, 'aria-colindex', 1);
}

async function assertRows(count: number, startIdx: number, endIdx: number) {
  await assertElements(rows, 'aria-rowindex', count, startIdx + 2, endIdx + 2);
}

async function assertRowIndexes(indexes: number[]) {
  await assertIndexes(rows, indexes, 'aria-rowindex', 2);
}

async function assertCells(rowIdx: number, count: number, startIdx: number, endIdx: number) {
  await assertElements(
    getCellsAtRowIndex(rowIdx),
    'aria-colindex',
    count,
    startIdx + 1,
    endIdx + 1
  );
}

async function assertCellIndexes(rowIdx: number, indexes: number[]) {
  await assertIndexes(getCellsAtRowIndex(rowIdx), indexes, 'aria-colindex', 1);
}

test('virtualization is enabled', async () => {
  await setupGrid(true, 30, 100);

  await assertHeaderCells(18, 0, 17);
  await assertRows(34, 0, 33);
  await assertCells(0, 18, 0, 17);
  scrollGrid({ top: 244 });
  await assertRows(39, 2, 40);

  scrollGrid({ top: 245 });
  await assertRows(38, 3, 40);

  scrollGrid({ top: 419 });
  await assertRows(39, 7, 45);

  scrollGrid({ top: 420 });
  await assertRows(38, 8, 45);

  scrollGrid({ top: 524 });
  await assertRows(39, 10, 48);

  scrollGrid({ top: 525 });
  await assertRows(38, 11, 48);

  scrollGrid({ top: 1000 });
  await assertRows(39, 24, 62);

  // scroll height = header height + row height * row count
  // max top = scroll height - grid height
  scrollGrid({ top: rowHeight + rowHeight * 100 - 1080 });
  await assertRows(34, 66, 99);

  scrollGrid({ left: 92 });
  await assertHeaderCells(18, 0, 17);
  await assertCells(66, 18, 0, 17);

  scrollGrid({ left: 93 });
  await assertHeaderCells(19, 0, 18);
  await assertCells(66, 19, 0, 18);

  scrollGrid({ left: 209 });
  await assertHeaderCells(19, 0, 18);
  await assertCells(66, 19, 0, 18);

  scrollGrid({ left: 210 });
  await assertHeaderCells(18, 1, 18);
  await assertCells(66, 18, 1, 18);

  // max left = row width - grid width
  scrollGrid({ left: 3600 - 1920 });
  await assertHeaderCells(17, 13, 29);
  await assertCells(66, 17, 13, 29);
});

test('virtualization is enabled with 4 frozen columns', async () => {
  await setupGrid(true, 30, 30, 4);

  let indexes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  await assertHeaderCellIndexes(indexes);
  await assertCellIndexes(0, indexes);

  scrollGrid({ left: 1000 });
  indexes = [0, 1, 2, 3, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
  await assertHeaderCellIndexes(indexes);
  await assertCellIndexes(0, indexes);

  // max left = row width - grid width
  scrollGrid({ left: 3600 - 1920 });
  indexes = [0, 1, 2, 3, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29];
  await assertHeaderCellIndexes(indexes);
  await assertCellIndexes(0, indexes);
});

test('virtualization is enabled with all columns frozen', async () => {
  await setupGrid(true, 30, 30, 30);

  const indexes = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
    26, 27, 28, 29
  ];
  await assertHeaderCellIndexes(indexes);
  await assertCellIndexes(0, indexes);

  scrollGrid({ left: 1000 });
  await assertHeaderCellIndexes(indexes);
  await assertCellIndexes(0, indexes);

  // max left = row width - grid width
  scrollGrid({ left: 3600 - 1920 });
  await assertHeaderCellIndexes(indexes);
  await assertCellIndexes(0, indexes);
});

test('virtualization is enabled with end-frozen columns', async () => {
  // 30 columns total, cols 28 and 29 are end-frozen — always in DOM regardless of scroll
  const columns: Column<unknown>[] = [];
  const rows = Array.from({ length: 30 });

  for (let i = 0; i < 30; i++) {
    const key = String(i);
    columns.push({
      key,
      name: key,
      width: 100 + ((i * 10) % 50),
      frozen: i >= 28 ? 'end' : false
    });
  }

  await setup({ columns, rows, rowHeight });

  // At scroll 0: first visible cells + end-frozen tail rendered; middle cells virtualized away.
  scrollGrid({ left: 0 });
  await expect.element(page.getHeaderCell({ name: '0' })).toBeInTheDocument();
  await expect.element(page.getHeaderCell({ name: '28' })).toBeInTheDocument();
  await expect.element(page.getHeaderCell({ name: '29' })).toBeInTheDocument();
  // a far-right middle column is NOT in DOM at scroll 0
  await expect.element(page.getHeaderCell({ name: '25' })).not.toBeInTheDocument();

  // At max scroll: far-left unfrozen column virtualized away; end-frozen still rendered
  scrollGrid({ left: 3600 - 1920 });
  await expect.element(page.getHeaderCell({ name: '0' })).not.toBeInTheDocument();
  await expect.element(page.getHeaderCell({ name: '28' })).toBeInTheDocument();
  await expect.element(page.getHeaderCell({ name: '29' })).toBeInTheDocument();
});

test('virtualization is enabled with start + end frozen columns', async () => {
  // 30 columns total, cols 0-2 start-frozen, cols 28-29 end-frozen
  const columns: Column<unknown>[] = [];
  const rows = Array.from({ length: 30 });

  for (let i = 0; i < 30; i++) {
    const key = String(i);
    columns.push({
      key,
      name: key,
      width: 100 + ((i * 10) % 50),
      frozen: i < 3 ? 'start' : i >= 28 ? 'end' : false
    });
  }

  await setup({ columns, rows, rowHeight });

  // At scroll 0: start (0,1,2) + early unfrozen + end (28,29) rendered; middle virtualized away.
  scrollGrid({ left: 0 });
  await expect.element(page.getHeaderCell({ name: '0' })).toBeInTheDocument();
  await expect.element(page.getHeaderCell({ name: '2' })).toBeInTheDocument();
  await expect.element(page.getHeaderCell({ name: '28' })).toBeInTheDocument();
  await expect.element(page.getHeaderCell({ name: '29' })).toBeInTheDocument();
  await expect.element(page.getHeaderCell({ name: '25' })).not.toBeInTheDocument();

  // At max scroll: BOTH start and end bands still rendered; an early unfrozen column (3) virtualized away.
  scrollGrid({ left: 3600 - 1920 });
  await expect.element(page.getHeaderCell({ name: '0' })).toBeInTheDocument();
  await expect.element(page.getHeaderCell({ name: '2' })).toBeInTheDocument();
  await expect.element(page.getHeaderCell({ name: '3' })).not.toBeInTheDocument();
  await expect.element(page.getHeaderCell({ name: '28' })).toBeInTheDocument();
  await expect.element(page.getHeaderCell({ name: '29' })).toBeInTheDocument();
});

test('virtualization is enabled with 2 summary rows', async () => {
  await setupGrid(true, 1, 100, 0, 2);

  await assertRowIndexes([
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
    26, 27, 28, 29, 30, 31, 102, 103
  ]);

  scrollGrid({ top: 1000 });
  await assertRowIndexes([
    0, 1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
    48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 102, 103
  ]);
});

test('zero columns', async () => {
  await setupGrid(true, 0, 100);

  await expect.element(headerCells).toHaveLength(0);
  await expect.element(cells).toHaveLength(0);
  await expect.element(rows).toHaveLength(34);
});

test('zero rows', async () => {
  await setupGrid(true, 20, 0);

  await expect.element(headerCells).toHaveLength(18);
  await expect.element(cells).toHaveLength(0);
  await expect.element(rows).toHaveLength(0);
});

test('virtualization is enabled with not enough columns or rows to virtualize', async () => {
  await setupGrid(true, 5, 5);

  await assertHeaderCells(5, 0, 4);
  await assertRows(5, 0, 4);
  await expect.element(cells).toHaveLength(5 * 5);
});

test('virtualization is disabled with no frozen columns', async () => {
  await setupGrid(false, 40, 100);

  await assertHeaderCells(40, 0, 39);
  await assertRows(100, 0, 99);
  await expect.element(cells).toHaveLength(40 * 100);
});

// failing test
// cannot use `test.fails` as console logs lead to timeout in parallel tests
// https://github.com/vitest-dev/vitest/issues/9941
test.skip('virtualization is disabled with some frozen columns', async () => {
  await setupGrid(false, 40, 100, 3);

  await assertHeaderCells(40, 0, 39);
  await assertRows(100, 0, 99);
  await expect.element(cells).toHaveLength(40 * 100);
});
