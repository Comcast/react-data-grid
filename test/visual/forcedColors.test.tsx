import { commands, page, server, userEvent } from 'vite-plus/test/browser';

import { DataGrid, renderTextEditor, SelectColumn, type Column } from '../../src';
import { safeTab } from '../browser/utils';

const grid = page.getGrid();

interface Row {
  id: number;
  name: string;
}

const columns: readonly Column<Row>[] = [
  SelectColumn,
  {
    key: 'name',
    name: 'Name',
    renderEditCell: renderTextEditor
  }
];

const rows: readonly Row[] = [
  { id: 1, name: 'Row 1' },
  { id: 2, name: 'Row 2' },
  { id: 3, name: 'Row 3' }
];

const selectedRows: ReadonlySet<number> = new Set([1, 2]);

function rowKeyGetter(row: Row) {
  return row.id;
}

beforeEach(async ({ skip, onTestFinished }) => {
  // WebKit matches `(forced-colors: active)` when emulated, but does not force any colors
  skip(server.browser === 'webkit');

  await commands.emulateMedia({ forcedColors: 'active' });
  onTestFinished(async () => {
    await commands.emulateMedia({ forcedColors: null });
  });

  await page.render(
    <DataGrid
      aria-label="Forced colors"
      rowKeyGetter={rowKeyGetter}
      columns={columns}
      rows={rows}
      selectedRows={selectedRows}
      onSelectedRowsChange={() => {}}
      onRowsChange={() => {}}
      onFill={({ targetRow }) => targetRow}
      style={{ blockSize: 160, inlineSize: 400 }}
    />
  );

  // focus the "Select All" header cell with the keyboard, so `:focus-visible` matches
  await safeTab();
});

test('active cell on a selected row', async () => {
  await userEvent.keyboard('{ArrowDown}{ArrowRight}');
  await expect.element(grid).toMatchScreenshot('forced-colors-active-cell-selected-row');
});

test('active cell on an unselected row', async () => {
  await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowRight}');
  await expect.element(grid).toMatchScreenshot('forced-colors-active-cell-unselected-row');
});

test('focused checkbox on a selected row', async () => {
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(grid).toMatchScreenshot('forced-colors-focused-checkbox-selected-row');
});

test('focused checkbox on an unselected row', async () => {
  await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
  await expect.element(grid).toMatchScreenshot('forced-colors-focused-checkbox-unselected-row');
});
