import { page, userEvent } from 'vitest/browser';

import { DataGrid, SelectColumn } from '../../src';
import type { Column } from '../../src';
import {
  getRowWithCell,
  safeTab,
  scrollGrid,
  setup,
  tabIntoGrid,
  testCount,
  validateCellPosition
} from './utils';

const selectedCell = page.getSelectedCell();

type Row = undefined;

const rows: readonly Row[] = Array.from({ length: 100 });
const topSummaryRows: readonly Row[] = [undefined];
const bottomSummaryRows: readonly Row[] = [undefined, undefined];

const columns: readonly Column<Row, Row>[] = [
  SelectColumn,
  { key: 'col2', name: 'col2' },
  { key: 'col3', name: 'col3' },
  { key: 'col4', name: 'col4' },
  { key: 'col5', name: 'col5' },
  { key: 'col6', name: 'col6' },
  { key: 'col7', name: 'col7' }
];

test('keyboard navigation', async () => {
  await setup({ columns, rows, topSummaryRows, bottomSummaryRows }, true);

  // no initial selection
  await expect.element(selectedCell).not.toBeInTheDocument();

  // tab into the grid
  await tabIntoGrid();
  await validateCellPosition(0, 0);

  // tab to the next cell
  await safeTab();
  await validateCellPosition(1, 0);

  // tab back to the previous cell
  await safeTab(true);
  await validateCellPosition(0, 0);

  // arrow navigation
  await userEvent.keyboard('{arrowdown}');
  await validateCellPosition(0, 1);
  await userEvent.keyboard('{arrowright}');
  await validateCellPosition(1, 1);
  await userEvent.keyboard('{arrowdown}');
  await validateCellPosition(1, 2);
  await userEvent.keyboard('{arrowleft}');
  await validateCellPosition(0, 2);
  await userEvent.keyboard('{arrowup}');
  await validateCellPosition(0, 1);
  await userEvent.keyboard('{arrowup}');
  await validateCellPosition(0, 0);

  // page {up,down}
  await userEvent.keyboard('{PageDown}');
  await validateCellPosition(0, 26);
  await userEvent.keyboard('{PageDown}');
  await validateCellPosition(0, 52);
  await userEvent.keyboard('{PageUp}');
  await validateCellPosition(0, 26);

  // home/end navigation
  await userEvent.keyboard('{end}');
  await validateCellPosition(6, 26);
  await userEvent.keyboard('{home}');
  await validateCellPosition(0, 26);
  await userEvent.keyboard('{Control>}{end}{/Control}');
  await validateCellPosition(6, 103);
  await userEvent.keyboard('{arrowdown}');
  await validateCellPosition(6, 103);
  await userEvent.keyboard('{arrowright}');
  await validateCellPosition(6, 103);
  await userEvent.keyboard('{end}');
  await validateCellPosition(6, 103);
  await userEvent.keyboard('{Control>}{end}{/Control}');
  await validateCellPosition(6, 103);
  await userEvent.keyboard('{PageDown}');
  await validateCellPosition(6, 103);
  await userEvent.keyboard('{Control>}{home}{/Control}');
  await validateCellPosition(0, 0);
  await userEvent.keyboard('{home}');
  await validateCellPosition(0, 0);
  await userEvent.keyboard('{Control>}{home}{/Control}');
  await validateCellPosition(0, 0);
  await userEvent.keyboard('{PageUp}');
  await validateCellPosition(0, 0);

  // tab at the end of a row selects the first cell on the next row
  await userEvent.keyboard('{end}');
  await safeTab();
  await validateCellPosition(0, 1);

  // shift tab should select the last cell of the previous row
  await safeTab(true);
  await validateCellPosition(6, 0);
});

test('arrow and tab navigation', async () => {
  await setup({ columns, rows, bottomSummaryRows }, true);

  // pressing arrowleft on the leftmost cell does nothing
  await tabIntoGrid();
  await userEvent.keyboard('{arrowdown}');
  await validateCellPosition(0, 1);
  await userEvent.keyboard('{arrowleft}');
  await validateCellPosition(0, 1);

  // pressing arrowright on the rightmost cell does nothing
  await userEvent.keyboard('{end}');
  await validateCellPosition(6, 1);
  await userEvent.keyboard('{arrowright}');
  await validateCellPosition(6, 1);

  // pressing tab on the rightmost cell navigates to the leftmost cell on the next row
  await safeTab();
  await validateCellPosition(0, 2);

  // pressing shift+tab on the leftmost cell navigates to the rightmost cell on the previous row
  await safeTab(true);
  await validateCellPosition(6, 1);
});

test('grid enter/exit', async () => {
  await setup<Row, Row>({ columns, rows: Array.from({ length: 5 }), bottomSummaryRows }, true);

  const beforeButton = page.getByRole('button', { name: 'Before' });
  const afterButton = page.getByRole('button', { name: 'After' });

  // no initial selection
  await expect.element(selectedCell).not.toBeInTheDocument();

  // tab into the grid
  await tabIntoGrid();
  await validateCellPosition(0, 0);

  // shift+tab tabs out of the grid if we are at the first cell
  await safeTab(true);
  await expect.element(beforeButton).toHaveFocus();

  await safeTab();
  await validateCellPosition(0, 0);

  await userEvent.keyboard('{arrowdown}{arrowdown}');
  await validateCellPosition(0, 2);

  // tab should select the last selected cell
  // click outside the grid
  await userEvent.click(beforeButton);
  await safeTab();
  await userEvent.keyboard('{arrowdown}');
  await validateCellPosition(0, 3);

  // shift+tab should select the last selected cell
  await userEvent.click(afterButton);
  await safeTab(true);
  await validateCellPosition(0, 3);
  await expect.element(selectedCell.getByRole('checkbox')).toHaveFocus();

  // tab tabs out of the grid if we are at the last cell
  await userEvent.keyboard('{Control>}{end}{/Control}');
  await safeTab();
  await expect.element(afterButton).toHaveFocus();
});

test('navigation with focusable cell renderer', async () => {
  await setup<Row, Row>({ columns, rows: Array.from({ length: 1 }), bottomSummaryRows }, true);
  await tabIntoGrid();
  await userEvent.keyboard('{arrowdown}');
  await validateCellPosition(0, 1);

  // cell should not set tabIndex to 0 if it contains a focusable cell renderer
  await expect.element(selectedCell).toHaveAttribute('tabIndex', '-1');
  const checkbox = selectedCell.getByRole('checkbox');
  await expect.element(checkbox).toHaveFocus();
  await expect.element(checkbox).toHaveAttribute('tabIndex', '0');

  await safeTab();
  await validateCellPosition(1, 1);
  // cell should set tabIndex to 0 if it does not have focusable cell renderer
  await expect.element(selectedCell).toHaveAttribute('tabIndex', '0');
});

test('navigation when header and summary rows have focusable elements', async () => {
  const columns: readonly Column<Row, number>[] = [
    {
      key: 'col2',
      name: 'col2',
      renderHeaderCell(p) {
        return <input data-testid="header-filter1" tabIndex={p.tabIndex} />;
      },
      renderSummaryCell(p) {
        return <input data-testid={`summary-col2-${p.row}`} tabIndex={p.tabIndex} />;
      }
    },
    {
      key: 'col3',
      name: 'col3',
      renderHeaderCell(p) {
        return <input data-testid="header-filter2" tabIndex={p.tabIndex} />;
      },
      renderSummaryCell(p) {
        return <input data-testid={`summary-col3-${p.row}`} tabIndex={p.tabIndex} />;
      }
    }
  ];

  await setup<Row, number>(
    { columns, rows: Array.from({ length: 2 }), bottomSummaryRows: [1, 2] },
    true
  );
  await tabIntoGrid();

  // should set focus on the header filter
  await expect.element(page.getByTestId('header-filter1')).toHaveFocus();

  await safeTab();
  await expect.element(page.getByTestId('header-filter2')).toHaveFocus();

  await safeTab();
  await validateCellPosition(0, 1);

  await safeTab(true);
  await expect.element(page.getByTestId('header-filter2')).toHaveFocus();

  await safeTab(true);
  await expect.element(page.getByTestId('header-filter1')).toHaveFocus();

  await safeTab();
  await safeTab();
  await userEvent.keyboard('{Control>}{end}{/Control}{arrowup}{arrowup}');
  await validateCellPosition(1, 2);

  await safeTab();
  await expect.element(page.getByTestId('summary-col2-1')).toHaveFocus();

  await safeTab();
  await expect.element(page.getByTestId('summary-col3-1')).toHaveFocus();

  await safeTab(true);
  await safeTab(true);
  await validateCellPosition(1, 2);
  await expect.element(selectedCell).toHaveFocus();
});

test('navigation when selected cell not in the viewport', async () => {
  const columns: Column<Row, Row>[] = [SelectColumn];
  const selectedRowCells = getRowWithCell(selectedCell).getCell();
  for (let i = 0; i < 99; i++) {
    columns.push({ key: `col${i}`, name: `col${i}`, frozen: i < 5 });
  }
  await setup({ columns, rows, bottomSummaryRows }, true);
  await tabIntoGrid();
  await validateCellPosition(0, 0);

  await userEvent.keyboard('{Control>}{end}{/Control}{arrowup}{arrowup}');
  await validateCellPosition(99, 100);
  await expect.element(selectedRowCells).not.toHaveLength(1);
  await scrollGrid({ top: 0 });
  await testCount(selectedRowCells, 1);
  await userEvent.keyboard('{arrowup}');
  await validateCellPosition(99, 99);
  await expect.element(selectedRowCells).not.toHaveLength(1);

  await scrollGrid({ left: 0 });
  await userEvent.keyboard('{arrowdown}');
  await validateCellPosition(99, 100);

  await userEvent.keyboard(
    '{home}{arrowright}{arrowright}{arrowright}{arrowright}{arrowright}{arrowright}{arrowright}'
  );
  await validateCellPosition(7, 100);
  await scrollGrid({ left: 2000 });
  await userEvent.keyboard('{arrowleft}');
  await validateCellPosition(6, 100);
});

test('reset selected cell when column is removed', async () => {
  const columns: readonly Column<Row>[] = [
    { key: '1', name: '1' },
    { key: '2', name: '2' }
  ];
  const rows = [undefined, undefined];

  function Test({ columns }: { columns: readonly Column<Row>[] }) {
    return <DataGrid columns={columns} rows={rows} />;
  }

  const { rerender } = await page.render(<Test columns={columns} />);

  await safeTab();
  await userEvent.keyboard('{arrowdown}{arrowright}');
  await validateCellPosition(1, 1);

  await rerender(<Test columns={[columns[0]]} />);

  await expect.element(selectedCell).not.toBeInTheDocument();
});

test('reset selected cell when row is removed', async () => {
  const columns: readonly Column<Row>[] = [
    { key: '1', name: '1' },
    { key: '2', name: '2' }
  ];
  const rows = [undefined, undefined];

  function Test({ rows }: { rows: readonly undefined[] }) {
    return <DataGrid columns={columns} rows={rows} />;
  }

  const { rerender } = await page.render(<Test rows={rows} />);

  await safeTab();
  await userEvent.keyboard('{arrowdown}{arrowdown}{arrowright}');
  await validateCellPosition(1, 2);

  await rerender(<Test rows={[rows[0]]} />);

  await expect.element(selectedCell).not.toBeInTheDocument();
});

test('should not change the left and right arrow behavior for right to left languages', async () => {
  await setup<Row, Row>({ columns, rows, direction: 'rtl' }, true);
  await tabIntoGrid();
  await validateCellPosition(0, 0);
  await safeTab();
  await validateCellPosition(1, 0);
  await userEvent.keyboard('{arrowright}');
  await validateCellPosition(0, 0);
  await userEvent.keyboard('{arrowright}');
  await validateCellPosition(0, 0);
  await userEvent.keyboard('{arrowleft}');
  await validateCellPosition(1, 0);
  await userEvent.keyboard('{arrowleft}');
  await validateCellPosition(2, 0);
});
