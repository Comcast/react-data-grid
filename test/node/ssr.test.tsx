import { renderToString } from 'react-dom/server';

import { DataGrid } from '../../src';
import type { Column } from '../../src';

interface Row {
  id: number;
  title: string;
}

const columns: readonly Column<Row>[] = [
  { key: 'id', name: 'ID', frozen: true },
  { key: 'title', name: 'Title' }
];

const rows: readonly Row[] = [
  { id: 0, title: 'Example' },
  { id: 1, title: 'Demo' }
];

test('basic server-side rendering (SSR) support', () => {
  // make sure we're not running in a browser environment
  expect(globalThis.window).toBeUndefined();

  const html = renderToString(<DataGrid columns={columns} rows={rows} />);
  expect(html).not.toHaveLength(0);
});

test('renders all the columns when virtualization is disabled', () => {
  const html = renderToString(
    <DataGrid columns={columns} rows={rows} enableVirtualization={false} />
  );

  // the grid's width is unknown on the server
  expect(html.match(/role="columnheader"/g)).toHaveLength(2);
});
