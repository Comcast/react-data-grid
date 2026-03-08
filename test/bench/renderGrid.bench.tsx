import { renderToString } from 'react-dom/server';
import { bench } from 'vitest';
import { render } from 'vitest-browser-react';

import { DataGrid } from '../../src';
import type { Column } from '../../src';

// --- Data generation ---

interface Row {
  id: number;
  [key: string]: unknown;
}

function generateRows(count: number, columnCount: number): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < count; i++) {
    const row: Row = { id: i };
    for (let j = 0; j < columnCount; j++) {
      row[`col${j}`] = `cell-${i}-${j}`;
    }
    rows.push(row);
  }
  return rows;
}

function generateColumns(count: number, options?: { frozen?: number }): Column<Row>[] {
  const frozenCount = options?.frozen ?? 0;
  const columns: Column<Row>[] = [];
  for (let i = 0; i < count; i++) {
    columns.push({
      key: `col${i}`,
      name: `Column ${i}`,
      width: 120,
      frozen: i < frozenCount
    });
  }
  return columns;
}

// Pre-generate datasets
const COLS_5 = generateColumns(5);
const COLS_20 = generateColumns(20);
const COLS_50 = generateColumns(50);
const COLS_FROZEN = generateColumns(20, { frozen: 3 });

const ROWS_100_5C = generateRows(100, 5);
const ROWS_1K_5C = generateRows(1_000, 5);
const ROWS_10K_5C = generateRows(10_000, 5);
const ROWS_100K_5C = generateRows(100_000, 5);
const ROWS_100_20C = generateRows(100, 20);
const ROWS_1K_20C = generateRows(1_000, 20);
const ROWS_10K_20C = generateRows(10_000, 20);
const ROWS_100_50C = generateRows(100, 50);
const ROWS_1K_50C = generateRows(1_000, 50);

// --- Full grid render benchmarks ---

describe('DataGrid render - row count scaling (5 columns)', () => {
  bench('100 rows', async () => {
    await render(<DataGrid columns={COLS_5} rows={ROWS_100_5C} />);
  });

  bench('1,000 rows', async () => {
    await render(<DataGrid columns={COLS_5} rows={ROWS_1K_5C} />);
  });

  bench('10,000 rows', async () => {
    await render(<DataGrid columns={COLS_5} rows={ROWS_10K_5C} />);
  });

  bench('100,000 rows', async () => {
    await render(<DataGrid columns={COLS_5} rows={ROWS_100K_5C} />);
  });
});

describe('DataGrid render - column count scaling (100 rows)', () => {
  bench('5 columns', async () => {
    await render(<DataGrid columns={COLS_5} rows={ROWS_100_5C} />);
  });

  bench('20 columns', async () => {
    await render(<DataGrid columns={COLS_20} rows={ROWS_100_20C} />);
  });

  bench('50 columns', async () => {
    await render(<DataGrid columns={COLS_50} rows={ROWS_100_50C} />);
  });
});

describe('DataGrid render - large grids', () => {
  bench('1,000 rows × 20 columns', async () => {
    await render(<DataGrid columns={COLS_20} rows={ROWS_1K_20C} />);
  });

  bench('10,000 rows × 20 columns', async () => {
    await render(<DataGrid columns={COLS_20} rows={ROWS_10K_20C} />);
  });

  bench('1,000 rows × 50 columns', async () => {
    await render(<DataGrid columns={COLS_50} rows={ROWS_1K_50C} />);
  });
});

describe('DataGrid render - frozen columns', () => {
  bench('20 columns, 3 frozen, 1,000 rows', async () => {
    await render(<DataGrid columns={COLS_FROZEN} rows={ROWS_1K_20C} />);
  });
});

describe('DataGrid render - virtualization disabled', () => {
  bench('100 rows × 5 columns - no virtualization', async () => {
    await render(<DataGrid columns={COLS_5} rows={ROWS_100_5C} enableVirtualization={false} />);
  });

  bench('1,000 rows × 5 columns - no virtualization', async () => {
    await render(<DataGrid columns={COLS_5} rows={ROWS_1K_5C} enableVirtualization={false} />);
  });
});

// --- SSR benchmarks ---

describe('DataGrid SSR (renderToString)', () => {
  bench('100 rows × 5 columns', () => {
    renderToString(<DataGrid columns={COLS_5} rows={ROWS_100_5C} />);
  });

  bench('1,000 rows × 5 columns', () => {
    renderToString(<DataGrid columns={COLS_5} rows={ROWS_1K_5C} />);
  });

  bench('1,000 rows × 20 columns', () => {
    renderToString(<DataGrid columns={COLS_20} rows={ROWS_1K_20C} />);
  });
});
