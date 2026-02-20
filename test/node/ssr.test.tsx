import { renderToString } from 'react-dom/server';

import type { Column } from '../../src';
import { DataGrid } from '../../src';

interface Row {
  id: number;
  title: string;
}

const columns: readonly Column<Row>[] = [
  { key: 'id', name: 'ID' },
  { key: 'title', name: 'Title' }
];

const rows: readonly Row[] = [
  { id: 0, title: 'Example' },
  { id: 1, title: 'Demo' }
];

function App() {
  return <DataGrid columns={columns} rows={rows} />;
}

test('basic server-side rendering (SSR) support', () => {
  // make sure we're not running in a browser environment
  expect(globalThis.window).toBeUndefined();

  const html = renderToString(<App />);
  expect(html).not.toHaveLength(0);
});
