import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';

import { DataGrid, type Column } from '../../src';

const columns: readonly Column<number>[] = Array.from({ length: 50 }, (_, i) => ({
  key: String(i),
  name: String(i),
  width: 100
}));

const rows: readonly number[] = Array.from({ length: 100 }, (_, i) => i);

test('hydrates the columns that fit in initialSize, then renders the ones that fit in the grid', async ({
  onTestFinished
}) => {
  const grid = (
    <StrictMode>
      <DataGrid
        columns={columns}
        rows={rows}
        initialSize={{ inlineSize: 1000, blockSize: 350 }}
        style={{ inlineSize: 500 }}
      />
    </StrictMode>
  );

  const container = document.createElement('div');
  container.innerHTML = renderToString(grid);
  document.body.append(container);
  const serverHeaderCells = container.querySelectorAll('[role="columnheader"]');
  // 10 columns of 100px fit in 1000px, plus 1 overscan column
  expect(serverHeaderCells).toHaveLength(10 + 1);

  const recoverableErrors: unknown[] = [];
  const root = hydrateRoot(container, grid, {
    onRecoverableError(error) {
      recoverableErrors.push(error);
    }
  });
  onTestFinished(() => {
    root.unmount();
    container.remove();
  });

  // 5 columns fit in the grid's 500px, plus 1 overscan column
  await expect.poll(() => container.querySelectorAll('[role="columnheader"]').length).toBe(5 + 1);
  // React hydrated the server-rendered grid instead of replacing it
  expect(serverHeaderCells[0].isConnected).toBe(true);
  expect(recoverableErrors).toStrictEqual([]);
});
