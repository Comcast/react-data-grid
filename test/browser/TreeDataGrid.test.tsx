import { useState } from 'react';
import { page, userEvent } from 'vitest/browser';

import type { Column } from '../../src';
import { renderTextEditor, SelectColumn, TreeDataGrid } from '../../src';
import { focusSinkClassname } from '../../src/style/core';
import { rowSelected } from '../../src/style/row';
import {
  getCell,
  getCellsAtRowIndex,
  getRowByCell,
  getRowByCellName,
  getRows,
  getSelectAllCheckbox,
  getSelectedCell,
  getTreeGrid,
  testCount,
  testRowCount
} from './utils';

const rowSelectedClassname = 'rdg-row-selected';

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
    renderGroupCell({ childRows }) {
      return Math.min(...childRows.map((c) => c.id));
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

function rowKeyGetter(row: Row) {
  return row.id;
}
function TestGrid({
  groupBy,
  groupIdGetter
}: {
  groupBy: string[];
  groupIdGetter: ((groupKey: string, parentId?: string) => string) | undefined;
}) {
  const [rows, setRows] = useState(initialRows);
  const [selectedRows, setSelectedRows] = useState((): ReadonlySet<number> => new Set());
  const [expandedGroupIds, setExpandedGroupIds] = useState(
    (): ReadonlySet<unknown> => new Set<unknown>([])
  );

  return (
    <TreeDataGrid
      columns={columns}
      rows={rows}
      topSummaryRows={topSummaryRows}
      bottomSummaryRows={bottomSummaryRows}
      rowKeyGetter={rowKeyGetter}
      groupBy={groupBy}
      rowGrouper={rowGrouper}
      selectedRows={selectedRows}
      onSelectedRowsChange={setSelectedRows}
      expandedGroupIds={expandedGroupIds}
      onExpandedGroupIdsChange={setExpandedGroupIds}
      onRowsChange={setRows}
      onCellCopy={onCellCopySpy}
      onCellPaste={onCellPasteSpy}
      groupIdGetter={groupIdGetter}
    />
  );
}

function rowGrouper(rows: readonly Row[], columnKey: string) {
  // @ts-expect-error
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return Object.groupBy(rows, (r) => r[columnKey]) as Record<string, readonly R[]>;
}

function setup(groupBy: string[], groupIdGetter?: (groupKey: string, parentId?: string) => string) {
  return page.render(<TestGrid groupBy={groupBy} groupIdGetter={groupIdGetter} />);
}

async function testHeaderCellsContent(expected: readonly string[]) {
  const headerCells = page.getByRole('columnheader');
  await testCount(headerCells, expected.length);
  const content = headerCells.elements().map((cell) => cell.textContent);
  expect(content).toStrictEqual(expected);
}

test('should not group if groupBy is empty', async () => {
  await setup([]);
  await expect.element(getTreeGrid()).toHaveAttribute('aria-rowcount', '7');
  await testHeaderCellsContent(['', 'Sport', 'Country', 'Year', 'Id']);
  await testRowCount(7);
});

test('should not group if column does not exist', async () => {
  await setup(['abc']);
  await expect.element(getTreeGrid()).toHaveAttribute('aria-rowcount', '7');
  await testRowCount(7);
});

test('should group by single column', async () => {
  await setup(['country']);
  await expect.element(getTreeGrid()).toHaveAttribute('aria-rowcount', '9');
  await testHeaderCellsContent(['', 'Country', 'Sport', 'Year', 'Id']);
  await testRowCount(5);
});

test('should group by multiple columns', async () => {
  await setup(['country', 'year']);
  await expect.element(getTreeGrid()).toHaveAttribute('aria-rowcount', '13');
  await testHeaderCellsContent(['', 'Country', 'Year', 'Sport', 'Id']);
  await testRowCount(5);
});

test('should use groupIdGetter when provided', async () => {
  const groupIdGetter = vi.fn((groupKey: string, parentId?: string) =>
    parentId !== undefined ? `${groupKey}#${parentId}` : groupKey
  );
  await setup(['country', 'year'], groupIdGetter);
  expect(groupIdGetter).toHaveBeenCalled();
  await expect.element(getTreeGrid()).toHaveAttribute('aria-rowcount', '13');
  await testHeaderCellsContent(['', 'Country', 'Year', 'Sport', 'Id']);
  await testRowCount(5);
  groupIdGetter.mockClear();
  await userEvent.click(getCell('USA'));
  await testRowCount(7);
  expect(groupIdGetter).toHaveBeenCalled();
  await userEvent.click(getCell('Canada'));
  await testRowCount(9);
  await userEvent.click(getCell('2020'));
  await testRowCount(10);
});

test('should ignore duplicate groupBy columns', async () => {
  await setup(['year', 'year', 'year']);
  await expect.element(getTreeGrid()).toHaveAttribute('aria-rowcount', '10');
  await testRowCount(6);
});

test('should use groupBy order while grouping', async () => {
  await setup(['year', 'country']);
  await expect.element(getTreeGrid()).toHaveAttribute('aria-rowcount', '14');
  await testHeaderCellsContent(['', 'Year', 'Country', 'Sport', 'Id']);
  await testRowCount(6);
});

test('should toggle group when group cell is clicked', async () => {
  await setup(['year']);
  await testRowCount(6);
  const groupCell = getCell('2021');
  await userEvent.click(groupCell);
  await testRowCount(8);
  await userEvent.click(groupCell);
  await testRowCount(6);
});

test('should toggle group using keyboard', async () => {
  await setup(['year']);
  await testRowCount(6);
  const groupCell = getCell('2021');
  await userEvent.click(groupCell);
  await testRowCount(8);
  // clicking on the group cell selects the row
  await expect.element(getSelectedCell()).not.toBeInTheDocument();
  await expect.element(getRowByCellName('2021')).toHaveClass(rowSelectedClassname);
  await userEvent.keyboard('{arrowright}{arrowright}{enter}');
  await testRowCount(6);
  await userEvent.keyboard('{enter}');
  await testRowCount(8);
});

test('should set aria-attributes', async () => {
  await setup(['year', 'country']);

  const groupRow1 = getRowByCellName('2020');
  await expect.element(groupRow1).toHaveAttribute('aria-level', '1');
  await expect.element(groupRow1).toHaveAttribute('aria-setsize', '3');
  await expect.element(groupRow1).toHaveAttribute('aria-posinset', '1');
  await expect.element(groupRow1).toHaveAttribute('aria-rowindex', '3');
  await expect.element(groupRow1).toHaveAttribute('aria-expanded', 'false');

  const groupCell2 = getCell('2021');
  const groupRow2 = getRowByCell(groupCell2);
  await expect.element(groupRow2).toHaveAttribute('aria-level', '1');
  await expect.element(groupRow2).toHaveAttribute('aria-setsize', '3');
  await expect.element(groupRow2).toHaveAttribute('aria-posinset', '2');
  await expect.element(groupRow2).toHaveAttribute('aria-rowindex', '6');
  await expect.element(groupRow1).toHaveAttribute('aria-expanded', 'false');

  await userEvent.click(groupCell2);
  await expect.element(groupRow2).toHaveAttribute('aria-expanded', 'true');

  const groupCell3 = getCell('Canada');
  const groupRow3 = getRowByCell(groupCell3);
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

  const headerCheckbox = getSelectAllCheckbox();
  await expect.element(headerCheckbox).not.toBeChecked();

  // expand group
  const groupCell1 = getCell('2021');
  await userEvent.click(groupCell1);
  const groupCell2 = getCell('Canada');
  await userEvent.click(groupCell2);

  const selectedRows = page.getByRole('row', { selected: true });
  await testCount(selectedRows, 0);

  // select parent row
  await userEvent.click(getRowByCell(groupCell1).getByRole('checkbox', { name: 'Select Group' }));
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
  const checkbox = getRowByCell(groupCell2).getByRole('checkbox', {
    name: 'Select Group'
  });
  await userEvent.click(checkbox);
  await testCount(selectedRows, 4);

  // unselect child group
  await userEvent.click(checkbox);
  await testCount(selectedRows, 1);

  await userEvent.click(getCell('2020'));
  await userEvent.click(getCell('2022'));

  await userEvent.click(headerCheckbox);
  await testCount(selectedRows, 0);

  await userEvent.click(headerCheckbox);
  await testCount(selectedRows, 8);

  await userEvent.click(headerCheckbox);
  await testCount(selectedRows, 0);
});

test('cell navigation in a treegrid', async () => {
  await setup(['country', 'year']);
  await testRowCount(5);
  const focusSink = page.getBySelector(`.${focusSinkClassname}`);

  // expand group
  const groupCell1 = getCell('USA');
  await expect.element(document.body).toHaveFocus();
  await expect.element(focusSink).toHaveAttribute('tabIndex', '-1');
  await userEvent.click(groupCell1);
  await expect.element(focusSink).toHaveFocus();
  await expect.element(focusSink).toHaveAttribute('tabIndex', '0');
  await expect.element(focusSink).toHaveStyle('grid-row-start:3');
  await expect.element(focusSink).toHaveClass(rowSelected);
  await userEvent.keyboard('{arrowup}');
  await expect.element(focusSink).toHaveFocus();
  await expect.element(focusSink).toHaveStyle('grid-row-start:2');
  await expect.element(focusSink).toHaveClass(rowSelected);
  await userEvent.keyboard('{arrowup}');
  await expect.element(focusSink).toHaveFocus();
  await expect.element(focusSink).toHaveStyle('grid-row-start:1');
  await expect.element(focusSink).toHaveClass(rowSelected);
  await expect.element(focusSink).toHaveFocus();
  await expect.element(focusSink).toHaveStyle('grid-row-start:1');
  await expect.element(focusSink).toHaveClass(rowSelected);
  await userEvent.keyboard('{arrowdown}');
  await expect.element(focusSink).toHaveFocus();
  await expect.element(focusSink).toHaveStyle('grid-row-start:2');
  await expect.element(focusSink).toHaveClass(rowSelected);
  const groupCell2 = getCell('2021');
  await userEvent.click(groupCell2);
  await expect.element(focusSink).toHaveFocus();
  await expect.element(focusSink).toHaveAttribute('tabIndex', '0');

  // select cell
  await userEvent.click(getCellsAtRowIndex(5)[1]);
  await expect.element(getCellsAtRowIndex(5)[1]).toHaveAttribute('aria-selected', 'true');
  await expect.element(focusSink).toHaveAttribute('tabIndex', '-1');

  // select the previous cell
  await userEvent.keyboard('{arrowleft}');
  await expect.element(getCellsAtRowIndex(5)[1]).toHaveAttribute('aria-selected', 'false');
  await expect.element(getCellsAtRowIndex(5)[0]).toHaveAttribute('aria-selected', 'true');

  // if the first cell is selected then arrowleft should select the row
  await userEvent.keyboard('{arrowleft}');
  await expect.element(getCellsAtRowIndex(5)[0]).toHaveAttribute('aria-selected', 'false');
  await expect.element(getRows()[4]).toHaveClass(rowSelectedClassname);
  await expect.element(focusSink).toHaveFocus();

  // if the row is selected then arrowright should select the first cell on the same row
  await userEvent.keyboard('{arrowright}');
  await expect.element(getCellsAtRowIndex(5)[0]).toHaveAttribute('aria-selected', 'true');

  await userEvent.keyboard('{arrowleft}{arrowup}');

  await testRowCount(8);

  // left arrow should collapse the group
  await userEvent.keyboard('{arrowleft}');
  await testRowCount(7);

  // right arrow should expand the group
  await userEvent.keyboard('{arrowright}');
  await testRowCount(8);

  // left arrow on a collapsed group should select the parent group
  await expect.element(getRows()[1]).not.toHaveClass(rowSelectedClassname);
  await userEvent.keyboard('{arrowleft}{arrowleft}');
  await expect.element(getRows()[1]).toHaveClass(rowSelectedClassname);

  await userEvent.keyboard('{end}');
  await expect.element(getRows()[5]).toHaveClass(rowSelectedClassname);

  await userEvent.keyboard('{home}');
  await expect.element(page.getByRole('row').nth(0)).toHaveClass(rowSelectedClassname);

  // collpase parent group
  await userEvent.keyboard('{arrowdown}{arrowdown}{arrowleft}');
  await expect.element(getCell('2021')).not.toBeInTheDocument();
  await testRowCount(5);
});

test('copy/paste when grouping is enabled', async () => {
  await setup(['year']);
  await userEvent.click(getCell('2021'));
  await userEvent.copy();
  expect(onCellCopySpy).not.toHaveBeenCalled();
  await userEvent.paste();
  expect(onCellPasteSpy).not.toHaveBeenCalled();

  await userEvent.click(getCell('USA'));
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

test('update row using cell renderer', async () => {
  await setup(['year']);
  await userEvent.click(getCell('2021'));
  await userEvent.click(getCell('USA'));
  await userEvent.keyboard('{arrowright}{arrowright}');
  await expect.element(getSelectedCell()).toHaveTextContent('value: 2');
  await userEvent.click(page.getByRole('button', { name: 'value: 2' }));
  await expect.element(getSelectedCell()).toHaveTextContent('value: 12');
});

test('custom renderGroupCell', async () => {
  await setup(['country']);
  await expect.element(getRowByCellName('USA').getByRole('gridcell').nth(4)).toHaveTextContent('1');
  await expect
    .element(getRowByCellName('Canada').getByRole('gridcell').nth(4))
    .toHaveTextContent('3');
});
