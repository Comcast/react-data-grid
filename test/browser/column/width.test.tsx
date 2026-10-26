import { useState } from 'react';
import { page, userEvent } from 'vite-plus/test/browser';

import { DataGrid, type Column } from '../../../src';
import { setup } from '../utils';

const grid = page.getGrid();

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
