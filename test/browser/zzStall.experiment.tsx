// TEMPORARY: WebKit stall experiment, does the page stall while idle after rendering a million rows?
import { page } from 'vite-plus/test/browser';

import { TreeDataGrid } from '../../src';

interface Row {
  id: number;
  country: string;
  year: number;
}

const columns = [
  { key: 'country', name: 'Country' },
  { key: 'id', name: 'Id' }
];

async function renderRows(count: number) {
  const rows = Array.from({ length: count }, (_, id): Row => ({ id, country: 'USA', year: 2020 }));

  await page.render(
    <TreeDataGrid
      columns={columns}
      rows={rows}
      groupBy={['country']}
      expandedGroupIds={new Set(['USA'])}
      onExpandedGroupIdsChange={() => {}}
    />
  );

  await expect.element(page.getTreeGrid()).toHaveAttribute('aria-rowcount', String(count + 2));
  await expect.element(page.getCell({ name: '0', exact: true })).toBeVisible();
}

// vitest-browser-react unmounts the grid before the idle test starts
async function idle(seconds: number) {
  for (let i = 0; i < seconds; i++) {
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }
}

describe.each([1_000_000, 100_000])('%i rows', (count) => {
  it('render', async () => {
    await renderRows(count);
  });

  it('idle for 65s', { timeout: 90_000 }, async () => {
    await idle(65);
  });
});
