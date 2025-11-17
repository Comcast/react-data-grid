import { userEvent } from 'vitest/browser';

import type { Column, DataGridProps } from '../../src';
import { getGrid, setup, tabIntoGrid, testRowCount } from './utils';

type Row = number;

function setupGrid(rowHeight: DataGridProps<Row>['rowHeight']) {
  const columns: Column<Row>[] = [];
  const rows: readonly Row[] = Array.from({ length: 50 }, (_, i) => i);

  for (let i = 0; i < 5; i++) {
    const key = String(i);
    columns.push({
      key,
      name: key,
      width: 80
    });
  }
  return setup({ columns, rows, rowHeight }, true);
}

async function expectGridRows(rowHeightFn: (row: number) => number, expected: string) {
  await setupGrid(rowHeightFn);

  const grid = getGrid().element() as HTMLDivElement;
  const gridTemplateRows = grid.style.gridTemplateRows;

  expect(gridTemplateRows).toBe(expected);
}

test('rowHeight is number', async () => {
  await setupGrid(40);

  const grid = getGrid();
  await expect.element(grid).toHaveStyle({
    gridTemplateRows:
      '40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px'
  });
  await testRowCount(31);
  await tabIntoGrid();
  const gridEl = grid.element();
  expect(gridEl.scrollTop).toBe(0);
  await userEvent.keyboard('{Control>}{end}');
  expect(gridEl.scrollTop + gridEl.clientHeight).toBe(gridEl.scrollHeight);
});

test('rowHeight is function', async () => {
  await setupGrid((row) => [40, 60, 80][row % 3]);

  const grid = getGrid();
  await expect.element(grid).toHaveStyle({
    gridTemplateRows:
      '35px 40px 60px 80px 40px 60px 80px 40px 60px 80px 40px 60px 80px 40px 60px 80px 40px 60px 80px 40px 60px 80px 40px 60px 80px 40px 60px 80px 40px 60px 80px 40px 60px 80px 40px 60px 80px 40px 60px 80px 40px 60px 80px 40px 60px 80px 40px 60px 80px 40px 60px'
  });
  await testRowCount(23);

  await tabIntoGrid();
  const gridEl = grid.element();
  expect(gridEl.scrollTop).toBe(0);
  await userEvent.keyboard('{Control>}{end}');
  expect(gridEl.scrollTop + gridEl.clientHeight).toBe(gridEl.scrollHeight);
});

test('rowHeight with repeat pattern - multiple identical heights', async () => {
  await expectGridRows(() => 40, 'repeat(1, 35px) repeat(50, 40px)');
});

test('rowHeight with mixed heights - one unique in middle', async () => {
  await expectGridRows(
    (row) => (row === 25 ? 40 : 50),
    'repeat(1, 35px) repeat(25, 50px) 40px repeat(24, 50px)'
  );
});

test('rowHeight with unique heights', async () => {
  await expectGridRows(
    (row) => row + 1,
    'repeat(1, 35px) 1px 2px 3px 4px 5px 6px 7px 8px 9px 10px 11px 12px 13px 14px 15px 16px 17px 18px 19px 20px 21px 22px 23px 24px 25px 26px 27px 28px 29px 30px 31px 32px 33px 34px 35px 36px 37px 38px 39px 40px 41px 42px 43px 44px 45px 46px 47px 48px 49px 50px'
  );
});

test('rowHeight with unique first and unique last heights', async () => {
  await expectGridRows((row) => {
    if (row === 0) {
      return 10;
    }

    if (row === 49) {
      return 20;
    }

    return 50;
  }, 'repeat(1, 35px) 10px repeat(48, 50px) 20px');
});

test('rowHeight with unique last height', async () => {
  await expectGridRows((row) => {
    return row === 49 ? 50 : 20;
  }, 'repeat(1, 35px) repeat(49, 20px) 50px');
});

test('rowHeight with unique first height', async () => {
  await expectGridRows((row) => {
    return row === 0 ? 45 : 50;
  }, 'repeat(1, 35px) 45px repeat(49, 50px)');
});
