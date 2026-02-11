import { configure } from 'vitest-browser-react/pure';
import { locators, type Locator, type LocatorByRoleOptions } from 'vitest/browser';

// vitest-browser-react also automatically injects render method on the page
// need to import it so TypeScript can pick up types
import 'vitest-browser-react';

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
    getSelectedCell: () => Locator;
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
    return this.getByRole('row', defaultToExactOpts(opts)).and(
      this.getBySelector('.rdg-header-row')
    );
  },

  getHeaderCell(opts?: LocatorByRoleOptions) {
    return this.getByRole('columnheader', defaultToExactOpts(opts));
  },

  getRow(opts?: LocatorByRoleOptions) {
    return this.getByRole('row', defaultToExactOpts(opts)).and(this.getBySelector('.rdg-row'));
  },

  getCell(opts?: LocatorByRoleOptions) {
    return this.getByRole('gridcell', defaultToExactOpts(opts));
  },

  getSelectAllCheckbox() {
    return this.getByRole('checkbox', { name: 'Select All' });
  },

  getSelectedCell() {
    return this.getCell({ selected: true }).or(this.getHeaderCell({ selected: true }));
  },

  getDragHandle() {
    return '.rdg-cell-drag-handle';
  },

  getBySelector(selector: string) {
    return selector;
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
