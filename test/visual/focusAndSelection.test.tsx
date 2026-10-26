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

const modes = [
  { mode: 'light', className: 'rdg-light', forcedColors: false },
  { mode: 'dark', className: 'rdg-dark', forcedColors: false },
  // WebKit matches `(forced-colors: active)` when emulated, but does not force any colors
  { mode: 'forced-colors', className: 'rdg-light', forcedColors: true }
] as const;

describe.each(modes)('$mode', ({ mode, className, forcedColors }) => {
  beforeEach(async ({ skip, onTestFinished }) => {
    if (forcedColors) {
      skip(server.browser === 'webkit');
      await commands.emulateMedia({ forcedColors: 'active' });
      onTestFinished(async () => {
        await commands.emulateMedia({ forcedColors: null });
      });
    }

    await page.render(
      <DataGrid
        aria-label="Focus and selection"
        className={className}
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

  it('active cell on a selected row', async () => {
    await userEvent.keyboard('{ArrowDown}{ArrowRight}');
    await expect.element(grid).toMatchScreenshot(`${mode}-active-cell-selected-row`);
  });

  it('active cell on an unselected row', async () => {
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowRight}');
    await expect.element(grid).toMatchScreenshot(`${mode}-active-cell-unselected-row`);
  });

  it('focused checkbox on a selected row', async () => {
    await userEvent.keyboard('{ArrowDown}');
    await expect.element(grid).toMatchScreenshot(`${mode}-focused-checkbox-selected-row`);
  });

  it('focused checkbox on an unselected row', async () => {
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    await expect.element(grid).toMatchScreenshot(`${mode}-focused-checkbox-unselected-row`);
  });
});
