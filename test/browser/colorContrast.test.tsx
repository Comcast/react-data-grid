import { page, userEvent, type Locator } from 'vite-plus/test/browser';

import { DataGrid, SelectColumn, type Column } from '../../src';
import { getRowKey } from './utils';

interface Row {
  id: number;
  name: string;
}

const columns: readonly Column<Row>[] = [SelectColumn, { key: 'name', name: 'Name' }];

const rows: readonly Row[] = [
  { id: 1, name: 'Row 1' },
  { id: 2, name: 'Row 2' }
];

const selectedRows: ReadonlySet<number> = new Set([1]);

// WCAG 2.2 minimum contrast ratios for text (1.4.3) and for focus indicators (1.4.11)
const minTextContrast = 4.5;
const minFocusIndicatorContrast = 3;

type RGB = readonly [r: number, g: number, b: number];

function parseColor(color: string): { rgb: RGB; alpha: number } {
  const match = /^rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?\)$/.exec(color);
  if (match === null) {
    throw new Error(`Unsupported color: ${color}`);
  }
  const [, r, g, b, alpha = '1'] = match;
  return { rgb: [Number(r), Number(g), Number(b)], alpha: Number(alpha) };
}

function getTextColor(element: Element) {
  return parseColor(getComputedStyle(element).color).rgb;
}

function getOutlineColor(element: Element) {
  const { outlineStyle, outlineWidth, outlineColor } = getComputedStyle(element);
  expect(outlineStyle).toBe('solid');
  expect(outlineWidth).toBe('2px');
  return parseColor(outlineColor).rgb;
}

// the color of the first opaque background behind the element
function getBackgroundColor(element: Element) {
  for (let el: Element | null = element; el !== null; el = el.parentElement) {
    const { rgb, alpha } = parseColor(getComputedStyle(el).backgroundColor);
    if (alpha === 1) return rgb;
    if (alpha !== 0) {
      throw new Error(`Translucent background on ${el.className}`);
    }
  }
  throw new Error('No opaque background');
}

// https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
function getRelativeLuminance(rgb: RGB) {
  const [r, g, b] = rgb.map((value) => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio
function getContrastRatio(a: RGB, b: RGB) {
  const luminanceA = getRelativeLuminance(a);
  const luminanceB = getRelativeLuminance(b);
  return (Math.max(luminanceA, luminanceB) + 0.05) / (Math.min(luminanceA, luminanceB) + 0.05);
}

async function testFocusedCheckbox(checkbox: Locator) {
  await expect.element(checkbox).toHaveFocus();
  const element = checkbox.element();
  const focusRingContrast = getContrastRatio(getOutlineColor(element), getBackgroundColor(element));
  expect(focusRingContrast).toBeGreaterThanOrEqual(minFocusIndicatorContrast);
}

async function testActiveCell(cell: Locator) {
  await expect.element(cell).toHaveFocus();
  const element = cell.element();
  const background = getBackgroundColor(element);
  const textContrast = getContrastRatio(getTextColor(element), background);
  const outlineContrast = getContrastRatio(getOutlineColor(element), background);
  expect(textContrast).toBeGreaterThanOrEqual(minTextContrast);
  expect(outlineContrast).toBeGreaterThanOrEqual(minFocusIndicatorContrast);
}

async function testRow(selected: boolean, hovered: boolean) {
  const rowIdx = rows.findIndex((row) => selectedRows.has(row.id) === selected);
  const row = page.getRow().nth(rowIdx);
  await expect.element(row).toHaveAttribute('aria-selected', String(selected));
  // keep the pointer off the rows, unless the row should be hovered
  await userEvent.hover(hovered ? row : page.getHeaderCell({ name: 'Name' }));

  await userEvent.keyboard('{ArrowDown}'.repeat(rowIdx + 1));
  await testFocusedCheckbox(row.getByRole('checkbox', { name: 'Select' }));

  await userEvent.keyboard('{ArrowRight}');
  await testActiveCell(row.getByRole('gridcell', { name: rows[rowIdx].name }));
}

describe.each(['light', 'dark'] as const)('%s color scheme', (colorScheme) => {
  beforeEach(async () => {
    await page.render(
      <DataGrid
        aria-label="Color contrast"
        className={`rdg-${colorScheme}`}
        getRowKey={getRowKey}
        columns={columns}
        rows={rows}
        selectedRows={selectedRows}
        onSelectedRowsChange={() => {}}
      />
    );

    // focus the "Select All" checkbox with the keyboard, so `:focus-visible` matches
    await userEvent.tab();
  });

  it('header row', async () => {
    await testFocusedCheckbox(page.getByRole('checkbox', { name: 'Select All' }));

    await userEvent.keyboard('{ArrowRight}');
    await testActiveCell(page.getHeaderCell({ name: 'Name' }));
  });

  it('selected row', async () => {
    await testRow(true, false);
  });

  it('hovered selected row', async () => {
    await testRow(true, true);
  });

  it('unselected row', async () => {
    await testRow(false, false);
  });

  it('hovered unselected row', async () => {
    await testRow(false, true);
  });
});
