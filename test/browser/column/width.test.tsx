import { useState } from 'react';
import { page, userEvent } from 'vite-plus/test/browser';

import { DataGrid, type Column } from '../../../src';
import { setup } from '../utils';

const grid = page.getGrid();

const noRows: readonly unknown[] = [];

test('should use the new width when the width of a column changes', async () => {
  function TestGrid() {
    const [width, setWidth] = useState(100);

    return (
      <>
        <button type="button" onClick={() => setWidth(200)}>
          Widen column
        </button>
        <DataGrid
          columns={[
            { key: 'col1', name: 'col1', width },
            { key: 'col2', name: 'col2', width: 100 }
          ]}
          rows={[]}
        />
      </>
    );
  }

  await page.render(<TestGrid />);

  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 100px' });
  await userEvent.click(page.getByRole('button', { name: 'Widen column' }));
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '200px 100px' });
});

test('should measure a column when its width changes from a number to auto', async () => {
  function TestGrid() {
    const [width, setWidth] = useState<number | string>(100);

    return (
      <>
        <button type="button" onClick={() => setWidth('auto')}>
          Auto width
        </button>
        <DataGrid
          columns={[
            { key: 'col1', name: 'col1', width },
            { key: 'col2', name: 'col2', width: 100 }
          ]}
          rows={[]}
        />
      </>
    );
  }

  await page.render(<TestGrid />);

  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 100px' });
  await userEvent.click(page.getByRole('button', { name: 'Auto width' }));
  // the grid is 1918px wide
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '1818px 100px' });
});

test('should keep the measured width when the minWidth exceeds it temporarily', async () => {
  function TestGrid() {
    const [minWidth, setMinWidth] = useState(50);

    return (
      <>
        <button type="button" onClick={() => setMinWidth(2000)}>
          Raise minWidth
        </button>
        <button type="button" onClick={() => setMinWidth(50)}>
          Lower minWidth
        </button>
        <DataGrid
          columns={[
            { key: 'col1', name: 'col1', minWidth },
            { key: 'col2', name: 'col2', width: 100 }
          ]}
          rows={[]}
        />
      </>
    );
  }

  await page.render(<TestGrid />);

  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '1818px 100px' });
  await userEvent.click(page.getByRole('button', { name: 'Raise minWidth' }));
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '2000px 100px' });
  await userEvent.click(page.getByRole('button', { name: 'Lower minWidth' }));
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '1818px 100px' });
});

test('should not cause a ResizeObserver loop error when the grid narrows', async () => {
  const columns: readonly Column<unknown>[] = Array.from({ length: 8 }, (_, i) => ({
    key: String(i),
    name: String(i)
  }));

  function TestGrid() {
    const [gridWidth, setGridWidth] = useState(1920);

    return (
      <>
        <button type="button" onClick={() => setGridWidth(1200)}>
          Narrow grid
        </button>
        <DataGrid columns={columns} rows={noRows} style={{ width: gridWidth }} />
      </>
    );
  }

  await page.render(<TestGrid />);

  // the grid has a 1px border
  await expect
    .element(grid)
    .toHaveStyle({ gridTemplateColumns: Array.from(columns, () => '239.75px').join(' ') });
  // the columns that were measured before the grid narrowed don't fit in it at first,
  // so some are virtualized away until they are measured again
  await userEvent.click(page.getByRole('button', { name: 'Narrow grid' }));
  await expect
    .element(grid)
    .toHaveStyle({ gridTemplateColumns: Array.from(columns, () => '149.75px').join(' ') });
  await expect.element(page.getHeaderCell()).toHaveLength(8);
});

test('auto columns are at least as wide as their content, within their minWidth and maxWidth', async () => {
  const longName = 'x'.repeat(50);
  const columns: Column<unknown>[] = [
    { key: 'min', name: '', minWidth: 120 },
    { key: 'max', name: longName, maxWidth: 100 }
  ];

  // the columns are wider than the grid
  for (let i = 0; i < 10; i++) {
    columns.push({ key: String(i), name: `${i}${longName}` });
  }

  await setup<unknown, unknown>({ columns, rows: [] });

  await expect.poll(() => grid.element().style.gridTemplateColumns).toMatch(/^120px 100px /);
  // the content of the other columns is not truncated
  const headerCell = page.getHeaderCell({ name: `0${longName}` }).element();
  expect(headerCell.clientWidth).toBe(headerCell.scrollWidth);
});
