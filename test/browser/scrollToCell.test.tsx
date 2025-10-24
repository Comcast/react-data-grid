import { useRef } from 'react';
import { page, userEvent } from 'vitest/browser';

import { DataGrid } from '../../src';
import type { Column, DataGridHandle } from '../../src';
import type { PartialPosition } from '../../src/ScrollToCell';

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

let position: PartialPosition;

function Grid() {
  const ref = useRef<DataGridHandle>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          ref.current!.scrollToCell(position);
        }}
      >
        Scroll to cell
      </button>
      <DataGrid
        ref={ref}
        columns={columns}
        rows={rows}
        topSummaryRows={summaryRows}
        rowHeight={60}
      />
    </>
  );
}

async function testScroll(p: PartialPosition) {
  position = p;
  await userEvent.click(page.getByRole('button'));
}

test('scrollToCell', async () => {
  await page.render(<Grid />);
  await validateCellVisibility('0×0', true);
  await validateCellVisibility('40×30', false);
  await validateCellVisibility('0×51', true);

  // should scroll to a cell when a valid position is specified
  await testScroll({ idx: 40, rowIdx: 30 });
  await validateCellVisibility('0×0', false);
  await validateCellVisibility('40×30', true);

  // should scroll to a column when a valid idx is specified
  await testScroll({ idx: 6 });
  await validateCellVisibility('6×30', true);
  await validateCellVisibility('40×30', false);
  await testScroll({ idx: 40 });
  await validateCellVisibility('6×30', false);
  await validateCellVisibility('40×30', true);

  // should scroll to a row when a valid rowIdx is specified
  await testScroll({ rowIdx: 1 });
  await validateCellVisibility('40×1', true);
  await validateCellVisibility('40×30', false);
  await testScroll({ rowIdx: 30 });
  await validateCellVisibility('40×1', false);
  await validateCellVisibility('40×30', true);

  // should not scroll if scroll to column is frozen
  await testScroll({ idx: 2 });
  await validateCellVisibility('40×30', true);

  // should not scroll if rowIdx is header row
  await testScroll({ idx: -1 });
  await validateCellVisibility('40×30', true);

  // should not scroll if rowIdx is summary row
  await testScroll({ idx: 50 });
  await validateCellVisibility('40×30', true);

  // should not scroll if position is out of bound
  await testScroll({ idx: 60, rowIdx: 60 });
  await validateCellVisibility('40×30', true);

  // should not scroll vertically when scrolling to summary row
  await testScroll({ idx: 49, rowIdx: 51 });
  await validateCellVisibility('49×30', true);
});

function validateCellVisibility(name: string, isVisible: boolean) {
  const cell = page.getByRole('gridcell', { name, exact: true });
  if (isVisible) {
    return expect.element(cell).toBeVisible();
  }

  return expect.element(cell).not.toBeInTheDocument();
}
