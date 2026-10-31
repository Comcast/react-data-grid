import { useState } from 'react';
import { commands, page, userEvent, type Locator } from 'vite-plus/test/browser';

import { DataGrid } from '../../src';
import type { Column, FillEvent } from '../../src';
import { getCellsAtRowIndex, scrollGrid } from './utils';

const dragHandle = page.getDragHandle();

interface Row {
  col: string;
}

const columns: readonly Column<Row>[] = [
  {
    key: 'col',
    name: 'Col',
    editable: (row) => row.col !== 'a4',
    renderEditCell() {
      return null;
    }
  }
];

const initialRows: readonly Row[] = [{ col: 'a1' }, { col: 'a2' }, { col: 'a3' }, { col: 'a4' }];

function setup(allowDragFill = true) {
  return page.render(<DragFillTest allowDragFill={allowDragFill} />);
}

function DragFillTest({ allowDragFill = true }: { allowDragFill?: boolean }) {
  const [rows, setRows] = useState(initialRows);

  function onFill({ columnKey, sourceRow, targetRow }: FillEvent<Row>): Row {
    return { ...targetRow, [columnKey]: sourceRow[columnKey as keyof Row] };
  }

  return (
    <DataGrid
      columns={columns}
      rows={rows}
      onRowsChange={setRows}
      onFill={allowDragFill ? onFill : undefined}
    />
  );
}

test('should not allow dragFill if onFill is undefined', async () => {
  await setup(false);
  await userEvent.click(getCellsAtRowIndex(0).nth(0));
  await expect.element(dragHandle).not.toBeInTheDocument();
});

test('should allow dragFill if onFill is specified', async () => {
  await setup();
  await userEvent.click(getCellsAtRowIndex(0).nth(0));
  await expect.element(getCellsAtRowIndex(0).nth(0)).toHaveFocus();
  await userEvent.dblClick(dragHandle);
  await expect.element(getCellsAtRowIndex(0).nth(0)).toHaveFocus();
  await expect.element(getCellsAtRowIndex(1).nth(0)).toHaveTextContent('a1');
  await expect.element(getCellsAtRowIndex(2).nth(0)).toHaveTextContent('a1');
  await expect.element(getCellsAtRowIndex(3).nth(0)).toHaveTextContent('a4'); // read-only cell
});

test('should update single row using mouse', async () => {
  await setup();
  await commands.dragFill('a1', 'a2');
  await expect.element(getCellsAtRowIndex(1).nth(0)).toHaveTextContent('a1');
  await expect.element(getCellsAtRowIndex(2).nth(0)).toHaveTextContent('a3');
  await expect.element(getCellsAtRowIndex(0).nth(0)).toHaveFocus();
});

test('should update multiple rows using mouse', async () => {
  await setup();
  await commands.dragFill('a1', 'a4');
  await expect.element(getCellsAtRowIndex(1).nth(0)).toHaveTextContent('a1');
  await expect.element(getCellsAtRowIndex(2).nth(0)).toHaveTextContent('a1');
  await expect.element(getCellsAtRowIndex(3).nth(0)).toHaveTextContent('a4'); // read-only cell
});

test('should allow drag up using mouse', async () => {
  await setup();
  await commands.dragFill('a4', 'a1');
  await expect.element(getCellsAtRowIndex(0).nth(0)).toHaveTextContent('a4');
  await expect.element(getCellsAtRowIndex(1).nth(0)).toHaveTextContent('a4');
  await expect.element(getCellsAtRowIndex(2).nth(0)).toHaveTextContent('a4');
});

test('should focus the cell when drag handle is clicked', async () => {
  await setup();
  const cell = getCellsAtRowIndex(0).nth(0);

  await userEvent.click(cell);
  await expect.element(cell).toHaveFocus();

  cell.element().blur();
  await expect.element(cell).not.toHaveFocus();

  await userEvent.click(dragHandle);
  await expect.element(cell).toHaveFocus();
});

test('should place the drag handle at the end of the cell when its colSpan is clamped', async () => {
  const columns: readonly Column<Row>[] = [
    {
      key: 'col',
      name: 'Col',
      // the span is clamped to the unfrozen columns
      colSpan: () => 3,
      renderEditCell() {
        return null;
      }
    },
    { key: 'unfrozen', name: 'Unfrozen' },
    { key: 'frozen', name: 'Frozen', frozen: 'end' }
  ];

  await page.render(
    <DataGrid columns={columns} rows={initialRows} onFill={({ targetRow }) => targetRow} />
  );
  const cell = getCellsAtRowIndex(0).nth(0);
  await userEvent.click(cell);
  await expect.element(cell).toHaveAttribute('aria-colspan', '2');
  await expect.element(dragHandle).toBeInTheDocument();
  expectDragHandleAtTheEndOf(cell);
});

test('should keep the drag handle at the end of a start-frozen cell that spans columns', async () => {
  const columns: readonly Column<Row>[] = [
    {
      key: 'col',
      name: 'Col',
      frozen: true,
      width: 100,
      colSpan: (args) => (args.type === 'ROW' ? 2 : undefined),
      renderEditCell() {
        return null;
      }
    },
    { key: 'frozen', name: 'Frozen', frozen: true, width: 100 },
    ...Array.from({ length: 30 }, (_, i) => ({ key: `col${i}`, name: `Col ${i}`, width: 100 }))
  ];

  await page.render(
    <DataGrid columns={columns} rows={initialRows} onFill={({ targetRow }) => targetRow} />
  );
  const cell = getCellsAtRowIndex(0).nth(0);
  await userEvent.click(cell);
  await expect.element(dragHandle).toBeInTheDocument();
  expectDragHandleAtTheEndOf(cell);

  // the cell stays in place when scrolling, and so must the drag handle
  scrollGrid({ left: 150 });
  await new Promise(requestAnimationFrame);
  expectDragHandleAtTheEndOf(cell);
});

function expectDragHandleAtTheEndOf(cell: Locator) {
  const cellRect = cell.element().getBoundingClientRect();
  const dragHandleRect = dragHandle.element().getBoundingClientRect();
  expect(dragHandleRect.left).toBeLessThan(cellRect.right);
  expect(dragHandleRect.right).toBeGreaterThan(cellRect.right);
}
