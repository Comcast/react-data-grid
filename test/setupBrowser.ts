// vitest-browser-react also automatically injects render method on the page
// need to import it so TypeScript can pick up types
import 'vitest-browser-react';

import { configure } from 'vitest-browser-react/pure';
import { locators, userEvent, type Locator, type LocatorByRoleOptions } from 'vitest/browser';

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
    scroll: (this: Locator, options: ScrollToOptions) => Promise<void>;
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
    return this.getByRole('row', defaultToExactOpts(opts)).and(
      this.getBySelector('.rdg-header-row')
    );
  },

  getHeaderCell(opts?: LocatorByRoleOptions) {
    return this.getByRole('columnheader', defaultToExactOpts(opts));
  },

  getRow(opts?: LocatorByRoleOptions & { index?: number }) {
    const row = this.getByRole('row', defaultToExactOpts(opts)).and(this.getBySelector('.rdg-row'));
    if (opts?.index != null) {
      const grid = document.querySelector('.rdg')!;
      const headerRowsCount = grid.querySelectorAll(':scope > .rdg-header-row').length;
      const topSummaryRowsCount = grid.querySelectorAll(':scope > .rdg-top-summary-row').length;
      const ariaRowIndex = headerRowsCount + topSummaryRowsCount + opts.index + 1;
      return row.and(this.getBySelector(`[aria-rowindex="${ariaRowIndex}"]`));
    }
    return row;
  },

  getCell(opts?: LocatorByRoleOptions & { index?: number }) {
    const cell = this.getByRole('gridcell', defaultToExactOpts(opts));
    if (opts?.index != null) {
      return cell.and(this.getBySelector(`[aria-colindex="${opts.index + 1}"]`));
    }
    return cell;
  },

  getSummaryRow(opts?: LocatorByRoleOptions) {
    return this.getByRole('row', defaultToExactOpts(opts)).and(
      this.getBySelector('.rdg-summary-row')
    );
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

  async scroll(options: ScrollToOptions) {
    await new Promise((resolve) => {
      const element = (this as Locator).element();
      element.addEventListener('scrollend', resolve, { once: true });
      element.scroll(options);
    });
  },

  blur() {
    (this as Locator).element().blur();
  }
});

function defaultToExactOpts(
  opts: LocatorByRoleOptions | undefined
): LocatorByRoleOptions | undefined {
  if (opts != null && opts.exact == null && typeof opts.name === 'string') {
    return {
      ...opts,
      exact: true
    };
  }

  return opts;
}

interface CustomMatchers<R = unknown> {
  toHaveRowsCount: (rowsCount: number) => R;
  toHaveCellPosition: (columnIdx: number, rowIdx: number) => R;
}

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
  interface Matchers<T = any> extends CustomMatchers<T> {}
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
  // 1. reset cursor position to avoid hover issues
  // 2. force focus to be on the page
  await userEvent.click(document.body, { position: { x: 0, y: 0 } });
});

afterEach(() => {
  vi.useRealTimers();

  // eslint-disable-next-line vitest/no-standalone-expect
  expect
    .soft(
      // eslint-disable-next-line @eslint-react/purity
      document.hasFocus(),
      'Focus is set on a browser UI element at the end of a test. Use safeTab() to return focus to the page.'
    )
    .toBe(true);
});
