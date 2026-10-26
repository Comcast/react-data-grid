import { commands, page, userEvent } from 'vite-plus/test/browser';

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

function getComputedColor(property: 'color' | 'backgroundColor', value: string) {
  const element = document.createElement('div');
  element.style[property] = value;
  document.body.append(element);
  const computedValue = getComputedStyle(element)[property];
  element.remove();
  return computedValue;
}

// WebKit matches `(forced-colors: active)` when emulated, but may not force any colors
function areColorsForced() {
  return getComputedColor('backgroundColor', 'rgb(1, 2, 3)') !== 'rgb(1, 2, 3)';
}

// Firefox ignores the emulated color scheme in forced colors mode
function isCanvasDark() {
  const [red, green, blue] = getComputedColor('color', 'Canvas').match(/\d+/g)!.map(Number);
  return red + green + blue < 384;
}

// Windows contrast themes are light or dark, so test both palettes where the browser supports them
const palettes = [
  { colorScheme: 'light', prefix: 'forced-colors' },
  { colorScheme: 'dark', prefix: 'forced-colors-dark' }
] as const;

describe.each(palettes)('$colorScheme palette', ({ colorScheme, prefix }) => {
  beforeEach(async ({ skip, onTestFinished }) => {
    await commands.emulateMedia({ forcedColors: 'active', colorScheme });
    onTestFinished(async () => {
      await commands.emulateMedia({ forcedColors: null, colorScheme: null });
    });

    skip(!areColorsForced() || isCanvasDark() !== (colorScheme === 'dark'));

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

  it('focused checkbox on a selected row', async () => {
    await userEvent.keyboard('{ArrowDown}');
    await expect.element(grid).toMatchScreenshot(`${prefix}-focused-checkbox-selected-row`);
  });

  it('focused checkbox on an unselected row', async () => {
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    await expect.element(grid).toMatchScreenshot(`${prefix}-focused-checkbox-unselected-row`);
  });
});
