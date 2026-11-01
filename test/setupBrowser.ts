// vitest-browser-react also automatically injects the render method on the page,
// so we need to import it for TypeScript to pick up its types
import 'vitest-browser-react';

import {
  locators,
  userEvent,
  type Locator,
  type LocatorByRoleOptions
} from 'vite-plus/test/browser';
import { configure } from 'vitest-browser-react/pure';

// avoid printing huge stack traces
// Chromium defaults to 10
// Firefox defaults to 128
// WebKit defaults to 100
Error.stackTraceLimit = 10;

configure({
  reactStrictMode: true
});

declare module 'vitest/browser' {
  interface LocatorSelectors {
    getGrid: () => Locator;
    getTreeGrid: () => Locator;
    getHeaderRow: (opts?: LocatorByRoleOptions) => Locator;
    getHeaderCell: (opts?: LocatorByRoleOptions) => Locator;
    getRow: (opts?: LocatorByRoleOptions & { index?: number }) => Locator;
    getSummaryRow: (opts?: LocatorByRoleOptions) => Locator;
    getCell: (opts?: LocatorByRoleOptions & { index?: number }) => Locator;
    getSelectAllCheckbox: () => Locator;
    getActiveCell: () => Locator;
    getDragHandle: () => Locator;
    getRowWithCell: (cell: Locator) => Locator;
    getBySelector: (selector: string) => Locator;
    scroll: (this: Locator, options: ScrollToOptions) => void;
    blur: (this: Locator) => void;
  }
}

locators.extend({
  getGrid() {
    return this.getByRole('grid');
  },

  getTreeGrid() {
    return this.getByRole('treegrid');
  },

  getHeaderRow(opts?: LocatorByRoleOptions) {
    return this.getByRole('row', opts).and(this.getBySelector('.rdg-header-row'));
  },

  getHeaderCell(opts?: LocatorByRoleOptions) {
    return this.getByRole('columnheader', opts);
  },

  getRow(opts?: LocatorByRoleOptions & { index?: number }) {
    const row = this.getByRole('row', opts).and(this.getBySelector('.rdg-row'));
    if (opts?.index != null) {
      // this reads the rendered grid, so `index` cannot be used before rendering it
      const grid = document.querySelector('.rdg')!;
      const headerRowsCount = grid.querySelectorAll(':scope > .rdg-header-row').length;
      const topSummaryRowsCount = grid.querySelectorAll(':scope > .rdg-top-summary-row').length;
      const ariaRowIndex = headerRowsCount + topSummaryRowsCount + opts.index + 1;
      return row.and(this.getBySelector(`[aria-rowindex="${ariaRowIndex}"]`));
    }
    return row;
  },

  getCell(opts?: LocatorByRoleOptions & { index?: number }) {
    const cell = this.getByRole('gridcell', opts);
    if (opts?.index != null) {
      return cell.and(this.getBySelector(`[aria-colindex="${opts.index + 1}"]`));
    }
    return cell;
  },

  getSummaryRow(opts?: LocatorByRoleOptions) {
    return this.getByRole('row', opts).and(this.getBySelector('.rdg-summary-row'));
  },

  getSelectAllCheckbox() {
    return this.getByRole('checkbox', { name: 'Select All' });
  },

  getActiveCell() {
    return this.getCell({ selected: true }).or(this.getHeaderCell({ selected: true }));
  },

  getDragHandle() {
    return '.rdg-cell-drag-handle';
  },

  getRowWithCell(cell: Locator) {
    return this.getRow().filter({ has: cell });
  },

  getBySelector(selector: string) {
    return selector;
  },

  scroll(options: ScrollToOptions) {
    (this as Locator).element().scroll(options);
  },

  blur() {
    (this as Locator).element().blur();
  }
});

declare module 'vitest' {
  interface Matchers<R> {
    toHaveRowsCount: (rowsCount: number) => R;
    toHaveCellPosition: (columnIdx: number, rowIdx: number) => R;
  }
}

expect.extend({
  toHaveRowsCount(grid: HTMLElement, expected) {
    if (!grid.matches('.rdg')) {
      return {
        pass: false,
        message: () => 'expected element to be a grid'
      };
    }

    const allRowsCount = Number(grid.getAttribute('aria-rowcount'));
    const otherRowsCount = grid.querySelectorAll(
      ':scope > :is(.rdg-header-row, .rdg-summary-row)'
    ).length;
    const count = allRowsCount - otherRowsCount;

    return {
      pass: count === expected,
      message: () => `expected ${count} to have row count ${expected}`
    };
  },

  toHaveCellPosition(cell: HTMLElement, columnIdx: number, rowIdx: number) {
    const actualColIndex = cell.getAttribute('aria-colindex');
    const row = cell.closest('.rdg-row, .rdg-header-row, .rdg-summary-row');
    const actualRowIndex = row?.getAttribute('aria-rowindex');
    const expectedColIndex = String(columnIdx + 1);
    const expectedRowIndex = String(rowIdx + 1);

    return {
      pass: actualColIndex === expectedColIndex && actualRowIndex === expectedRowIndex,
      message: () =>
        `expected cell position (${columnIdx}, ${rowIdx}) but got (${Number(actualColIndex) - 1}, ${Number(actualRowIndex) - 1})`
    };
  }
});

beforeEach(async () => {
  do {
    // 1. reset cursor position to avoid hover issues
    // 2. force focus to be on the page
    await userEvent.click(document.body, { position: { x: 0, y: 0 } });
    // Firefox needs two clicks sometimes
  } while (!document.hasFocus());
});

afterEach(() => {
  vi.useRealTimers();

  // Tabbing past the first or last focusable element moves focus out of the page,
  // and depending on the browser, pressing Tab again may not return it to the expected element.
  // https://github.com/microsoft/playwright/issues/39268
  expect
    .soft(
      document.hasFocus(),
      'Focus is set on a browser UI element at the end of a test. Render a focusable element before or after the grid, so tabbing keeps focus on the page.'
    )
    .toBe(true);

  // If a test file ends with a focused element, Firefox may not focus
  // the first element clicked in an iframe created by the next test file.
  (document.activeElement as HTMLElement | null)?.blur();
});
