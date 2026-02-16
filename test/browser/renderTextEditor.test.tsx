import { useState } from 'react';
import { page, userEvent } from 'vitest/browser';
import { DataGrid, renderTextEditor } from '../../src';
import type { Column } from '../../src';

interface Row {
  readonly name: string;
}

const columns: readonly Column<Row>[] = [
  {
    key: 'name',
    name: 'Name',
    renderEditCell: renderTextEditor,
    editorOptions: {
      commitOnOutsideClick: false
    }
  }
];
const initialRows: readonly Row[] = [{ name: 'Tacitus Kilgore' }];

function Test() {
  const [rows, setRows] = useState(initialRows);

  return <DataGrid columns={columns} rows={rows} onRowsChange={setRows} />;
}

test('renderTextEditor', async () => {
  await page.render(<Test />);
  const cell = page.getByRole('gridcell');
  await expect.element(cell).toHaveTextContent(/^Tacitus Kilgore$/);
  await userEvent.dblClick(cell);
  const input = page.getByRole('textbox');
  await expect.element(input).toHaveClass('rdg-text-editor');
  // input value is row[column.key]
  await expect.element(input).toHaveValue(initialRows[0].name);
  // input is focused
  await expect.element(input).toHaveFocus();
  // input value is fully selected
  await expect.element(input).toHaveSelection(initialRows[0].name);

  // pressing escape closes the editor without committing
  await userEvent.keyboard('Test{escape}');
  await expect.element(input).not.toBeInTheDocument();
  await expect.element(cell).toHaveTextContent(/^Tacitus Kilgore$/);

  // blurring the input closes and commits the editor
  await userEvent.dblClick(cell);
  await userEvent.fill(input, 'Jim Milton');
  await userEvent.tab();
  await expect.element(input).not.toBeInTheDocument();
  await expect.element(cell).toHaveTextContent(/^Jim Milton$/);
});
