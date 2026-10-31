import { useState } from 'react';
import { page, server, userEvent } from 'vite-plus/test/browser';

import type { Column, RowHeightArgs, TreeCellKeyDownArgs, TreePositionChangeArgs } from '../../src';
import { DataGrid, isGroupRow, renderTextEditor, SelectColumn, TreeDataGrid } from '../../src';
import { rowActiveClassname } from '../../src/style/row';
import { getCellsAtRowIndex, getRowKey, getRowWithCell, testCount, testRowCount } from './utils';

const treeGrid = page.getTreeGrid();
const headerRow = treeGrid.getHeaderRow();
const headerCells = headerRow.getHeaderCell();
const headerCheckbox = headerRow.getSelectAllCheckbox();
const rows = treeGrid.getRow();
const activeCell = treeGrid.getActiveCell();

interface Row {
  id: number;
  country: string;
  year: number;
}

type SummaryRow = undefined;

const topSummaryRows: readonly SummaryRow[] = [undefined];
const bottomSummaryRows: readonly SummaryRow[] = [undefined];

const columns: readonly Column<Row, SummaryRow>[] = [
  SelectColumn,
  {
    key: 'sport',
    name: 'Sport'
  },
  {
    key: 'country',
    name: 'Country',
    renderEditCell: renderTextEditor
  },
  {
    key: 'year',
    name: 'Year'
  },
  {
    key: 'id',
    name: 'Id',
    renderCell(props) {
      function onClick() {
        props.onRowChange({ ...props.row, id: props.row.id + 10 });
      }

      return (
        <button type="button" onClick={onClick}>
          value: {props.row.id}
        </button>
      );
    },
    renderGroupCell({ row }) {
      return Math.min(...row.childRows.map((c) => c.id));
    }
  }
];

const initialRows: readonly Row[] = [
  {
    id: 1,
    country: 'USA',
    year: 2020
  },
  {
    id: 2,
    country: 'USA',
    year: 2021
  },
  {
    id: 3,
    country: 'Canada',
    year: 2021
  },
  {
    id: 4,
    country: 'Canada',
    year: 2022
  }
];

const onCellCopySpy = vi.fn();
const onCellPasteSpy = vi.fn(({ row }: { row: Row }) => row);

function TestGrid({
  groupBy,
  getGroupId,
  getRowGroupKey
}: {
  groupBy: string[];
  getGroupId: ((groupKey: string, parentId?: string) => string) | undefined;
  getRowGroupKey: ((row: Row, columnKey: string) => string) | undefined;
}) {
  const [rows, setRows] = useState(initialRows);
  const [selectedRows, setSelectedRows] = useState((): ReadonlySet<number> => new Set());
  const [expandedGroupIds, setExpandedGroupIds] = useState((): ReadonlySet<string> => new Set());

  return (
    <TreeDataGrid
      columns={columns}
      rows={rows}
      topSummaryRows={topSummaryRows}
      bottomSummaryRows={bottomSummaryRows}
      getRowKey={getRowKey}
      groupBy={groupBy}
      getRowGroupKey={getRowGroupKey}
      selectedRows={selectedRows}
      onSelectedRowsChange={setSelectedRows}
      expandedGroupIds={expandedGroupIds}
      onExpandedGroupIdsChange={setExpandedGroupIds}
      onRowsChange={setRows}
      onCellCopy={onCellCopySpy}
      onCellPaste={onCellPasteSpy}
      getGroupId={getGroupId}
    />
  );
}

interface SetupOptions {
  getGroupId?: (groupKey: string, parentId?: string) => string;
  getRowGroupKey?: (row: Row, columnKey: string) => string;
}

function setup(groupBy: string[], { getGroupId, getRowGroupKey }: SetupOptions = {}) {
  return page.render(
    <TestGrid groupBy={groupBy} getGroupId={getGroupId} getRowGroupKey={getRowGroupKey} />
  );
}

async function testHeaderCellsContent(expected: readonly string[]) {
  await testCount(headerCells, expected.length);

  for (const [n, text] of expected.entries()) {
    await expect.element(headerCells.nth(n)).toHaveTextContent(text);
  }
}

test('should not group if groupBy is empty', async () => {
  await setup([]);
  await expect.element(treeGrid).toHaveAttribute('aria-rowcount', '7');
  await testHeaderCellsContent(['', 'Sport', 'Country', 'Year', 'Id']);
  await testRowCount(6);
});

test('should not group if column does not exist', async () => {
  await setup(['abc']);
  await expect.element(treeGrid).toHaveAttribute('aria-rowcount', '7');
  await testRowCount(6);
});

test('should group by single column', async () => {
  await setup(['country']);
  await expect.element(treeGrid).toHaveAttribute('aria-rowcount', '9');
  await testHeaderCellsContent(['', 'Country', 'Sport', 'Year', 'Id']);
  await testRowCount(4);
});

test('should group by multiple columns', async () => {
  await setup(['country', 'year']);
  await expect.element(treeGrid).toHaveAttribute('aria-rowcount', '13');
  await testHeaderCellsContent(['', 'Country', 'Year', 'Sport', 'Id']);
  await testRowCount(4);
});

test('should use getGroupId when provided', async () => {
  const getGroupId = vi.fn((groupKey: string, parentId?: string) =>
    parentId === undefined ? groupKey : `${groupKey}#${parentId}`
  );
  await setup(['country', 'year'], { getGroupId });
  expect(getGroupId).toHaveBeenCalled();
  await expect.element(treeGrid).toHaveAttribute('aria-rowcount', '13');
  await testHeaderCellsContent(['', 'Country', 'Year', 'Sport', 'Id']);
  await testRowCount(4);
  getGroupId.mockClear();
  await userEvent.click(page.getCell({ name: 'USA' }));
  await testRowCount(6);
  expect(getGroupId).toHaveBeenCalled();
  await userEvent.click(page.getCell({ name: 'Canada' }));
  await testRowCount(8);
  await userEvent.click(page.getCell({ name: '2020' }));
  await testRowCount(9);
});

test('should use getRowGroupKey when provided', async () => {
  const getRowGroupKey = vi.fn((row: Row, columnKey: string) =>
    columnKey === 'country' ? row.country.slice(0, 1) : String(row[columnKey as keyof Row])
  );
  await setup(['country'], { getRowGroupKey });
  expect(getRowGroupKey).toHaveBeenCalled();
  await expect.element(treeGrid).toHaveAttribute('aria-rowcount', '9');
  await testRowCount(4);
  await expect.element(page.getCell({ name: 'U' })).toBeInTheDocument();
  await expect.element(page.getCell({ name: 'C' })).toBeInTheDocument();
});

test('should order groups by the first row that belongs to them', async () => {
  // integer-like group keys in descending order, which must not be sorted numerically
  await setup(['year'], { getRowGroupKey: (row) => String(3000 - row.year) });
  for (const [index, groupKey] of ['980', '979', '978'].entries()) {
    await expect
      .element(getRowWithCell(page.getCell({ name: groupKey })))
      .toHaveAttribute('aria-posinset', String(index + 1));
  }
});

test('should ignore duplicate groupBy columns', async () => {
  await setup(['year', 'year', 'year']);
  await expect.element(treeGrid).toHaveAttribute('aria-rowcount', '10');
  await testRowCount(5);
});

test('should use groupBy order while grouping', async () => {
  await setup(['year', 'country']);
  await expect.element(treeGrid).toHaveAttribute('aria-rowcount', '14');
  await testHeaderCellsContent(['', 'Year', 'Country', 'Sport', 'Id']);
  await testRowCount(5);
});

// WebKit lays out each row track of the grid, so a million rows take ~250ms per layout
// and ~1 GB of memory, and the page keeps over half of it after the test.
// The tested code doesn't depend on the browser, and Chromium and Firefox have lower limits.
test(
  'should expand a group with more rows than a function call can take as arguments',
  { skip: server.browser === 'webkit' },
  async () => {
    // browsers limit the number of arguments, e.g., in `push(...childRows)`, and a million is above all of their limits
    const rows = Array.from({ length: 1_000_000 }, (_, id): Row => ({
      id,
      country: 'USA',
      year: 2020
    }));

    await page.render(
      <TreeDataGrid
        columns={[
          { key: 'country', name: 'Country' },
          { key: 'id', name: 'Id' }
        ]}
        rows={rows}
        groupBy={['country']}
        expandedGroupIds={new Set(['USA'])}
        onExpandedGroupIdsChange={() => {}}
      />
    );

    // the header row, the group row, and the rows of the group
    await expect.element(treeGrid).toHaveAttribute('aria-rowcount', '1000002');
    // the row count doesn't depend on the expanded state, so also check that the rows were added
    await expect.element(page.getCell({ name: '0', exact: true })).toBeVisible();
  }
);

test('should keep the row keys when an earlier group is expanded, without getRowKey', async () => {
  function Test() {
    const [expandedGroupIds, setExpandedGroupIds] = useState(
      (): ReadonlySet<string> => new Set(['Canada'])
    );

    return (
      <TreeDataGrid
        columns={[
          { key: 'country', name: 'Country' },
          { key: 'id', name: 'Id' }
        ]}
        rows={initialRows}
        groupBy={['country']}
        expandedGroupIds={expandedGroupIds}
        onExpandedGroupIdsChange={setExpandedGroupIds}
      />
    );
  }

  await page.render(<Test />);
  await testRowCount(4);
  const idCell = page.getCell({ name: '3', exact: true });
  const rowElement = getRowWithCell(idCell).element();

  await userEvent.click(page.getCell({ name: 'USA' }));
  await testRowCount(6);
  // the row moved down, but its key didn't change, so React kept its element
  expect(getRowWithCell(idCell).element()).toBe(rowElement);
});

test('should toggle group when group cell is clicked', async () => {
  await setup(['year']);
  await testRowCount(5);
  const groupCell = page.getCell({ name: '2021' });
  await userEvent.click(groupCell);
  await testRowCount(7);
  await userEvent.click(groupCell);
  await testRowCount(5);
});

test('should toggle group using keyboard', async () => {
  await setup(['year']);
  await testRowCount(5);
  const groupCell = page.getCell({ name: '2021' });
  await userEvent.click(groupCell);
  await testRowCount(7);
  // clicking on the group cell focuses the row
  await expect.element(activeCell).not.toBeInTheDocument();
  await expect.element(getRowWithCell(groupCell)).toHaveClass(rowActiveClassname);
  await userEvent.keyboard('{arrowright}{arrowright}{enter}');
  await testRowCount(5);
  await userEvent.keyboard('{enter}');
  await testRowCount(7);
});

test('should set aria-attributes', async () => {
  await setup(['year', 'country']);

  const groupCell1 = page.getCell({ name: '2020' });
  const groupRow1 = getRowWithCell(groupCell1);
  await expect.element(groupRow1).toHaveAttribute('aria-level', '1');
  await expect.element(groupRow1).toHaveAttribute('aria-setsize', '3');
  await expect.element(groupRow1).toHaveAttribute('aria-posinset', '1');
  await expect.element(groupRow1).toHaveAttribute('aria-rowindex', '3');
  await expect.element(groupRow1).toHaveAttribute('aria-expanded', 'false');

  const groupCell2 = page.getCell({ name: '2021' });
  const groupRow2 = getRowWithCell(groupCell2);
  await expect.element(groupRow2).toHaveAttribute('aria-level', '1');
  await expect.element(groupRow2).toHaveAttribute('aria-setsize', '3');
  await expect.element(groupRow2).toHaveAttribute('aria-posinset', '2');
  await expect.element(groupRow2).toHaveAttribute('aria-rowindex', '6');
  await expect.element(groupRow1).toHaveAttribute('aria-expanded', 'false');

  await userEvent.click(groupCell2);
  await expect.element(groupRow2).toHaveAttribute('aria-expanded', 'true');

  const groupCell3 = page.getCell({ name: 'Canada' });
  const groupRow3 = getRowWithCell(groupCell3);
  await expect.element(groupRow3).toHaveAttribute('aria-level', '2');
  await expect.element(groupRow3).toHaveAttribute('aria-setsize', '2');
  await expect.element(groupRow3).toHaveAttribute('aria-posinset', '2');
  await expect.element(groupRow3).toHaveAttribute('aria-rowindex', '9');
  await expect.element(groupRow1).toHaveAttribute('aria-expanded', 'false');

  await userEvent.click(groupCell3);
  await expect.element(groupRow3).toHaveAttribute('aria-expanded', 'true');
});

test('should select rows in a group', async () => {
  await setup(['year', 'country']);

  await expect.element(headerCheckbox).not.toBeChecked();

  // expand group
  const groupCell1 = page.getCell({ name: '2021' });
  await userEvent.click(groupCell1);
  const groupCell2 = page.getCell({ name: 'Canada' });
  await userEvent.click(groupCell2);

  const selectedRows = page.getRow({ selected: true });
  await testCount(selectedRows, 0);

  // select parent row
  await userEvent.click(getRowWithCell(groupCell1).getByRole('checkbox', { name: 'Select Group' }));
  await testCount(selectedRows, 4);
  await expect.element(selectedRows.nth(0)).toHaveAttribute('aria-rowindex', '6');
  await expect.element(selectedRows.nth(1)).toHaveAttribute('aria-rowindex', '7');
  await expect.element(selectedRows.nth(2)).toHaveAttribute('aria-rowindex', '9');
  await expect.element(selectedRows.nth(3)).toHaveAttribute('aria-rowindex', '10');

  // unselecting child should unselect the parent row
  await userEvent.click(selectedRows.nth(3).getByRole('checkbox', { name: 'Select' }));
  await testCount(selectedRows, 1);
  await expect.element(selectedRows.nth(0)).toHaveAttribute('aria-rowindex', '7');

  // select child group
  const checkbox = getRowWithCell(groupCell2).getByRole('checkbox', {
    name: 'Select Group'
  });
  await userEvent.click(checkbox);
  await testCount(selectedRows, 4);

  // unselect child group
  await userEvent.click(checkbox);
  await testCount(selectedRows, 1);

  await userEvent.click(page.getCell({ name: '2020' }));
  await userEvent.click(page.getCell({ name: '2022' }));

  await userEvent.click(headerCheckbox);
  await testCount(selectedRows, 0);

  await userEvent.click(headerCheckbox);
  await testCount(selectedRows, 8);

  await userEvent.click(headerCheckbox);
  await testCount(selectedRows, 0);
});

test('should select the rows of a group with Shift+Space', async () => {
  await setup(['year', 'country']);
  const selectedRows = page.getRow({ selected: true });

  // expand the group, and activate the empty country cell of its row
  const groupCell = page.getCell({ name: '2021' });
  await userEvent.click(groupCell);
  await userEvent.keyboard('{arrowright}{arrowright}{arrowright}');
  await expect.element(getRowWithCell(groupCell).getCell().nth(2)).toHaveFocus();

  // the group row and its 2 collapsed groups
  await userEvent.keyboard('{Shift>} {/Shift}');
  await testCount(selectedRows, 3);
  await expect.element(headerCheckbox).toBePartiallyChecked();

  await userEvent.keyboard('{Shift>} {/Shift}');
  await testCount(selectedRows, 0);
  await expect.element(headerCheckbox).not.toBeChecked();
});

test('should include the rows of collapsed groups in the select-all checkbox', async () => {
  await setup(['year', 'country']);

  const groupCell = page.getCell({ name: '2021' });
  await userEvent.click(groupCell);
  await userEvent.click(
    getRowWithCell(page.getCell({ name: 'USA' })).getByRole('checkbox', { name: 'Select Group' })
  );
  await expect.element(headerCheckbox).toBePartiallyChecked();

  // no visible row is selected
  await userEvent.click(groupCell);
  await testCount(page.getRow({ selected: true }), 0);
  await expect.element(headerCheckbox).toBePartiallyChecked();

  await userEvent.click(headerCheckbox);
  await expect.element(headerCheckbox).not.toBeChecked();

  await userEvent.click(headerCheckbox);
  await expect.element(headerCheckbox).toBeChecked();
  await testCount(page.getRow({ selected: true }), 3);
});

async function toggleSelection(cellName: string, shift = false) {
  const row = getRowWithCell(page.getCell({ name: cellName, exact: true }));
  const checkbox = row.getByRole('checkbox', { name: /^Select( Group)?$/ });
  if (shift) await userEvent.keyboard('{Shift>}');
  await userEvent.click(checkbox);
  if (shift) await userEvent.keyboard('{/Shift}');
}

test('should select the rows of collapsed groups in a Shift+click range', async () => {
  await setup(['year']);
  const selectedRows = page.getRow({ selected: true });

  // only the 2021 group stays collapsed
  await userEvent.click(page.getCell({ name: '2020' }));
  await userEvent.click(page.getCell({ name: '2022' }));

  await toggleSelection('value: 1');
  await toggleSelection('value: 4', true);
  // the 3 group rows and the rows 1 and 4
  await testCount(selectedRows, 5);
  await expect.element(headerCheckbox).toBeChecked();

  // the range can start on a group row
  await userEvent.click(headerCheckbox);
  await testCount(selectedRows, 0);
  await toggleSelection('2020');
  await toggleSelection('value: 4', true);
  await testCount(selectedRows, 5);

  // the rows of the 2021 group are selected
  await userEvent.click(page.getCell({ name: '2021' }));
  await testCount(selectedRows, 7);
});

test('should only select the rows of expanded groups that are in a Shift+click range', async () => {
  await setup(['year']);
  const selectedRows = page.getRow({ selected: true });

  await userEvent.click(page.getCell({ name: '2020' }));
  await userEvent.click(page.getCell({ name: '2021' }));

  // the range covers the 2021 group row and its first row, but not its second row
  await toggleSelection('value: 1');
  await toggleSelection('value: 2', true);
  // the 2020 group row and the rows 1 and 2
  await testCount(selectedRows, 3);
  await expect
    .element(getRowWithCell(page.getCell({ name: 'value: 3' })))
    .toHaveAttribute('aria-selected', 'false');
  await expect
    .element(getRowWithCell(page.getCell({ name: '2021' })))
    .toHaveAttribute('aria-selected', 'false');
});

interface DetailRow {
  id: number;
}

const detailRows: readonly DetailRow[] = [{ id: 1 }, { id: 2 }];
// WebKit reports a ResizeObserver loop when the detail grid measures auto-sized columns
const detailColumns: readonly Column<DetailRow>[] = [
  SelectColumn,
  { key: 'id', name: 'Id', width: 100 }
];

function getDetailRowKey(row: DetailRow) {
  return row.id;
}

function DetailGrid() {
  const [selectedRows, setSelectedRows] = useState((): ReadonlySet<number> => new Set());

  return (
    <DataGrid
      columns={detailColumns}
      rows={detailRows}
      getRowKey={getDetailRowKey}
      selectedRows={selectedRows}
      onSelectedRowsChange={setSelectedRows}
      style={{ blockSize: 140 }}
    />
  );
}

const masterColumns: readonly Column<Row>[] = [
  SelectColumn,
  { key: 'year', name: 'Year' },
  { key: 'detail', name: 'Detail', width: 300, renderCell: () => <DetailGrid /> }
];

function getMasterRowHeight({ type }: RowHeightArgs<Row>) {
  return type === 'ROW' ? 150 : 35;
}

function MasterDetailTestGrid() {
  const [selectedRows, setSelectedRows] = useState((): ReadonlySet<number> => new Set());
  const [expandedGroupIds, setExpandedGroupIds] = useState(
    (): ReadonlySet<string> => new Set(['2020'])
  );

  return (
    <TreeDataGrid
      columns={masterColumns}
      rows={initialRows}
      rowHeight={getMasterRowHeight}
      getRowKey={getRowKey}
      groupBy={['year']}
      selectedRows={selectedRows}
      onSelectedRowsChange={setSelectedRows}
      expandedGroupIds={expandedGroupIds}
      onExpandedGroupIdsChange={setExpandedGroupIds}
    />
  );
}

test('should not share the select-all checkbox with a grid in a cell', async () => {
  await page.render(<MasterDetailTestGrid />);
  const detailGrid = page.getGrid();
  const detailHeaderCheckbox = detailGrid.getSelectAllCheckbox();
  // the header row of the detail grid is in the tree grid too
  const treeHeaderCheckbox = headerRow.nth(0).getSelectAllCheckbox();

  await userEvent.click(detailHeaderCheckbox);
  await expect.element(detailHeaderCheckbox).toBeChecked();
  await testCount(detailGrid.getRow({ selected: true }), 2);
  await expect.element(treeHeaderCheckbox).not.toBeChecked();
  await expect.element(treeHeaderCheckbox).not.toBePartiallyChecked();

  await userEvent.click(treeHeaderCheckbox);
  await expect.element(treeHeaderCheckbox).toBeChecked();
  await expect.element(detailHeaderCheckbox).toBeChecked();

  await userEvent.click(detailHeaderCheckbox);
  await expect.element(detailHeaderCheckbox).not.toBeChecked();
  await expect.element(treeHeaderCheckbox).toBeChecked();
});

test('cell navigation in a treegrid', async () => {
  await setup(['country', 'year']);
  await testRowCount(4);

  const topSummaryRow = rows.nth(0);
  const row1 = rows.nth(1);
  const row3 = rows.nth(3);

  // expand group
  const groupCell1 = row1.getCell({ name: 'USA' });
  await expect.element(document.body).toHaveFocus();
  await expect.element(row1).toHaveAttribute('tabIndex', '-1');
  await expect.element(row1).not.toHaveClass(rowActiveClassname);

  await userEvent.click(groupCell1);
  await expect.element(row1).toHaveFocus();
  await expect.element(row1).toHaveAttribute('tabIndex', '0');
  await expect.element(row1).toHaveClass(rowActiveClassname);

  await userEvent.keyboard('{arrowup}');
  await expect.element(topSummaryRow).toHaveFocus();
  await expect.element(topSummaryRow).toHaveAttribute('tabIndex', '0');
  await expect.element(topSummaryRow).toHaveClass(rowActiveClassname);

  // header row does not get focused
  await userEvent.keyboard('{arrowup}');
  await expect.element(headerCheckbox).toHaveFocus();
  await expect.element(headerCheckbox).toHaveAttribute('tabIndex', '0');
  await expect.element(headerRow).not.toHaveClass(rowActiveClassname);

  // header row cannot get focused
  await userEvent.keyboard('{arrowleft}');
  await expect.element(headerCheckbox).toHaveFocus();
  await expect.element(headerCheckbox).toHaveAttribute('tabIndex', '0');
  await expect.element(headerRow).not.toHaveClass(rowActiveClassname);

  await userEvent.keyboard('{arrowdown}');
  await expect.element(topSummaryRow.getCell().nth(0)).toHaveFocus();
  await expect.element(topSummaryRow.getCell().nth(0)).toHaveAttribute('tabIndex', '0');
  await expect.element(topSummaryRow).not.toHaveClass(rowActiveClassname);

  // can focus summary row
  await userEvent.keyboard('{arrowleft}');
  await expect.element(topSummaryRow).toHaveFocus();
  await expect.element(topSummaryRow).toHaveAttribute('tabIndex', '0');
  await expect.element(topSummaryRow).toHaveClass(rowActiveClassname);

  const groupCell2 = page.getCell({ name: '2021' });
  await userEvent.click(groupCell2);
  await expect.element(row3).toHaveFocus();
  await expect.element(row3).toHaveAttribute('tabIndex', '0');

  // focus cell
  const cells = getCellsAtRowIndex(5);
  await userEvent.click(cells.nth(1));
  await expect.element(cells.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect.element(cells.nth(1)).toHaveFocus();
  await expect.element(cells.nth(1)).toHaveAttribute('tabIndex', '0');

  // focus the previous cell
  await userEvent.keyboard('{arrowleft}');
  await expect.element(cells.nth(1)).toHaveAttribute('aria-selected', 'false');
  await expect.element(cells.nth(0)).toHaveAttribute('aria-selected', 'true');

  // if the first cell is focused then arrowleft should focus the row
  await userEvent.keyboard('{arrowleft}');
  await expect.element(cells.nth(0)).toHaveAttribute('aria-selected', 'false');
  await expect.element(rows.nth(4)).toHaveClass(rowActiveClassname);
  await expect.element(rows.nth(4)).toHaveFocus();

  // if the row is focused then arrowright should focus the first cell on the same row
  await userEvent.keyboard('{arrowright}');
  await expect.element(cells.nth(0)).toHaveAttribute('aria-selected', 'true');

  await userEvent.keyboard('{arrowleft}{arrowup}');

  await testRowCount(7);

  // left arrow should collapse the group
  await userEvent.keyboard('{arrowleft}');
  await testRowCount(6);

  // right arrow should expand the group
  await userEvent.keyboard('{arrowright}');
  await testRowCount(7);

  // left arrow on a collapsed group should focus the parent group
  await expect.element(rows.nth(1)).not.toHaveClass(rowActiveClassname);
  await userEvent.keyboard('{arrowleft}{arrowleft}');
  await expect.element(rows.nth(1)).toHaveClass(rowActiveClassname);
  await expect.element(rows.nth(1)).toHaveFocus();

  await userEvent.keyboard('{end}');
  await expect.element(rows.nth(5)).toHaveClass(rowActiveClassname);

  await userEvent.keyboard('{home}');
  await expect.element(headerCheckbox).toHaveFocus();
  await expect.element(headerCheckbox).toHaveAttribute('tabIndex', '0');
  await expect.element(headerRow).not.toHaveClass(rowActiveClassname);

  // collapse parent group
  await userEvent.keyboard('{arrowdown}{arrowdown}{arrowleft}{arrowleft}');
  await expect.element(page.getCell({ name: '2021' })).not.toBeInTheDocument();
  await testRowCount(4);
});

test('copy/paste when grouping is enabled', async () => {
  await setup(['year']);
  await userEvent.click(page.getCell({ name: '2021' }));
  await userEvent.copy();
  expect(onCellCopySpy).not.toHaveBeenCalled();
  await userEvent.paste();
  expect(onCellPasteSpy).not.toHaveBeenCalled();

  await userEvent.click(page.getCell({ name: 'USA' }));
  await userEvent.copy();
  expect(onCellCopySpy).toHaveBeenCalledExactlyOnceWith(
    {
      column: expect.objectContaining(columns[2]),
      row: {
        country: 'USA',
        id: 2,
        year: 2021
      }
    },
    expect.anything()
  );
  await userEvent.paste();
  expect(onCellPasteSpy).toHaveBeenCalledExactlyOnceWith(
    {
      column: expect.objectContaining(columns[2]),
      row: {
        country: 'USA',
        id: 2,
        year: 2021
      }
    },
    expect.anything()
  );
});

test('update row using cell content renderer', async () => {
  await setup(['year']);
  await userEvent.click(page.getCell({ name: '2021' }));
  await userEvent.click(page.getCell({ name: 'USA' }));
  await userEvent.keyboard('{arrowright}{arrowright}');
  await expect.element(activeCell).toHaveTextContent('value: 2');
  await userEvent.click(page.getByRole('button', { name: 'value: 2' }));
  await expect.element(activeCell).toHaveTextContent('value: 12');
});

test('onCellKeyDown and onActivePositionChange receive group rows', async () => {
  interface Call {
    rowIdx: number;
    idx: number;
    isGroupRow: boolean;
  }

  const keyDownCalls: Call[] = [];
  const positionChangeCalls: Call[] = [];

  function onCellKeyDown(args: TreeCellKeyDownArgs<Row, SummaryRow>) {
    if (args.mode === 'EDIT') return;
    keyDownCalls.push({
      rowIdx: args.rowIdx,
      idx: args.column?.idx ?? -1,
      isGroupRow: isGroupRow(args.row)
    });
  }

  function onActivePositionChange({
    rowIdx,
    row,
    column
  }: TreePositionChangeArgs<Row, SummaryRow>) {
    positionChangeCalls.push({
      rowIdx,
      idx: column?.idx ?? -1,
      isGroupRow: row !== undefined && isGroupRow(row)
    });
  }

  await page.render(
    <TreeDataGrid<Row, SummaryRow>
      columns={columns}
      rows={initialRows}
      groupBy={['country']}
      expandedGroupIds={new Set(['USA'])}
      onExpandedGroupIdsChange={() => {}}
      onCellKeyDown={onCellKeyDown}
      onActivePositionChange={onActivePositionChange}
    />
  );

  // the rows are: USA (expanded), 1, 2, Canada (collapsed);
  // the columns are: select, country, sport, year, id

  // activate the USA group row, without toggling it
  const usaGroupRow = getRowWithCell(page.getCell({ name: 'USA' }));
  await userEvent.click(usaGroupRow.getCell().nth(2));
  await expect.element(usaGroupRow).toHaveClass(rowActiveClassname);

  // activate the first cell of the group row
  await userEvent.keyboard('{arrowright}');
  await expect.element(usaGroupRow.getCell().nth(0)).toHaveAttribute('aria-selected', 'true');

  // activate a cell of a regular row
  await userEvent.click(page.getCell({ name: '2020' }));
  await expect.element(page.getCell({ name: '2020' })).toHaveAttribute('aria-selected', 'true');
  await userEvent.keyboard('{arrowright}');
  await expect.element(activeCell).toHaveTextContent('value: 1');

  expect(keyDownCalls).toStrictEqual([
    { rowIdx: 0, idx: -1, isGroupRow: true },
    { rowIdx: 1, idx: 3, isGroupRow: false }
  ]);
  expect(positionChangeCalls).toStrictEqual([
    { rowIdx: 0, idx: -1, isGroupRow: true },
    { rowIdx: 0, idx: 0, isGroupRow: true },
    { rowIdx: 1, idx: 3, isGroupRow: false },
    { rowIdx: 1, idx: 4, isGroupRow: false }
  ]);
});

test('custom renderGroupCell', async () => {
  await setup(['country']);
  const usaCell = page.getCell({ name: 'USA' });
  const canadaCell = page.getCell({ name: 'Canada' });
  await expect.element(getRowWithCell(usaCell).getCell().nth(4)).toHaveTextContent('1');
  await expect.element(getRowWithCell(canadaCell).getCell().nth(4)).toHaveTextContent('3');
});

test('adding a top summary row when no rows or cells are active should not focus the summary row', async () => {
  const rows: readonly Row[] = [];

  function Test() {
    const [topSummaryRows, setTopSummaryRows] = useState((): readonly SummaryRow[] => []);

    return (
      <>
        <button
          type="button"
          onClick={() => setTopSummaryRows((topSummaryRows) => [...topSummaryRows, undefined])}
        >
          Add summary row
        </button>
        <TreeDataGrid
          columns={columns}
          rows={rows}
          topSummaryRows={topSummaryRows}
          groupBy={[]}
          expandedGroupIds={new Set()}
          onExpandedGroupIdsChange={() => {}}
        />
      </>
    );
  }

  await page.render(<Test />);
  const addSummaryRowButton = page.getByRole('button', { name: 'Add summary row' });
  const activeRow = page.getBySelector(`.${rowActiveClassname}`);

  await expect.element(activeCell).not.toBeInTheDocument();
  await expect.element(activeRow).not.toBeInTheDocument();

  await userEvent.click(addSummaryRowButton);
  await expect.element(activeCell).not.toBeInTheDocument();
  await expect.element(activeRow).not.toBeInTheDocument();
});
