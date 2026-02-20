import { createRef } from 'react';
import { page } from 'vitest/browser';

import type { Column, DataGridHandle } from '../../src';
import { setup } from './utils';

const rows: readonly number[] = Array.from({ length: 50 }, (_, i) => i);
const summaryRows: readonly number[] = Array.from({ length: 2 }, (_, i) => i + 50);
const columns: Column<number, number>[] = [];

for (let i = 0; i < 50; i++) {
  const key = String(i);
  columns.push({
    key,
    name: key,
    frozen: i < 5,
    renderCell(props) {
      return `${props.column.key}×${props.row}`;
    },
    renderSummaryCell(props) {
      return `${props.column.key}×${props.row}`;
    }
  });
}

test('scrollToCell', async () => {
  const ref = createRef<DataGridHandle>();
  await setup({
    ref,
    columns,
    rows,
    topSummaryRows: summaryRows,
    rowHeight: 60
  });

  expect(ref.current).toBeDefined();

  await validateCellVisibility('0×0', true);
  await validateCellVisibility('40×30', false);
  await validateCellVisibility('0×51', true);

  // should scroll to a cell when a valid position is specified
  ref.current!.scrollToCell({ idx: 40, rowIdx: 30 });
  await validateCellVisibility('0×0', false);
  await validateCellVisibility('40×30', true);

  // should scroll to a column when a valid idx is specified
  ref.current!.scrollToCell({ idx: 6 });
  await validateCellVisibility('6×30', true);
  await validateCellVisibility('40×30', false);
  ref.current!.scrollToCell({ idx: 40 });
  await validateCellVisibility('6×30', false);
  await validateCellVisibility('40×30', true);

  // should scroll to a row when a valid rowIdx is specified
  ref.current!.scrollToCell({ rowIdx: 1 });
  await validateCellVisibility('40×1', true);
  await validateCellVisibility('40×30', false);
  ref.current!.scrollToCell({ rowIdx: 30 });
  await validateCellVisibility('40×1', false);
  await validateCellVisibility('40×30', true);

  // should not scroll if scroll to column is frozen
  ref.current!.scrollToCell({ idx: 2 });
  await validateCellVisibility('40×30', true);

  // should not scroll if rowIdx is header row
  ref.current!.scrollToCell({ idx: -1 });
  await validateCellVisibility('40×30', true);

  // should not scroll if rowIdx is summary row
  ref.current!.scrollToCell({ idx: 50 });
  await validateCellVisibility('40×30', true);

  // should not scroll if position is out of bound
  ref.current!.scrollToCell({ idx: 60, rowIdx: 60 });
  await validateCellVisibility('40×30', true);

  // should not scroll vertically when scrolling to summary row
  ref.current!.scrollToCell({ idx: 49, rowIdx: 51 });
  await validateCellVisibility('49×30', true);
});

function validateCellVisibility(name: string, isVisible: boolean) {
  const cell = page.getCell({ name });

  if (isVisible) {
    return expect.element(cell).toBeVisible();
  }

  return expect.element(cell).not.toBeInTheDocument();
}
