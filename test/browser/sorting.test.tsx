import { useState } from 'react';
import { page, userEvent } from 'vitest/browser';

import { DataGrid } from '../../src';
import type { Column, SortColumn } from '../../src/types';

const columns: readonly Column<never>[] = [
  { key: 'colA', name: 'colA' },
  { key: 'colB', name: 'colB', sortDescendingFirst: true },
  { key: 'colC', name: 'colC' },
  { key: 'colD', name: 'colD', sortable: false }
];

function TestGrid() {
  const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);

  return (
    <>
      <DataGrid
        columns={columns}
        rows={[]}
        defaultColumnOptions={{ sortable: true }}
        sortColumns={sortColumns}
        onSortColumnsChange={setSortColumns}
      />
      <div data-testid="sortColumnsValue">{JSON.stringify(sortColumns)}</div>
    </>
  );
}

function setup() {
  return page.render(<TestGrid />);
}

function testSortColumns(expectedValue: readonly SortColumn[]) {
  return expect
    .element(page.getByTestId('sortColumnsValue'))
    .toHaveTextContent(JSON.stringify(expectedValue));
}

test('should not sort if sortable is false', async () => {
  await setup();
  const headerCell = page.getHeaderCell({ name: 'colD' });
  await userEvent.click(headerCell);
  await expect.element(headerCell).not.toHaveAttribute('aria-sort');
  await testSortColumns([]);
});

test('single column sort', async () => {
  await setup();
  const headerCell = page.getHeaderCell({ name: 'colA' });
  await userEvent.click(headerCell);
  await expect.element(headerCell).toHaveAttribute('aria-sort', 'ascending');
  // priority is not shown for single sort
  await expect.element(headerCell).not.toHaveTextContent('1');
  await testSortColumns([{ columnKey: 'colA', direction: 'ASC' }]);
  await userEvent.click(headerCell);
  await expect.element(headerCell).toHaveAttribute('aria-sort', 'descending');
  await testSortColumns([{ columnKey: 'colA', direction: 'DESC' }]);
  await userEvent.click(headerCell);
  await expect.element(headerCell).not.toHaveAttribute('aria-sort');
  await testSortColumns([]);
});

test('multi column sort', async () => {
  await setup();
  const headerCell1 = page.getHeaderCell({ name: 'colA', exact: false });
  const headerCell2 = page.getHeaderCell({ name: 'colB', exact: false });
  const headerCell3 = page.getHeaderCell({ name: 'colC', exact: false });
  await userEvent.click(headerCell1);
  await userEvent.keyboard('{Control>}');
  await userEvent.click(headerCell2);
  await userEvent.click(headerCell3);

  // aria-sort is only added for single sort
  await expect.element(headerCell1).not.toHaveAttribute('aria-sort');
  await expect.element(headerCell1).toHaveTextContent('1'); // priority
  await expect.element(headerCell2).not.toHaveAttribute('aria-sort');
  await expect.element(headerCell2).toHaveTextContent('2');
  await expect.element(headerCell3).not.toHaveAttribute('aria-sort');
  await expect.element(headerCell3).toHaveTextContent('3');
  await testSortColumns([
    { columnKey: 'colA', direction: 'ASC' },
    { columnKey: 'colB', direction: 'DESC' },
    { columnKey: 'colC', direction: 'ASC' }
  ]);

  await userEvent.click(headerCell2);
  await testSortColumns([
    { columnKey: 'colA', direction: 'ASC' },
    { columnKey: 'colB', direction: 'ASC' },
    { columnKey: 'colC', direction: 'ASC' }
  ]);
  await userEvent.click(headerCell2);
  await testSortColumns([
    { columnKey: 'colA', direction: 'ASC' },
    { columnKey: 'colC', direction: 'ASC' }
  ]);
  await expect.element(headerCell3).toHaveTextContent('2');

  // clicking on a column without ctrlKey should remove multisort
  await userEvent.keyboard('{/Control}');
  await userEvent.click(headerCell2);
  await testSortColumns([{ columnKey: 'colB', direction: 'DESC' }]);
  await expect.element(headerCell2).toHaveAttribute('aria-sort');
  await expect.element(headerCell2).not.toHaveTextContent('2');
});

test('multi column sort with metakey', async () => {
  await setup();
  await userEvent.click(page.getHeaderCell({ name: 'colA' }));
  await userEvent.keyboard('{Meta>}');
  await userEvent.click(page.getHeaderCell({ name: 'colB' }));
  await testSortColumns([
    { columnKey: 'colA', direction: 'ASC' },
    { columnKey: 'colB', direction: 'DESC' }
  ]);
});

test('multi column sort with keyboard', async () => {
  await setup();
  const headerCell1 = page.getHeaderCell({ name: 'colA' });
  await userEvent.click(headerCell1);
  await userEvent.keyboard(' {arrowright}{Control>}{enter}');
  await testSortColumns([
    { columnKey: 'colA', direction: 'DESC' },
    { columnKey: 'colB', direction: 'DESC' }
  ]);
});
