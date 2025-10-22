import { useState } from 'react';
import { page, userEvent } from '@vitest/browser/context';

import { DataGrid, SelectColumn } from '../../src';
import type { Column } from '../../src';
import { getCell, getRowByCell, getSelectAllCheckbox } from './utils';

interface Row {
  id: number;
}

const columns: readonly Column<Row>[] = [
  SelectColumn,
  {
    key: 'id',
    name: 'ID'
  }
];

const defaultRows: readonly Row[] = [{ id: 1 }, { id: 2 }, { id: 3 }];

function rowKeyGetter(row: Row) {
  return row.id;
}

function RowSelectionTest({
  initialRows,
  isRowSelectionDisabled
}: {
  initialRows: readonly Row[];
  isRowSelectionDisabled?: (row: Row) => boolean;
}) {
  const [selectedRows, setSelectedRows] = useState((): ReadonlySet<number> => new Set());

  return (
    <DataGrid
      rowKeyGetter={rowKeyGetter}
      columns={columns}
      rows={initialRows}
      selectedRows={selectedRows}
      isRowSelectionDisabled={isRowSelectionDisabled}
      onSelectedRowsChange={setSelectedRows}
    />
  );
}

function setup(initialRows = defaultRows) {
  page.render(<RowSelectionTest initialRows={initialRows} />);
}

function getRowByText(rowIdx: number) {
  return getRowByCell(getCell(String(rowIdx + 1)));
}

function testSelection(rowIdx: number, isSelected: boolean) {
  return expect
    .element(getRowByText(rowIdx))
    .toHaveAttribute('aria-selected', isSelected ? 'true' : 'false');
}

async function toggleSelection(rowIdx: number, shift = false, force = false) {
  const checkbox = getRowByText(rowIdx).getByRole('checkbox', { name: 'Select' });
  if (shift) await userEvent.keyboard('{Shift>}');
  await userEvent.click(checkbox, { force });
  if (shift) await userEvent.keyboard('{/Shift}');
}

test('toggle selection when checkbox is clicked', async () => {
  setup();
  await toggleSelection(0);
  await testSelection(0, true);
  await toggleSelection(1);
  await testSelection(1, true);

  await toggleSelection(0);
  await testSelection(0, false);
  await toggleSelection(1);
  await testSelection(1, false);
});

test('toggle selection using keyboard', async () => {
  setup();
  await testSelection(0, false);
  await userEvent.click(getRowByText(0).getByRole('checkbox', { name: 'Select' }));
  await testSelection(0, true);
  await userEvent.keyboard(' ');
  await testSelection(0, false);
  await userEvent.keyboard(' ');
  await testSelection(0, true);
  await userEvent.keyboard('{arrowdown} ');
  await testSelection(1, true);
  await userEvent.keyboard('{arrowup} ');
  await testSelection(0, false);
});

test('should partially select header checkbox', async () => {
  setup();
  const headerCheckbox = getSelectAllCheckbox();
  await expect.element(headerCheckbox).not.toBeChecked();
  await expect.element(headerCheckbox).not.toBePartiallyChecked();

  await toggleSelection(0);
  await expect.element(headerCheckbox).not.toBeChecked();
  await expect.element(headerCheckbox).toBePartiallyChecked();

  await toggleSelection(1);
  await expect.element(headerCheckbox).not.toBeChecked();
  await expect.element(headerCheckbox).toBePartiallyChecked();

  await toggleSelection(2);
  await expect.element(headerCheckbox).toBeChecked();
  await expect.element(headerCheckbox).not.toBePartiallyChecked();

  await toggleSelection(0);
  await expect.element(headerCheckbox).not.toBeChecked();
  await expect.element(headerCheckbox).toBePartiallyChecked();

  await userEvent.click(headerCheckbox);
  await testSelection(0, false);
  await testSelection(1, false);
  await testSelection(2, false);

  await userEvent.click(headerCheckbox);
  await testSelection(0, true);
  await testSelection(1, true);
  await testSelection(2, true);
});

test('should not select row when isRowSelectionDisabled returns true', async () => {
  page.render(
    <RowSelectionTest initialRows={defaultRows} isRowSelectionDisabled={(row) => row.id === 2} />
  );
  await toggleSelection(0);
  await testSelection(0, true);
  await toggleSelection(1, false, true); // force click even if disabled
  await testSelection(1, false);
  await toggleSelection(2);
  await testSelection(2, true);

  await userEvent.click(getSelectAllCheckbox());
  await toggleSelection(0);
  await toggleSelection(2, true);
  await testSelection(0, true);
  await testSelection(1, false);
  await testSelection(2, true);
});

test('select/deselect all rows when header checkbox is clicked', async () => {
  setup();
  const headerCheckbox = getSelectAllCheckbox();
  await expect.element(headerCheckbox).not.toBeChecked();
  await userEvent.click(headerCheckbox);
  await testSelection(0, true);
  await testSelection(1, true);
  await testSelection(2, true);

  // deselecting a row should toggle header
  await toggleSelection(0);
  await expect.element(headerCheckbox).not.toBeChecked();
  await toggleSelection(0);
  await expect.element(headerCheckbox).toBeChecked();

  await userEvent.click(headerCheckbox);
  await testSelection(0, false);
  await testSelection(1, false);
  await testSelection(2, false);
});

test('header checkbox is not checked when there are no rows', async () => {
  setup([]);
  await expect.element(getSelectAllCheckbox()).not.toBeChecked();
});

test('header checkbox is not necessarily checked when selectedRows.size === rows.length', async () => {
  page.render(
    <DataGrid
      rowKeyGetter={rowKeyGetter}
      columns={columns}
      rows={defaultRows}
      selectedRows={new Set([1, 2, 4])}
    />
  );

  await expect.element(getSelectAllCheckbox()).not.toBeChecked();
});

test('header checkbox is not necessarily checked when selectedRows.size > rows.length', async () => {
  page.render(
    <DataGrid
      rowKeyGetter={rowKeyGetter}
      columns={columns}
      rows={defaultRows}
      selectedRows={new Set([1, 2, 4, 5])}
    />
  );

  await expect.element(getSelectAllCheckbox()).not.toBeChecked();
});

test('extra keys are preserved when updating the selectedRows Set', async () => {
  const initialSet = new Set([-1, 0, 99]);
  let set = initialSet;

  function Test() {
    const [selectedRows, setSelectedRows] = useState<ReadonlySet<number>>(initialSet);

    function onSelectedRowsChange(selectedRows: Set<number>) {
      setSelectedRows(selectedRows);
      set = selectedRows;
    }

    return (
      <DataGrid
        rowKeyGetter={rowKeyGetter}
        columns={columns}
        rows={defaultRows}
        selectedRows={selectedRows}
        onSelectedRowsChange={onSelectedRowsChange}
      />
    );
  }

  page.render(<Test />);

  const headerCheckbox = getSelectAllCheckbox();

  await toggleSelection(1);
  expect(set).toStrictEqual(new Set([...initialSet, 2]));

  await userEvent.click(headerCheckbox);
  expect(set).toStrictEqual(initialSet);

  await userEvent.click(headerCheckbox);
  expect(set).toStrictEqual(new Set([...initialSet, 1, 2, 3]));

  await userEvent.click(headerCheckbox);
  expect(set).toStrictEqual(initialSet);

  await toggleSelection(1);
  expect(set).toStrictEqual(new Set([...initialSet, 2]));

  await toggleSelection(1);
  expect(set).toStrictEqual(initialSet);
});

test('select/deselect rows using shift click', async () => {
  setup();
  await toggleSelection(0);
  await toggleSelection(2, true);
  await testSelection(0, true);
  await testSelection(1, true);
  await testSelection(2, true);
  await toggleSelection(0);
  await toggleSelection(2, true);
  await testSelection(0, false);
  await testSelection(1, false);
  await testSelection(2, false);
});

test('select rows using shift space', async () => {
  setup();
  await userEvent.click(getCell('1'));
  await userEvent.keyboard('{Shift>} {/Shift}');
  await testSelection(0, true);
  await userEvent.keyboard(' ');
  await testSelection(0, true);
  await userEvent.keyboard('{Shift>} {/Shift}');
  await testSelection(0, false);
});
