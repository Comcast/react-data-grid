import { page } from 'vitest/browser';

import { DataGrid, SelectColumn, TreeDataGrid } from '../../src';
import type { Column } from '../../src';
import { testCount } from './utils';

const frozen1: Column<unknown> = {
  key: 'f1',
  name: 'frz1',
  frozen: true
};

const frozen2: Column<unknown> = {
  key: 'f2',
  name: 'frz2',
  frozen: true
};

const standard1: Column<unknown> = {
  key: 's1',
  name: 'std1'
};

const standard2: Column<unknown> = {
  key: 's2',
  name: 'std2'
};

test('column order', async () => {
  const rows: readonly unknown[] = [];

  async function run(columns: readonly Column<unknown>[]) {
    let unmount;
    if (groupBy === undefined) {
      ({ unmount } = await page.render(<DataGrid columns={columns} rows={rows} />));
    } else {
      ({ unmount } = await page.render(
        <TreeDataGrid
          columns={columns}
          rows={rows}
          groupBy={groupBy}
          rowGrouper={() => ({})}
          expandedGroupIds={new Set()}
          onExpandedGroupIdsChange={() => {}}
        />
      ));
    }

    const headerCells = page.getByRole('columnheader');
    await testCount(headerCells, expected.length);
    expect(headerCells.elements().map((c) => c.textContent)).toStrictEqual(expected);
    await unmount();
  }

  let expected: readonly string[] = ['', 'frz1', 'frz2', 'std1', 'std2'];
  let groupBy: readonly string[] | undefined;

  await run([SelectColumn, frozen1, frozen2, standard1, standard2]);
  await run([standard1, standard2, SelectColumn, frozen1, frozen2]);
  await run([standard1, standard2, frozen1, SelectColumn, frozen2]);
  await run([standard1, frozen1, standard2, frozen2, SelectColumn]);

  expected = ['', 'std1', 'frz1', 'frz2', 'std2'];
  groupBy = ['s1'];

  await run([SelectColumn, frozen1, frozen2, standard1, standard2]);
  await run([standard1, standard2, SelectColumn, frozen1, frozen2]);
  await run([standard1, standard2, frozen1, SelectColumn, frozen2]);
  await run([standard1, frozen1, standard2, frozen2, SelectColumn]);

  expected = ['', 'std1', 'frz2', 'frz1', 'std2'];
  groupBy = ['s1', 'f2'];

  await run([SelectColumn, frozen1, frozen2, standard1, standard2]);
  await run([standard1, standard2, SelectColumn, frozen1, frozen2]);
  await run([standard1, standard2, frozen1, SelectColumn, frozen2]);
  await run([standard1, frozen1, standard2, frozen2, SelectColumn]);
});
