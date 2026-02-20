import { page, userEvent, type Locator } from 'vitest/browser';
import { css } from 'ecij';

import type { DataGridProps } from '../../src';
import { DataGrid } from '../../src';

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

export function getRowWithCell(cell: Locator) {
  return page.getRow().filter({ has: cell });
}

export function getCellsAtRowIndex(rowIdx: number) {
  return page
    .getRow()
    .and(page.getBySelector(`[aria-rowindex="${rowIdx + 2}"]`))
    .getCell();
}

export async function validateCellPosition(columnIdx: number, rowIdx: number) {
  const cell = page.getSelectedCell();
  const row = page.getRow().or(page.getHeaderRow()).filter({ has: cell });
  await expect.element(cell).toHaveAttribute('aria-colindex', `${columnIdx + 1}`);
  await expect.element(row).toHaveAttribute('aria-rowindex', `${rowIdx + 1}`);
}

export async function scrollGrid(options: ScrollToOptions) {
  page.getGrid().element().scroll(options);
  // let the browser fire the 'scroll' event
  await new Promise(requestAnimationFrame);
}

export async function tabIntoGrid() {
  await userEvent.click(page.getByRole('button', { name: 'Before' }));
  await userEvent.tab();
}

export function testCount(locator: Locator, expectedCount: number) {
  return expect.element(locator).toHaveLength(expectedCount);
}

export function testRowCount(expectedCount: number) {
  return testCount(page.getRow(), expectedCount);
}
