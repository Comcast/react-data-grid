import { bench } from 'vitest';
import { renderHook } from 'vitest-browser-react';

import { useCalculatedColumns } from '../../src/hooks/useCalculatedColumns';
import type { Column } from '../../src/types';

// --- Data generation ---

interface Row {
  id: number;
  [key: string]: unknown;
}

function generateColumns(count: number, options?: { frozen?: number }): Column<Row>[] {
  const frozenCount = options?.frozen ?? 0;
  const columns: Column<Row>[] = [];
  for (let i = 0; i < count; i++) {
    columns.push({
      key: `col${i}`,
      name: `Column ${i}`,
      width: 100 + (i % 50),
      frozen: i < frozenCount
    });
  }
  return columns;
}

function generateColumnsWithGroups(count: number) {
  const columns: Column<Row>[] = [];
  for (let i = 0; i < count; i++) {
    columns.push({
      key: `col${i}`,
      name: `Column ${i}`,
      width: 120
    });
  }
  // Return as column groups of 5
  const groups = [];
  for (let i = 0; i < columns.length; i += 5) {
    groups.push({
      name: `Group ${Math.floor(i / 5)}`,
      children: columns.slice(i, i + 5)
    });
  }
  return groups;
}

const COLS_10 = generateColumns(10);
const COLS_50 = generateColumns(50);
const COLS_100 = generateColumns(100);
const COLS_500 = generateColumns(500);
const COLS_FROZEN = generateColumns(50, { frozen: 5 });
const COLS_GROUPED = generateColumnsWithGroups(50);

const DEFAULT_COLUMN_OPTIONS = undefined;
const VIEWPORT_WIDTH = 1920;
const GET_COLUMN_WIDTH = () => 120;

// --- Benchmarks ---

describe('useCalculatedColumns - column count scaling', () => {
  bench('10 columns', async () => {
    await renderHook(() =>
      useCalculatedColumns({
        rawColumns: COLS_10,
        defaultColumnOptions: DEFAULT_COLUMN_OPTIONS,
        viewportWidth: VIEWPORT_WIDTH,
        scrollLeft: 0,
        getColumnWidth: GET_COLUMN_WIDTH,
        enableVirtualization: true
      })
    );
  });

  bench('50 columns', async () => {
    await renderHook(() =>
      useCalculatedColumns({
        rawColumns: COLS_50,
        defaultColumnOptions: DEFAULT_COLUMN_OPTIONS,
        viewportWidth: VIEWPORT_WIDTH,
        scrollLeft: 0,
        getColumnWidth: GET_COLUMN_WIDTH,
        enableVirtualization: true
      })
    );
  });

  bench('100 columns', async () => {
    await renderHook(() =>
      useCalculatedColumns({
        rawColumns: COLS_100,
        defaultColumnOptions: DEFAULT_COLUMN_OPTIONS,
        viewportWidth: VIEWPORT_WIDTH,
        scrollLeft: 0,
        getColumnWidth: GET_COLUMN_WIDTH,
        enableVirtualization: true
      })
    );
  });

  bench('500 columns', async () => {
    await renderHook(() =>
      useCalculatedColumns({
        rawColumns: COLS_500,
        defaultColumnOptions: DEFAULT_COLUMN_OPTIONS,
        viewportWidth: VIEWPORT_WIDTH,
        scrollLeft: 0,
        getColumnWidth: GET_COLUMN_WIDTH,
        enableVirtualization: true
      })
    );
  });
});

describe('useCalculatedColumns - frozen columns', () => {
  bench('50 columns with 5 frozen', async () => {
    await renderHook(() =>
      useCalculatedColumns({
        rawColumns: COLS_FROZEN,
        defaultColumnOptions: DEFAULT_COLUMN_OPTIONS,
        viewportWidth: VIEWPORT_WIDTH,
        scrollLeft: 0,
        getColumnWidth: GET_COLUMN_WIDTH,
        enableVirtualization: true
      })
    );
  });

  bench('50 columns with 5 frozen - scrolled', async () => {
    await renderHook(() =>
      useCalculatedColumns({
        rawColumns: COLS_FROZEN,
        defaultColumnOptions: DEFAULT_COLUMN_OPTIONS,
        viewportWidth: VIEWPORT_WIDTH,
        scrollLeft: 3000,
        getColumnWidth: GET_COLUMN_WIDTH,
        enableVirtualization: true
      })
    );
  });
});

describe('useCalculatedColumns - column groups', () => {
  bench('50 columns in 10 groups', async () => {
    await renderHook(() =>
      useCalculatedColumns({
        rawColumns: COLS_GROUPED,
        defaultColumnOptions: DEFAULT_COLUMN_OPTIONS,
        viewportWidth: VIEWPORT_WIDTH,
        scrollLeft: 0,
        getColumnWidth: GET_COLUMN_WIDTH,
        enableVirtualization: true
      })
    );
  });
});

describe('useCalculatedColumns - virtualization off', () => {
  bench('100 columns - virtualization disabled', async () => {
    await renderHook(() =>
      useCalculatedColumns({
        rawColumns: COLS_100,
        defaultColumnOptions: DEFAULT_COLUMN_OPTIONS,
        viewportWidth: VIEWPORT_WIDTH,
        scrollLeft: 0,
        getColumnWidth: GET_COLUMN_WIDTH,
        enableVirtualization: false
      })
    );
  });
});
