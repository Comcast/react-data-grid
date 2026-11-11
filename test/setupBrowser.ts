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
    // a single selector, as `and()` doesn't match inside an iframe when its argument is scoped to the frame
    return '.rdg-cell-active:is([role="gridcell"], [role="columnheader"])';
  },

  getDragHandle() {
    return '.rdg-cell-drag-handle';
  },

  getBySelector(selector: string) {
    return selector;
  }
});

beforeEach(async () => {
  // 1. move the pointer off the grid, so screenshots don't capture hover styles
  // 2. focus the page: if the previous test file ended with a focused element,
  //    Firefox may not focus the next file's iframe, and keyboard-first tests fail
  await userEvent.click(document.body, { position: { x: 0, y: 0 } });
});
