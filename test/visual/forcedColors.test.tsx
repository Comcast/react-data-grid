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

// Windows contrast themes are light or dark, so test both palettes
const palettes = [
  { colorScheme: 'light', prefix: 'forced-colors' },
  { colorScheme: 'dark', prefix: 'forced-colors-dark' }
] as const;

describe.each(palettes)('$colorScheme palette', ({ colorScheme, prefix }) => {
  beforeEach(async ({ skip, onTestFinished }) => {
    // WebKit matches `(forced-colors: active)` when emulated, but does not force any colors,
    // and Firefox ignores the emulated color scheme in forced colors mode
    skip(server.browser === 'webkit' || (server.browser === 'firefox' && colorScheme === 'dark'));

    await commands.emulateMedia({ forcedColors: 'active', colorScheme });
    onTestFinished(async () => {
      // restore the context defaults, as `null` would make the page follow the OS instead
      await commands.emulateMedia({ forcedColors: 'none', colorScheme: 'light' });
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

  it('active cell on a selected row', async () => {
    await userEvent.keyboard('{ArrowDown}{ArrowRight}');
    await expect.element(grid).toMatchScreenshot(`${prefix}-active-cell-selected-row`);
  });

  it('active cell on an unselected row', async () => {
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowRight}');
    await expect.element(grid).toMatchScreenshot(`${prefix}-active-cell-unselected-row`);
  });

  it('editor on a selected row', async () => {
    await userEvent.keyboard('{ArrowDown}{ArrowRight}{Enter}');
    await expect.element(page.getByRole('textbox')).toHaveFocus();
    await expect.element(grid).toMatchScreenshot(`${prefix}-editor-selected-row`);
  });

  it('focused checkbox on a selected row', async () => {
    await userEvent.keyboard('{ArrowDown}');
    await expect.element(grid).toMatchScreenshot(`${prefix}-focused-checkbox-selected-row`);
  });

  it('focused checkbox on an unselected row', async () => {
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    await expect.element(grid).toMatchScreenshot(`${prefix}-focused-checkbox-unselected-row`);
  });
});
