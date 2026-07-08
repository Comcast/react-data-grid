import { page, userEvent } from 'vitest/browser';

import type { Column } from '../../../src';
import {
  cellClassname,
  cellFrozenStartClassname,
  cellFrozenEndClassname
} from '../../../src/style/cell';
import { getCellsAtRowIndex, safeTab, setup } from '../utils';

const headerCells = page.getHeaderCell();
const dragHandle = page.getDragHandle();

test('end-frozen columns have a specific class and are stable-sorted at the tail', async () => {
  const columns: readonly Column<never>[] = [
    {
      key: 'col1',
      name: 'col1',
      frozen: 'start'
    },
    {
      key: 'col2',
      name: 'col2'
    },
    {
      key: 'col3',
      name: 'col3',
      frozen: 'end'
    },
    {
      key: 'col4',
      name: 'col4'
    },
    {
      key: 'col5',
      name: 'col5',
      frozen: 'end'
    }
  ];

  await setup({ columns, rows: [] });

  // Expected DOM order: col1 (start), col2, col4 (unfrozen), col3 (end), col5 (end)
  const [cell1, cell2, cell3, cell4, cell5] = headerCells.all();

  await expect.element(cell1).toHaveTextContent('col1');
  await expect.element(cell2).toHaveTextContent('col2');
  await expect.element(cell3).toHaveTextContent('col4');
  await expect.element(cell4).toHaveTextContent('col3');
  await expect.element(cell5).toHaveTextContent('col5');

  await expect.element(cell1).toHaveClass(cellClassname, cellFrozenStartClassname, { exact: true });
  await expect.element(cell2).toHaveClass(cellClassname, { exact: true });
  await expect.element(cell3).toHaveClass(cellClassname, { exact: true });
  await expect.element(cell4).toHaveClass(cellClassname, cellFrozenEndClassname, { exact: true });
  await expect.element(cell5).toHaveClass(cellClassname, cellFrozenEndClassname, { exact: true });
});

test('frozen: true is normalized to start-frozen (backwards compat)', async () => {
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
      frozen: 'end'
    }
  ];

  await setup({ columns, rows: [] });

  const [cell1, cell2, cell3] = headerCells.all();

  await expect.element(cell1).toHaveTextContent('col1');
  await expect.element(cell2).toHaveTextContent('col2');
  await expect.element(cell3).toHaveTextContent('col3');

  await expect.element(cell1).toHaveClass(cellClassname, cellFrozenStartClassname, { exact: true });
  await expect.element(cell2).toHaveClass(cellClassname, { exact: true });
  await expect.element(cell3).toHaveClass(cellClassname, cellFrozenEndClassname, { exact: true });
});

test('end-frozen columns stay pinned to the inline-end edge when scrolling', async () => {
  const columns: readonly Column<never>[] = [
    {
      key: 'col1',
      name: 'col1',
      width: 2000
    },
    {
      key: 'col2',
      name: 'col2',
      frozen: 'end',
      width: 80
    },
    {
      key: 'col3',
      name: 'col3',
      frozen: 'end',
      width: 60
    }
  ];

  await setup({ columns, rows: [] });

  const grid = page.getGrid().element();

  function assertPinnedToEndEdge() {
    const gridRect = grid.getBoundingClientRect();
    const gridBorderWidth = parseFloat(getComputedStyle(grid).borderInlineEndWidth);
    // resolve the cells fresh each call — scrolling re-renders the row and
    // detaches any previously cached element references
    const rect2 = headerCells.nth(1).element().getBoundingClientRect();
    const rect3 = headerCells.nth(2).element().getBoundingClientRect();

    // last end-frozen column is flush with the grid's inline-end edge
    expect(rect3.right).toBeCloseTo(gridRect.right - gridBorderWidth, 0);
    // end-frozen columns stack: col2 sits directly before col3
    expect(rect2.right).toBeCloseTo(rect3.left, 0);
  }

  assertPinnedToEndEdge();

  // end-frozen columns must not move when the grid is scrolled horizontally
  grid.scrollLeft = 500;
  await new Promise(requestAnimationFrame);
  assertPinnedToEndEdge();
});

test('end-frozen cells in top summary rows carry the end-frozen class', async () => {
  interface SummaryRow {
    label: string;
  }

  const columns: readonly Column<never, SummaryRow>[] = [
    {
      key: 'col1',
      name: 'col1'
    },
    {
      key: 'col2',
      name: 'col2',
      frozen: 'end',
      renderSummaryCell({ row }) {
        return row.label;
      }
    }
  ];

  await setup({
    columns,
    rows: [],
    topSummaryRows: [{ label: 'total' }]
  });

  // the summary cell in the end-frozen column must carry the end-frozen class
  const summaryCell = page.getCell({ name: 'total' });
  await expect.element(summaryCell).toHaveClass(cellClassname, cellFrozenEndClassname, {
    exact: true
  });
});

test('end-frozen cells in bottom summary rows carry the end-frozen class', async () => {
  interface SummaryRow {
    label: string;
  }

  const columns: readonly Column<never, SummaryRow>[] = [
    {
      key: 'col1',
      name: 'col1'
    },
    {
      key: 'col2',
      name: 'col2',
      frozen: 'end',
      renderSummaryCell({ row }) {
        return row.label;
      }
    }
  ];

  await setup({
    columns,
    rows: [],
    bottomSummaryRows: [{ label: 'bottom-total' }]
  });

  const summaryCell = page.getCell({ name: 'bottom-total' });
  await expect.element(summaryCell).toHaveClass(cellClassname, cellFrozenEndClassname, {
    exact: true
  });
});

test('reordering input columns past end-frozen preserves band integrity', async () => {
  // User provides columns in an arbitrary order (e.g. end-frozen in the middle);
  // the grid must still sort end-frozen columns to the tail.
  const columns: readonly Column<never>[] = [
    { key: 'end1', name: 'end1', frozen: 'end' },
    { key: 'mid', name: 'mid' },
    { key: 'start1', name: 'start1', frozen: 'start' }
  ];

  await setup({ columns, rows: [] });

  const [cell1, cell2, cell3] = headerCells.all();
  await expect.element(cell1).toHaveTextContent('start1');
  await expect.element(cell2).toHaveTextContent('mid');
  await expect.element(cell3).toHaveTextContent('end1');
});

test('keyboard navigation reaches end-frozen columns', async () => {
  const columns: readonly Column<unknown>[] = [
    { key: 's', name: 's', frozen: 'start' },
    { key: 'u', name: 'u' },
    { key: 'e', name: 'e', frozen: 'end' }
  ];
  const rows: readonly unknown[] = Array.from({ length: 1 });

  await setup({ columns, rows });

  await safeTab();
  // Ctrl+End jumps to the last cell; the end-frozen column sits at aria-colindex=3
  await userEvent.keyboard('{Control>}{End}{/Control}');
  await expect.element(page.getActiveCell()).toHaveAttribute('aria-colindex', '3');
});

test('colSpan from an unfrozen column into the end-frozen band is dropped', async () => {
  const columns: readonly Column<number>[] = [
    { key: 'a', name: 'a' },
    {
      key: 'b',
      name: 'b',
      colSpan(args) {
        // b is unfrozen — span 2 would cross into end-frozen column c
        if (args.type === 'ROW') return 2;
        return undefined;
      }
    },
    { key: 'c', name: 'c', frozen: 'end' }
  ];

  await setup({ columns, rows: [1] });

  // colSpan is ignored (boundary crossed) → all three cells render independently
  await expect.element(getCellsAtRowIndex(0)).toHaveLength(3);
});

test('colSpan contained within the end-frozen band is respected', async () => {
  const columns: readonly Column<number>[] = [
    { key: 'a', name: 'a' },
    {
      key: 'e1',
      name: 'e1',
      frozen: 'end',
      colSpan(args) {
        // e1 and e2 are both end-frozen — span stays within the tail band
        if (args.type === 'ROW') return 2;
        return undefined;
      }
    },
    { key: 'e2', name: 'e2', frozen: 'end' }
  ];

  await setup({ columns, rows: [1] });

  // colSpan=2 absorbs e2 → only 2 cells render in the body row (a + e1-spanning)
  await expect.element(getCellsAtRowIndex(0)).toHaveLength(2);
});

test('an end-frozen cell that spans the tail stays pinned to the inline-end edge', async () => {
  // A wide unfrozen column forces horizontal overflow so the end-frozen band is
  // sticky-pinned; the spanning cell must anchor by its RIGHT edge (last spanned
  // column), not its first — regression guard for the colSpan inset-inline-end offset.
  const columns: readonly Column<number>[] = [
    { key: 'pad', name: 'pad', width: 2000 },
    {
      key: 'e1',
      name: 'e1',
      frozen: 'end',
      width: 80,
      colSpan(args) {
        if (args.type === 'ROW') return 2;
        return undefined;
      }
    },
    { key: 'e2', name: 'e2', frozen: 'end', width: 60 }
  ];

  await setup({ columns, rows: [1] });

  const grid = page.getGrid().element();
  const gridBorderWidth = parseFloat(getComputedStyle(grid).borderInlineEndWidth);

  function assertFlushWithEndEdge() {
    // resolve the spanning cell fresh each call — scrolling re-renders the row
    const spanningCellRect = getCellsAtRowIndex(0).nth(1).element().getBoundingClientRect();
    expect(spanningCellRect.right).toBeCloseTo(
      grid.getBoundingClientRect().right - gridBorderWidth,
      0
    );
  }

  assertFlushWithEndEdge();

  grid.scrollLeft = 500;
  await new Promise(requestAnimationFrame);
  assertFlushWithEndEdge();
});

test('drag handle on an editable end-frozen column is anchored via inset-inline-end', async () => {
  interface Row {
    col: string;
  }

  const columns: readonly Column<Row>[] = [
    { key: 'pad', name: 'pad', width: 2000 },
    {
      key: 'col',
      name: 'col',
      frozen: 'end',
      editable: true,
      renderEditCell: () => null
    }
  ];

  await setup({
    columns,
    rows: [{ col: 'a1' }, { col: 'a2' }] satisfies Row[],
    onFill({ targetRow, sourceRow, columnKey }) {
      return { ...targetRow, [columnKey]: sourceRow[columnKey as keyof Row] };
    },
    onRowsChange() {}
  });

  // click the end-frozen cell in row 0 to activate it; drag handle should render
  await userEvent.click(getCellsAtRowIndex(0).nth(1));
  await expect.element(dragHandle).toBeInTheDocument();

  // drag handle must use inset-inline-end so it stays anchored to the end-frozen cell on scroll
  const computed = getComputedStyle(dragHandle.element());
  expect(computed.position).toBe('sticky');
  expect(computed.insetInlineEnd).not.toBe('auto');
});

test('no unfrozen columns — one start + one end', async () => {
  const columns: readonly Column<never>[] = [
    {
      key: 'a',
      name: 'a',
      frozen: 'start'
    },
    {
      key: 'b',
      name: 'b',
      frozen: 'end'
    }
  ];

  await setup({ columns, rows: [] });

  const [cellA, cellB] = headerCells.all();

  await expect.element(cellA).toHaveTextContent('a');
  await expect.element(cellB).toHaveTextContent('b');
  await expect.element(cellA).toHaveClass(cellClassname, cellFrozenStartClassname, { exact: true });
  await expect.element(cellB).toHaveClass(cellClassname, cellFrozenEndClassname, { exact: true });
});

test('selection outline paints on edge-frozen cells when row is active', async () => {
  interface R {
    id: number;
    name: string;
    trailing: string;
  }
  const columns: readonly Column<R>[] = [
    { key: 'id', name: 'ID', frozen: 'start', width: 60 },
    { key: 'name', name: 'Name', width: 100 },
    { key: 'trailing', name: 'Trail', frozen: 'end', width: 80 }
  ];
  const rows: readonly R[] = [{ id: 1, name: 'one', trailing: 't1' }];

  await setup({ columns, rows });

  // Trigger the `&[tabindex='0']` rule by setting the attribute directly
  const firstRow = page.getRow().nth(0).element() as HTMLElement;
  firstRow.setAttribute('tabindex', '0');

  const cells = firstRow.children;
  const startCell = cells[0] as HTMLElement;
  const endCell = cells[cells.length - 1] as HTMLElement;

  const beforeStyle = getComputedStyle(startCell, '::before');
  const afterStyle = getComputedStyle(endCell, '::after');

  // Shared block (combined selector): both pseudo-elements get the same base properties.
  expect(beforeStyle.content).toBe('""');
  expect(beforeStyle.position).toBe('absolute');
  expect(afterStyle.content).toBe('""');
  expect(afterStyle.position).toBe('absolute');

  // Direction-specific (split selectors): start gets inline-start border, end gets inline-end.
  expect(beforeStyle.borderInlineStartWidth).not.toBe('0px');
  expect(afterStyle.borderInlineEndWidth).not.toBe('0px');
});
