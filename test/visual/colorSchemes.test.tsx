import { commands, page, server, userEvent } from 'vite-plus/test/browser';

import { DataGrid, renderTextEditor, SelectColumn, type Column } from '../../src';
import { getRowKey } from '../browser/utils';

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

// Windows contrast themes are light or dark too, so test both palettes in forced colors mode
const modes = [
  { colorScheme: 'light', forcedColors: 'none', prefix: 'light' },
  { colorScheme: 'dark', forcedColors: 'none', prefix: 'dark' },
  { colorScheme: 'light', forcedColors: 'active', prefix: 'forced-colors' },
  { colorScheme: 'dark', forcedColors: 'active', prefix: 'forced-colors-dark' }
] as const;

describe.each(modes)('$prefix', ({ colorScheme, forcedColors, prefix }) => {
  beforeEach(async ({ skip, onTestFinished }) => {
    // WebKit matches `(forced-colors: active)` when emulated, but does not force any colors,
    // and Firefox ignores the emulated color scheme in forced colors mode
    skip(
      forcedColors === 'active' &&
        (server.browser === 'webkit' || (server.browser === 'firefox' && colorScheme === 'dark'))
    );

    await commands.emulateMedia({ forcedColors, colorScheme });
    onTestFinished(async () => {
      // restore the context defaults, as `null` would make the page follow the OS instead
      await commands.emulateMedia({ forcedColors: 'none', colorScheme: 'light' });
    });

    await page.render(
      <DataGrid
        aria-label="Color schemes"
        getRowKey={getRowKey}
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
    await userEvent.tab();
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
