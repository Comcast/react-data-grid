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

test('should not cause a ResizeObserver loop error when the grid is opened in a dialog', async () => {
  // the columns are wider than their minWidth, and the dialog is as wide as the grid's columns
  const columns: readonly Column<unknown>[] = [
    { key: 'col1', name: 'The first column' },
    { key: 'col2', name: 'The second column' }
  ];

  await page.render(
    <dialog
      ref={(dialog) => {
        // the dialog opens after the grid's layout effects ran
        dialog?.showModal();
      }}
    >
      <DataGrid columns={columns} rows={noRows} />
    </dialog>
  );

  await expect.element(page.getHeaderCell()).toHaveLength(2);
  await expect.poll(() => grid.element().style.gridTemplateColumns).toMatch(/^[\d.]+px [\d.]+px$/);
});

test('should only render the columns in the viewport while a column is resized', async () => {
  const columns: readonly Column<unknown>[] = Array.from({ length: 30 }, (_, i) => ({
    key: String(i),
    name: `The column number ${i}`,
    resizable: true
  }));

  await setup<unknown, unknown>({ columns, rows: [] });

  await expect.poll(() => grid.element().style.gridTemplateColumns).not.toMatch(/auto/);
  const headerCellCount = page.getHeaderCell().elements().length;
  expect(headerCellCount).toBeLessThan(30);

  await userEvent.click(page.getHeaderCell({ name: 'The column number 0' }));
  // keep the key pressed, so the column is still being resized
  await userEvent.keyboard('{Control>}{ArrowRight>}');
  await expect.poll(() => grid.element().style.gridTemplateColumns).toMatch(/auto/);
  expect(page.getHeaderCell().elements()).toHaveLength(headerCellCount);
  await userEvent.keyboard('{/ArrowRight}{/Control}');
});

// with 12 columns, the measured widths are fractional, and their sum can exceed the grid's width
describe.for([8, 12])('with %i columns', (count) => {
  test('should not cause a ResizeObserver loop error when the grid narrows', async () => {
    const columns: readonly Column<unknown>[] = Array.from({ length: count }, (_, i) => ({
      key: String(i),
      name: `column ${i}`
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

    await expect.element(page.getHeaderCell()).toHaveLength(count);
    await expect.poll(() => grid.element().style.gridTemplateColumns).not.toContain('auto');
    // The columns that were measured before the grid narrowed don't fit in it at first,
    // they must not be virtualized away until they are measured again.
    await userEvent.click(page.getByRole('button', { name: 'Narrow grid' }));
    // the grid has a 1px border
    await expect.poll(() => grid.element().clientWidth).toBe(1198);
    await expect.poll(() => grid.element().style.gridTemplateColumns).not.toContain('auto');
    await expect.element(page.getHeaderCell()).toHaveLength(count);
  });
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
