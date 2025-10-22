import { useState } from 'react';
import { page, userEvent } from 'vitest/browser';

import {
  Cell,
  DataGrid,
  DataGridDefaultRenderersContext,
  Row as DefaultRow,
  renderSortIcon,
  SelectColumn
} from '../../src';
import type {
  CellRendererProps,
  Column,
  DataGridProps,
  RenderRowProps,
  RenderSortStatusProps,
  SortColumn
} from '../../src';
import { getCell, getHeaderCell, getRowByCellName, setup, testCount, testRowCount } from './utils';

interface Row {
  id: number;
  col1: string;
  col2: string;
}

const noRows: readonly Row[] = [];

const columns: readonly Column<Row>[] = [
  SelectColumn,
  {
    key: 'col1',
    name: 'Column1',
    sortable: true
  },
  {
    key: 'col2',
    name: 'Column2',
    sortable: true
  }
];

function renderGlobalCell(key: React.Key, props: CellRendererProps<Row, unknown>) {
  return <Cell key={key} {...props} className="global" style={{ fontStyle: 'italic' }} />;
}

function renderLocalCell(key: React.Key, props: CellRendererProps<Row, unknown>) {
  return <Cell key={key} {...props} className="local" style={{ fontStyle: 'normal' }} />;
}

function renderGlobalRow(key: React.Key, props: RenderRowProps<Row>) {
  return <DefaultRow key={key} {...props} className="global" />;
}

function renderLocalRow(key: React.Key, props: RenderRowProps<Row>) {
  return <DefaultRow key={key} {...props} className="local" />;
}

function NoRowsFallback() {
  return <div>Local no rows fallback</div>;
}

function NoRowsGlobalFallback() {
  return <div>Global no rows fallback</div>;
}

function renderLocalCheckbox() {
  return <div>Local checkbox</div>;
}

function renderGlobalCheckbox() {
  return <div>Global checkbox</div>;
}

function renderGlobalSortStatus({ sortDirection, priority }: RenderSortStatusProps) {
  return (
    <>
      {renderSortIcon({ sortDirection })}
      <span data-testid="global-sort-priority">{priority}</span>
    </>
  );
}

function renderLocalSortStatus({ sortDirection, priority }: RenderSortStatusProps) {
  return (
    <>
      {renderSortIcon({ sortDirection })}
      <span data-testid="local-sort-priority">{priority}</span>
    </>
  );
}

function TestGrid<R, SR, K extends React.Key>(props: DataGridProps<R, SR, K>) {
  const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);

  return <DataGrid {...props} sortColumns={sortColumns} onSortColumnsChange={setSortColumns} />;
}

function setupContext<R, SR, K extends React.Key>(props: DataGridProps<R, SR, K>) {
  return page.render(
    <DataGridDefaultRenderersContext
      value={{
        noRowsFallback: <NoRowsGlobalFallback />,
        renderCheckbox: renderGlobalCheckbox,
        renderSortStatus: renderGlobalSortStatus,
        renderCell: renderGlobalCell,
        renderRow: renderGlobalRow
      }}
    >
      <TestGrid {...props} />
    </DataGridDefaultRenderersContext>
  );
}

test('fallback defined using renderers prop with no rows', async () => {
  setup({ columns, rows: noRows, renderers: { noRowsFallback: <NoRowsFallback /> } });

  await testRowCount(1);
  await expect.element(page.getByText('Local no rows fallback')).toBeInTheDocument();
});

test('fallback defined using context with no rows', async () => {
  await setupContext({ columns, rows: noRows });

  await testRowCount(1);
  await expect.element(page.getByText('Global no rows fallback')).toBeInTheDocument();
});

test('fallback defined using both context and renderers with no rows', async () => {
  await setupContext({ columns, rows: noRows, renderers: { noRowsFallback: <NoRowsFallback /> } });

  await testRowCount(1);
  await expect.element(page.getByText('Local no rows fallback')).toBeInTheDocument();
});

test('fallback defined using renderers prop with a row', async () => {
  setup({
    columns,
    rows: [{ id: 1, col1: 'value 1', col2: 'value 2' }],
    renderers: { noRowsFallback: <NoRowsFallback /> }
  });

  await testRowCount(2);
  await expect.element(page.getByText('Local no rows fallback')).not.toBeInTheDocument();
});

test('fallback defined using context with a row', async () => {
  await setupContext({ columns, rows: [{ id: 1, col1: 'value 1', col2: 'value 2' }] });

  await testRowCount(2);
  await expect.element(page.getByText('Global no rows fallback')).not.toBeInTheDocument();
});

test('fallback defined using both context and renderers with a row', async () => {
  await setupContext({
    columns,
    rows: [{ id: 1, col1: 'value 1', col2: 'value 2' }],
    renderers: { noRowsFallback: <NoRowsFallback /> }
  });

  await testRowCount(2);
  await expect.element(page.getByText('Global no rows fallback')).not.toBeInTheDocument();
  await expect.element(page.getByText('Local no rows fallback')).not.toBeInTheDocument();
});

test('checkbox defined using renderers prop', async () => {
  setup({ columns, rows: noRows, renderers: { renderCheckbox: renderLocalCheckbox } });

  await testRowCount(1);
  await expect.element(page.getByText('Local checkbox')).toBeInTheDocument();
});

test('checkbox defined using context', async () => {
  await setupContext({ columns, rows: noRows });

  await testRowCount(1);
  await expect.element(page.getByText('Global checkbox')).toBeInTheDocument();
});

test('checkbox defined using both context and renderers', async () => {
  await setupContext({ columns, rows: noRows, renderers: { renderCheckbox: renderLocalCheckbox } });

  await testRowCount(1);
  await expect.element(page.getByText('Local checkbox')).toBeInTheDocument();
  await expect.element(page.getByText('Global checkbox')).not.toBeInTheDocument();
});

test('sortPriority defined using both contexts', async () => {
  await setupContext({ columns, rows: noRows });

  const column1 = getHeaderCell('Column1');
  const column2 = getHeaderCell('Column2');
  await userEvent.click(column1);
  await userEvent.keyboard('{Control>}');
  await userEvent.click(column2);

  const p = page.getByTestId('global-sort-priority');
  await testCount(p, 2);
  await expect.element(p.nth(0)).toHaveTextContent('1');
  await expect.element(p.nth(1)).toHaveTextContent('2');

  await expect.element(page.getByTestId('local-sort-priority')).not.toBeInTheDocument();
});

test('sortPriority defined using both contexts and renderers', async () => {
  await setupContext({
    columns,
    rows: noRows,
    renderers: { renderSortStatus: renderLocalSortStatus }
  });

  const column1 = getHeaderCell('Column1');
  const column2 = getHeaderCell('Column2');
  await userEvent.click(column2);
  await userEvent.keyboard('{Control>}');
  await userEvent.click(column1);

  const p = page.getByTestId('local-sort-priority');
  await testCount(p, 2);
  await expect.element(p.nth(0)).toHaveTextContent('2');
  await expect.element(p.nth(1)).toHaveTextContent('1');

  await expect.element(page.getByTestId('global-sort-priority')).not.toBeInTheDocument();
});

test('renderCell defined using context', async () => {
  await setupContext({ columns, rows: [{ id: 1, col1: 'value 1', col2: 'value 2' }] });

  const cell1 = getCell('value 1');
  const cell2 = getCell('value 2');
  await expect.element(cell1).toHaveClass('global');
  await expect.element(cell1).not.toHaveClass('local');
  await expect.element(cell1).toHaveStyle({ fontStyle: 'italic' });

  await expect.element(cell2).toHaveClass('global');
  await expect.element(cell2).not.toHaveClass('local');
  await expect.element(cell2).toHaveStyle({ fontStyle: 'italic' });
});

test('renderCell defined using both contexts and renderers', async () => {
  await setupContext({
    columns,
    rows: [{ id: 1, col1: 'value 1', col2: 'value 2' }],
    renderers: { renderCell: renderLocalCell }
  });

  const cell1 = getCell('value 1');
  const cell2 = getCell('value 2');
  await expect.element(cell1).toHaveClass('local');
  await expect.element(cell1).not.toHaveClass('global');
  await expect.element(cell1).toHaveStyle({ fontStyle: 'normal' });

  await expect.element(cell2).toHaveClass('local');
  await expect.element(cell2).not.toHaveClass('global');
  await expect.element(cell2).toHaveStyle({ fontStyle: 'normal' });
});

test('renderRow defined using context', async () => {
  await setupContext({ columns, rows: [{ id: 1, col1: 'value 1', col2: 'value 2' }] });

  const row = getRowByCellName('value 1');
  await expect.element(row).toHaveClass('global');
  await expect.element(row).not.toHaveClass('local');
});

test('renderRow defined using both contexts and renderers', async () => {
  await setupContext({
    columns,
    rows: [{ id: 1, col1: 'value 1', col2: 'value 2' }],
    renderers: { renderRow: renderLocalRow }
  });

  const row = getRowByCellName('value 1');
  await expect.element(row).toHaveClass('local');
  await expect.element(row).not.toHaveClass('global');
});
