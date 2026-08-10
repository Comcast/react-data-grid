import { page, userEvent } from 'vitest/browser';

import type { Column, DataGridProps } from '../../src';
import { safeTab, setup, testRowCount } from './utils';

const grid = page.getGrid();

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
  return setup({ columns, rows, rowHeight });
}

async function expectGridRows(rowHeightFn: (row: number) => number, expected: string) {
  await setupGrid(rowHeightFn);

  expect(grid.element().style.gridTemplateRows).toBe(expected);
}

// Data rows are rendered with `aria-rowindex` starting at 2 (the header row is 1),
// so the zero-based row index of the active cell is `aria-rowindex - 2`.
function getActiveDataRowIdx() {
  const cell = page.getActiveCell().element();
  const row = cell.closest('[role="row"]')!;
  return Number(row.getAttribute('aria-rowindex')) - 2;
}

test('rowHeight is number', async () => {
  await setupGrid(40);

  await expect.element(grid).toHaveStyle({
    gridTemplateRows:
      '40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px 40px'
  });
  await testRowCount(30);
  await safeTab();
  await expect.element(grid).toHaveProperty('scrollTop', 0);
  await userEvent.keyboard('{Control>}{end}');
  const gridEl = grid.element();
  expect(gridEl.scrollTop + gridEl.clientHeight).toBe(gridEl.scrollHeight);
});

test('rowHeight is function', async () => {
  await setupGrid((row) => [40, 60, 80][row % 3]);

  await expect.element(grid).toHaveStyle({
    gridTemplateRows:
      '35px 40px 60px 80px 40px 60px 80px 40px 60px 80px 40px 60px 80px 40px 60px 80px 40px 60px 80px 40px 60px 80px 40px 60px 80px 40px 60px 80px 40px 60px 80px 40px 60px 80px 40px 60px 80px 40px 60px 80px 40px 60px 80px 40px 60px 80px 40px 60px 80px 40px 60px'
  });
  await testRowCount(22);

  await safeTab();
  await expect.element(grid).toHaveProperty('scrollTop', 0);
  await userEvent.keyboard('{Control>}{end}');
  const gridEl = grid.element();
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

test('rowHeight is "auto" sets gridTemplateRows to repeat(N, auto)', async () => {
  await setupGrid('auto');

  expect(grid.element().style.gridTemplateRows).toBe('repeat(1, 35px) repeat(50, auto)');
});

test('rowHeight as a string auto-disables virtualization and renders all rows', async () => {
  await setupGrid('auto');

  // virtualization is off by default when `rowHeight` is a string,
  // so every row is rendered regardless of viewport size
  await testRowCount(50);
});

test('rowHeight accepts arbitrary CSS track values', async () => {
  await setupGrid('min-content');

  expect(grid.element().style.gridTemplateRows).toBe('repeat(1, 35px) repeat(50, min-content)');
  await testRowCount(50);
});

test('rowHeight is "auto" sizes rows to fit their content', async () => {
  const columns: Column<{ id: number; content: string }>[] = [
    { key: 'id', name: 'ID', width: 80 },
    {
      key: 'content',
      name: 'Content',
      width: 200,
      renderCell: ({ row }) => <div style={{ whiteSpace: 'pre' }}>{row.content}</div>
    }
  ];
  const rows = [
    { id: 0, content: 'short' },
    { id: 1, content: 'line one\nline two\nline three\nline four' }
  ];

  await setup({ columns, rows, rowHeight: 'auto' });

  const row0 = page.getRow().nth(0).element() as HTMLElement;
  const row1 = page.getRow().nth(1).element() as HTMLElement;

  // multi-line cell must render taller than the single-line cell
  expect(row1.clientHeight).toBeGreaterThan(row0.clientHeight);
});

test('rowHeight string + explicit enableVirtualization=true throws', async () => {
  // Suppress React's error logging for this expected render error
  // eslint-disable-next-line no-console
  vi.mocked(console.error).mockImplementation(() => {});

  await expect(
    setup({
      columns: [{ key: 'id', name: 'ID' }],
      rows: [{ id: 0 }],
      rowHeight: 'auto',
      enableVirtualization: true
    })
  ).rejects.toThrow('`rowHeight` cannot be a string when `enableVirtualization` is true.');

  // eslint-disable-next-line no-console
  vi.mocked(console.error).mockClear();
});

test('PageDown/PageUp navigate through string (auto) height rows', async () => {
  const columns: Column<{ id: number; content: string }>[] = [
    { key: 'id', name: 'ID', width: 80 },
    {
      key: 'content',
      name: 'Content',
      width: 200,
      renderCell: ({ row }) => <div style={{ whiteSpace: 'pre' }}>{row.content}</div>
    }
  ];
  // Multi-line content makes each auto-sized row tall, and the fixed grid height
  // forces a scrollable viewport so paging moves through several rows at a time.
  // This exercises the string-height getRowTop/getRowHeight/findRowIdx DOM paths,
  // which measure the rendered cells rather than computing offsets from a number.
  const rows = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    content: `row ${i}\nline two\nline three`
  }));

  await setup({ columns, rows, rowHeight: 'auto', style: { blockSize: 300 } });

  // tab into the grid (lands on the header row) then move onto the first data row
  await safeTab();
  await userEvent.keyboard('{arrowdown}');
  expect(getActiveDataRowIdx()).toBe(0);

  // PageDown moves the active cell forward through the measured rows
  await userEvent.keyboard('{PageDown}');
  const afterPageDown = getActiveDataRowIdx();
  expect(afterPageDown).toBeGreaterThan(0);

  // PageUp moves it back up
  await userEvent.keyboard('{PageUp}');
  const afterPageUp = getActiveDataRowIdx();
  expect(afterPageUp).toBeLessThan(afterPageDown);

  // and PageDown again moves forward from there
  await userEvent.keyboard('{PageDown}');
  expect(getActiveDataRowIdx()).toBeGreaterThan(afterPageUp);

  // Ctrl+End reaches the last row with string heights
  await userEvent.keyboard('{Control>}{end}{/Control}');
  expect(getActiveDataRowIdx()).toBe(rows.length - 1);
});
