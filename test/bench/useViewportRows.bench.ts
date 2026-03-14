import { bench } from 'vitest';
import { renderHook } from 'vitest-browser-react';

import { useViewportRows } from '../../src/hooks/useViewportRows';

// --- Data generation ---

interface Row {
  id: number;
  value: string;
}

function generateRows(count: number): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < count; i++) {
    rows.push({ id: i, value: `row-${i}` });
  }
  return rows;
}

const ROWS_100 = generateRows(100);
const ROWS_1K = generateRows(1_000);
const ROWS_10K = generateRows(10_000);
const ROWS_100K = generateRows(100_000);

const FIXED_ROW_HEIGHT = 35;
const VARIABLE_ROW_HEIGHT = (row: Row) => (row.id % 3 === 0 ? 50 : 35);
const CLIENT_HEIGHT = 800;

// --- Fixed row height benchmarks ---

describe('useViewportRows - fixed row height', () => {
  bench('100 rows', async () => {
    await renderHook(() =>
      useViewportRows({
        rows: ROWS_100,
        rowHeight: FIXED_ROW_HEIGHT,
        clientHeight: CLIENT_HEIGHT,
        scrollTop: 0,
        enableVirtualization: true
      })
    );
  });

  bench('1,000 rows', async () => {
    await renderHook(() =>
      useViewportRows({
        rows: ROWS_1K,
        rowHeight: FIXED_ROW_HEIGHT,
        clientHeight: CLIENT_HEIGHT,
        scrollTop: 0,
        enableVirtualization: true
      })
    );
  });

  bench('10,000 rows', async () => {
    await renderHook(() =>
      useViewportRows({
        rows: ROWS_10K,
        rowHeight: FIXED_ROW_HEIGHT,
        clientHeight: CLIENT_HEIGHT,
        scrollTop: 0,
        enableVirtualization: true
      })
    );
  });

  bench('100,000 rows', async () => {
    await renderHook(() =>
      useViewportRows({
        rows: ROWS_100K,
        rowHeight: FIXED_ROW_HEIGHT,
        clientHeight: CLIENT_HEIGHT,
        scrollTop: 0,
        enableVirtualization: true
      })
    );
  });

  bench('10,000 rows - scrolled to middle', async () => {
    const scrollTop = (10_000 / 2) * FIXED_ROW_HEIGHT;
    await renderHook(() =>
      useViewportRows({
        rows: ROWS_10K,
        rowHeight: FIXED_ROW_HEIGHT,
        clientHeight: CLIENT_HEIGHT,
        scrollTop,
        enableVirtualization: true
      })
    );
  });

  bench('10,000 rows - virtualization disabled', async () => {
    await renderHook(() =>
      useViewportRows({
        rows: ROWS_10K,
        rowHeight: FIXED_ROW_HEIGHT,
        clientHeight: CLIENT_HEIGHT,
        scrollTop: 0,
        enableVirtualization: false
      })
    );
  });
});

// --- Variable row height benchmarks ---

describe('useViewportRows - variable row height', () => {
  bench('100 rows', async () => {
    await renderHook(() =>
      useViewportRows({
        rows: ROWS_100,
        rowHeight: VARIABLE_ROW_HEIGHT,
        clientHeight: CLIENT_HEIGHT,
        scrollTop: 0,
        enableVirtualization: true
      })
    );
  });

  bench('1,000 rows', async () => {
    await renderHook(() =>
      useViewportRows({
        rows: ROWS_1K,
        rowHeight: VARIABLE_ROW_HEIGHT,
        clientHeight: CLIENT_HEIGHT,
        scrollTop: 0,
        enableVirtualization: true
      })
    );
  });

  bench('10,000 rows', async () => {
    await renderHook(() =>
      useViewportRows({
        rows: ROWS_10K,
        rowHeight: VARIABLE_ROW_HEIGHT,
        clientHeight: CLIENT_HEIGHT,
        scrollTop: 0,
        enableVirtualization: true
      })
    );
  });

  bench('10,000 rows - scrolled to middle', async () => {
    // Approximate scroll position for middle of variable height rows
    const scrollTop = 5_000 * 40;
    await renderHook(() =>
      useViewportRows({
        rows: ROWS_10K,
        rowHeight: VARIABLE_ROW_HEIGHT,
        clientHeight: CLIENT_HEIGHT,
        scrollTop,
        enableVirtualization: true
      })
    );
  });
});
