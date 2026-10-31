import { page } from 'vite-plus/test/browser';

import { DataGrid } from '../../src';
import type { DataGridProps } from '../../src';

export function setup<R, SR, K extends React.Key = React.Key>(props: DataGridProps<R, SR, K>) {
  return page.render(<DataGrid {...props} />);
}

export function getRowKey<K extends React.Key>(row: { readonly id: K }): K {
  return row.id;
}

export function testRowCount(expectedCount: number) {
  return expect.element(page.getRow()).toHaveLength(expectedCount);
}
