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
// @ts-expect-error
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
    getRow: (opts?: LocatorByRoleOptions) => Locator;
    getCell: (opts?: LocatorByRoleOptions) => Locator;
    getSelectAllCheckbox: () => Locator;
    getActiveCell: () => Locator;
    getDragHandle: () => Locator;
    getBySelector: (selector: string) => Locator;
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

  getRow(opts?: LocatorByRoleOptions) {
    return this.getByRole('row', opts).and(this.getBySelector('.rdg-row'));
  },

  getCell(opts?: LocatorByRoleOptions) {
    return this.getByRole('gridcell', opts);
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

  getBySelector(selector: string) {
    return selector;
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

  expect
    .soft(
      document.hasFocus(),
      'Focus is set on a browser UI element at the end of a test. Use safeTab() to return focus to the page.'
    )
    .toBe(true);

  // If a test file ends with a focused element, Firefox may not focus
  // the first element clicked in an iframe created by the next test file.
  (document.activeElement as HTMLElement | null)?.blur();
});
