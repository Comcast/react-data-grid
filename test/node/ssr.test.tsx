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

const manyColumns: readonly Column<number>[] = Array.from({ length: 50 }, (_, i) => ({
  key: String(i),
  name: String(i),
  width: 100
}));

const manyRows: readonly number[] = Array.from({ length: 100 }, (_, i) => i);

test('renders the first few rows and columns without initialSize', () => {
  const html = renderToString(<DataGrid columns={manyColumns} rows={manyRows} />);

  // the grid is 1×1 pixels until the browser measures it, so only the overscan rows and columns render
  expect(html.match(/role="columnheader"/g)).toHaveLength(2);
  expect(html.match(/aria-rowindex=/g)).toHaveLength(1 + 4);
});

test('renders the rows and columns that fit in initialSize', () => {
  const html = renderToString(
    <DataGrid
      columns={manyColumns}
      rows={manyRows}
      initialSize={{ inlineSize: 1000, blockSize: 350 }}
    />
  );

  // 10 columns of 100px fit in 1000px, plus 1 overscan column
  expect(html.match(/role="columnheader"/g)).toHaveLength(10 + 1);
  // 10 rows of 35px start in the 315px under the header row, plus 4 overscan rows
  expect(html.match(/aria-rowindex=/g)).toHaveLength(1 + 10 + 4);
});
