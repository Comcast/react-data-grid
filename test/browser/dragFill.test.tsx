import { useState } from 'react';
import { commands, page, userEvent } from 'vitest/browser';
import { DataGrid } from '../../src';
import type { Column, FillEvent } from '../../src';
import { getCellsAtRowIndex } from './utils';

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

function getDragHandle() {
  return document.querySelector('.rdg-cell-drag-handle');
}

test('should not allow dragFill if onFill is undefined', async () => {
  await setup(false);
  await userEvent.click(getCellsAtRowIndex(0)[0]);
  expect(getDragHandle()).not.toBeInTheDocument();
});

test('should allow dragFill if onFill is specified', async () => {
  await setup();
  await userEvent.click(getCellsAtRowIndex(0)[0]);
  await expect.element(getCellsAtRowIndex(0)[0]).toHaveFocus();
  await userEvent.dblClick(getDragHandle()!);
  await expect.element(getCellsAtRowIndex(0)[0]).toHaveFocus();
  await expect.element(getCellsAtRowIndex(1)[0]).toHaveTextContent('a1');
  await expect.element(getCellsAtRowIndex(2)[0]).toHaveTextContent('a1');
  await expect.element(getCellsAtRowIndex(3)[0]).toHaveTextContent('a4'); // readonly cell
});

test('should update single row using mouse', async () => {
  await setup();
  await commands.dragFill('a1', 'a2');
  await expect.element(getCellsAtRowIndex(1)[0]).toHaveTextContent('a1');
  await expect.element(getCellsAtRowIndex(2)[0]).toHaveTextContent('a3');
  await expect.element(getCellsAtRowIndex(0)[0]).toHaveFocus();
});

test('should update multiple rows using mouse', async () => {
  await setup();
  await commands.dragFill('a1', 'a4');
  await expect.element(getCellsAtRowIndex(1)[0]).toHaveTextContent('a1');
  await expect.element(getCellsAtRowIndex(2)[0]).toHaveTextContent('a1');
  await expect.element(getCellsAtRowIndex(3)[0]).toHaveTextContent('a4'); // readonly cell
});

test('should allow drag up using mouse', async () => {
  await setup();
  await commands.dragFill('a4', 'a1');
  await expect.element(getCellsAtRowIndex(0)[0]).toHaveTextContent('a4');
  await expect.element(getCellsAtRowIndex(1)[0]).toHaveTextContent('a4');
  await expect.element(getCellsAtRowIndex(2)[0]).toHaveTextContent('a4');
});

test('should focus the cell when drag handle is clicked', async () => {
  await setup();
  await userEvent.click(getCellsAtRowIndex(0)[0]);
  await userEvent.click(document.body);
  await expect.element(document.body).toHaveFocus();
  await userEvent.click(getDragHandle()!);
  await expect.element(getCellsAtRowIndex(0)[0]).toHaveFocus();
});
