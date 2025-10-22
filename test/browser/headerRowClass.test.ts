import { page } from 'vitest/browser';

import type { Column } from '../../src';
import { headerRowClassname } from '../../src/HeaderRow';
import { setup } from './utils';

interface Row {
  id: number;
}

const columns: readonly Column<Row>[] = [{ key: 'id', name: 'ID' }];
const rows: readonly Row[] = [];

test('headerRowClass is undefined', async () => {
  await setup({
    columns,
    rows,
    headerRowClass: undefined
  });
  const header = page.getByRole('row');
  await expect.element(header).toHaveClass(headerRowClassname, { exact: true });
});

test('headerRowClass is a string', async () => {
  await setup({
    columns,
    rows,
    headerRowClass: 'my-header-row'
  });
  const header = page.getByRole('row');
  await expect.element(header).toHaveClass(`${headerRowClassname} my-header-row`, { exact: true });
});
