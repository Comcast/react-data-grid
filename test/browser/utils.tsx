import { css } from 'ecij';
import { page, userEvent, type Locator } from 'vitest/browser';

import { DataGrid } from '../../src';
import type { DataGridProps } from '../../src';

export function setup<R, SR, K extends React.Key = React.Key>(
  props: DataGridProps<R, SR, K>,
  renderBeforeAfterButtons = false
) {
  const grid = (
    <DataGrid
      {...props}
      className={css`
        block-size: 1080px;
        scrollbar-width: none;
      `}
    />
  );

  if (renderBeforeAfterButtons) {
    return page.render(
      <>
        <button type="button">Before</button>
        {grid}
        <br />
        <button type="button">After</button>
      </>
    );
  }
  return page.render(grid);
}

export function getGrid() {
  return page.getByRole('grid');
}

export function getTreeGrid() {
  return page.getByRole('treegrid');
}

export function getHeaderCell(name: string, exact = true) {
  return page.getByRole('columnheader', { name, exact });
}

export function getHeaderCellsNew(...names: readonly string[]) {
  return names.map((name) => getHeaderCell(name));
}

export function getRowByCell(cell: Locator) {
  return page.getByRole('row').filter({ has: cell });
}

export function getRowByCellName(cell: string) {
  return getRowByCell(getCell(cell));
}

export function getCell(name: string) {
  return page.getByRole('gridcell', { name, exact: true });
}

export function getCellsNew(...names: readonly string[]) {
  return names.map(getCell);
}

export function getSelectAllCheckbox() {
  return page.getByRole('checkbox', { name: 'Select All' });
}

export function getRows() {
  return page.getByRole('row').elements().slice(1);
}

export function getRowsNew() {
  return page.getByRole('row');
}

export function getCellsAtRowIndex(rowIdx: number) {
  return Array.from(
    document.querySelectorAll<HTMLDivElement>(`[aria-rowindex="${rowIdx + 2}"] > .rdg-cell`)
  );
}

export function getCells() {
  return page.getByRole('gridcell').elements();
}

export function getHeaderCells() {
  return page.getByRole('columnheader').elements();
}

export function getSelectedCell() {
  return page
    .getByRole('gridcell', { selected: true })
    .or(page.getByRole('columnheader', { selected: true }))
    .first();
}

export async function validateCellPosition(columnIdx: number, rowIdx: number) {
  const cell = getSelectedCell();
  await expect.element(cell).toHaveAttribute('aria-colindex', `${columnIdx + 1}`);
  await expect
    .element(page.getByRole('row').filter({ has: cell }))
    .toHaveAttribute('aria-rowindex', `${rowIdx + 1}`);
}

export async function scrollGrid({
  scrollLeft,
  scrollTop
}: {
  scrollLeft?: number;
  scrollTop?: number;
}) {
  const grid = getGrid().element();

  if (scrollLeft !== undefined) {
    grid.scrollLeft = scrollLeft;
  }
  if (scrollTop !== undefined) {
    grid.scrollTop = scrollTop;
  }

  if (scrollLeft !== undefined || scrollTop !== undefined) {
    // let the browser fire the 'scroll' event
    await new Promise(requestAnimationFrame);
  }
}

export async function tabIntoGrid() {
  await userEvent.click(page.getByRole('button', { name: 'Before' }));
  await userEvent.tab();
}

export function testCount(locator: Locator, expectedCount: number) {
  return expect.poll(() => locator.elements()).toHaveLength(expectedCount);
}

export function testRowCount(expectedLength: number) {
  return testCount(getRowsNew(), expectedLength);
}
