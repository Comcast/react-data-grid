import { useState } from 'react';
import { page, userEvent } from 'vitest/browser';

import { DataGrid } from '../../src';
import type { CellPasteArgs, Column } from '../../src';
import { getCellsAtRowIndex } from './utils';

interface Row {
  col: string;
}

const columns: readonly Column<Row, Row>[] = [
  {
    key: 'col',
    name: 'Col',
    editable: (row) => row.col !== 'a3',
    renderEditCell() {
      return <input autoFocus />;
    },
    renderSummaryCell({ row }) {
      return row.col;
    }
  }
];

const initialRows: readonly Row[] = [
  {
    col: 'a1'
  },
  {
    col: 'a2'
  },
  {
    col: 'a3'
  }
];

const bottomSummaryRows: readonly Row[] = [
  {
    col: 's1'
  }
];

const onCellCopySpy = vi.fn();
const onCellPasteSpy = vi.fn(({ column, row }: CellPasteArgs<Row, Row>) => {
  const columnKey = column.key;
  return { ...row, [columnKey]: row[columnKey as keyof Row] };
});

function CopyPasteTest() {
  const [rows, setRows] = useState(initialRows);

  return (
    <DataGrid
      columns={columns}
      rows={rows}
      bottomSummaryRows={bottomSummaryRows}
      onRowsChange={setRows}
      onCellCopy={onCellCopySpy}
      onCellPaste={onCellPasteSpy}
    />
  );
}

function setup() {
  onCellCopySpy.mockClear();
  onCellPasteSpy.mockClear();
  return page.render(<CopyPasteTest />);
}

test('should call onCellCopy on cell copy', async () => {
  await setup();
  await userEvent.click(getCellsAtRowIndex(0).nth(0));
  await userEvent.copy();
  expect(onCellCopySpy).toHaveBeenCalledExactlyOnceWith(
    {
      row: initialRows[0],
      column: expect.objectContaining(columns[0])
    },
    expect.anything()
  );
});

test('should call onCellPaste on cell paste', async () => {
  await setup();
  await userEvent.click(getCellsAtRowIndex(0).nth(0));
  await userEvent.paste();
  expect(onCellPasteSpy).toHaveBeenCalledExactlyOnceWith(
    {
      row: initialRows[0],
      column: expect.objectContaining(columns[0])
    },
    expect.anything()
  );
});

test('should not allow paste on readonly cells', async () => {
  await setup();
  await userEvent.click(getCellsAtRowIndex(2).nth(0));
  await userEvent.paste();
  expect(onCellPasteSpy).not.toHaveBeenCalled();
});

test('should allow copying a readonly cell', async () => {
  await setup();
  await userEvent.click(getCellsAtRowIndex(2).nth(0));
  await userEvent.copy();
  expect(onCellCopySpy).toHaveBeenCalledExactlyOnceWith(
    {
      row: initialRows[2],
      column: expect.objectContaining(columns[0])
    },
    expect.anything()
  );
});

test('should not allow copy/paste on header or summary cells', async () => {
  await setup();
  await userEvent.tab();
  await userEvent.copy();
  expect(onCellCopySpy).not.toHaveBeenCalled();
  await userEvent.paste();
  expect(onCellPasteSpy).not.toHaveBeenCalled();

  await userEvent.keyboard('{Control>}{end}');
  await userEvent.copy();
  expect(onCellCopySpy).not.toHaveBeenCalled();
  await userEvent.paste();
  expect(onCellPasteSpy).not.toHaveBeenCalled();
});

test('should not start editing when pressing ctrl+<input key>', async () => {
  await setup();
  await userEvent.click(getCellsAtRowIndex(1).nth(0));
  await userEvent.keyboard('{Control>}b');
  await expect.element(page.getActiveCell()).not.toHaveClass('rdg-editor-container');
});
