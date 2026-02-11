import { page } from 'vitest/browser';

import type { Column } from '../../src';
import { headerRowClassname } from '../../src/HeaderRow';
import { setup } from './utils';

const headerRow = page.getHeaderRow();

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
  await expect.element(headerRow).toHaveClass(headerRowClassname, { exact: true });
});

test('headerRowClass is a string', async () => {
  await setup({
    columns,
    rows,
    headerRowClass: 'my-header-row'
  });
  await expect
    .element(headerRow)
    .toHaveClass(`${headerRowClassname} my-header-row`, { exact: true });
});
