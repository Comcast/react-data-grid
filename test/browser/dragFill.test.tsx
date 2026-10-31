import { useState } from 'react';
import { commands, page, userEvent, type Locator } from 'vite-plus/test/browser';

import { DataGrid } from '../../src';
import type { Column, FillEvent } from '../../src';

const grid = page.getGrid();
const dragHandle = page.getDragHandle();
const cell0 = page.getRow().nth(0).getCell({ index: 0 });
const cell1 = page.getRow().nth(1).getCell({ index: 0 });
const cell2 = page.getRow().nth(2).getCell({ index: 0 });
const cell3 = page.getRow().nth(3).getCell({ index: 0 });

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
  await userEvent.click(cell0);
  await expect.element(dragHandle).not.toBeInTheDocument();
});

test('should allow dragFill if onFill is specified', async () => {
  await setup();
  await userEvent.click(cell0);
  await expect.element(cell0).toHaveFocus();
  await userEvent.dblClick(dragHandle);
  await expect.element(cell0).toHaveFocus();
  await expect.element(cell1).toHaveTextContent('a1');
  await expect.element(cell2).toHaveTextContent('a1');
  await expect.element(cell3).toHaveTextContent('a4'); // read-only cell
});

test('should update single row using mouse', async () => {
  await setup();
  await commands.dragFill('a1', 'a2');
  await expect.element(cell1).toHaveTextContent('a1');
  await expect.element(cell2).toHaveTextContent('a3');
  await expect.element(cell0).toHaveFocus();
});

test('should update multiple rows using mouse', async () => {
  await setup();
  await commands.dragFill('a1', 'a4');
  await expect.element(cell1).toHaveTextContent('a1');
  await expect.element(cell2).toHaveTextContent('a1');
  await expect.element(cell3).toHaveTextContent('a4'); // read-only cell
});

test('should allow drag up using mouse', async () => {
  await setup();
  await commands.dragFill('a4', 'a1');
  await expect.element(cell0).toHaveTextContent('a4');
  await expect.element(cell1).toHaveTextContent('a4');
  await expect.element(cell2).toHaveTextContent('a4');
});

test('should focus the cell when drag handle is clicked', async () => {
  await setup();

  await userEvent.click(cell0);
  await expect.element(cell0).toHaveFocus();

  cell0.blur();
  await expect.element(cell0).not.toHaveFocus();

  await userEvent.click(dragHandle);
  await expect.element(cell0).toHaveFocus();
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
  await userEvent.click(cell0);
  await expect.element(cell0).toHaveAttribute('aria-colspan', '2');
  await expect.element(dragHandle).toBeInTheDocument();
  expectDragHandleAtTheEndOf(cell0);
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
  await userEvent.click(cell0);
  await expect.element(dragHandle).toBeInTheDocument();
  expectDragHandleAtTheEndOf(cell0);

  // the cell stays in place when scrolling, and so must the drag handle
  grid.scroll({ left: 150 });
  await new Promise(requestAnimationFrame);
  expectDragHandleAtTheEndOf(cell0);
});

function expectDragHandleAtTheEndOf(cell: Locator) {
  const cellRect = cell.element().getBoundingClientRect();
  const dragHandleRect = dragHandle.element().getBoundingClientRect();
  expect(dragHandleRect.left).toBeLessThan(cellRect.right);
  expect(dragHandleRect.right).toBeGreaterThan(cellRect.right);
}
