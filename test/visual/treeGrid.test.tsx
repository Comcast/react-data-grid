import { page } from 'vitest/browser';

import { SelectColumn, TreeDataGrid, type Column } from '../../src';
import { getTreeGrid } from '../browser/utils';

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
    name: 'Country'
  },
  {
    key: 'year',
    name: 'Year'
  },
  {
    key: 'id',
    name: 'Id',
    renderGroupCell({ childRows }) {
      return Math.min(...childRows.map((c) => c.id));
    }
  }
];

const rows: readonly Row[] = [
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

test('tree grid', async () => {
  await page.render(
    <TreeDataGrid
      rowKeyGetter={rowKeyGetter}
      columns={columns}
      rows={rows}
      topSummaryRows={topSummaryRows}
      bottomSummaryRows={bottomSummaryRows}
      groupBy={['country', 'year']}
      rowGrouper={rowGrouper}
      expandedGroupIds={new Set(['USA', 'USA__2020'])}
      onExpandedGroupIdsChange={() => {}}
    />
  );

  await expect(getTreeGrid()).toMatchScreenshot('tree-grid');
});

function rowKeyGetter(row: Row) {
  return row.id;
}

function rowGrouper(rows: readonly Row[], columnKey: string) {
  // @ts-expect-error
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return Object.groupBy(rows, (r) => r[columnKey]) as Record<string, readonly R[]>;
}
