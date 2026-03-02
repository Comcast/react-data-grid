import { page, userEvent, type Locator } from 'vitest/browser';
import { css } from 'ecij';

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
  await new Promise((resolve) => {
    const gridElement = page.getGrid().element() as HTMLElement;
    gridElement.addEventListener('scrollend', resolve, { once: true });
    gridElement.scroll(options);
  });
}

export async function tabIntoGrid() {
  await userEvent.click(page.getByRole('button', { name: 'Before' }));
  await safeTab();
}

export function testCount(locator: Locator, expectedCount: number) {
  return expect.element(locator).toHaveLength(expectedCount);
}

export function testRowCount(expectedCount: number) {
  return testCount(page.getRow(), expectedCount);
}

/**
 * Tabs to the next or previous focusable element.
 * Uses `userEvent.tab({ shift })` under the hood.
 *
 * Ideally, when tabbing moves focus to a browser UI element,
 * we should be able to keep tabbing until we cycle back to an element on the page,
 * by using the following implementation:
 * ```
 * await userEvent.tab({ shift });
 *
 * while (!document.hasFocus()) {
 *   await userEvent.tab({ shift });
 * }
 * ```
 *
 * When focus has moved to a browser UI element, and we call `userEvent.tab()`,
 * under the hood `page.keyboard.press()` is called,
 * the browser then handles tabbing as usual in the context of a browser,
 * but it also handles tabbing within the `page` context, as if the page had focus.
 *
 * This leads to double-focus bugs where the focus is set on both a browser UI element,
 * and an element on the page, in both Chrome and Firefox.
 * In Chrome,
 *   programmatically tabbing will eventually return focus to the page,
 *   with the correct element on the page being focused,
 *   but browser UI elements may still look like they have focus.
 * In Firefox,
 *   programmatically tabbing will cycle through elements on the page,
 *   and focus will be returned to the page, but it is unclear when exactly,
 *   so the focused element on the page may not be the expected one.
 *
 * The fact that Vitest tests run in an iframe probably doesn't help either.
 *
 * And so the solution is to programmatically click on the page to force focus
 * back onto the page, and then tab to the next element.
 *
 * If there is only one element to focus in the page,
 * and you need to blur it, call blur() on the element.
 *
 * @see https://github.com/microsoft/playwright/issues/39268
 * @param shift Whether to tab backwards.
 */
export async function safeTab(shift = false) {
  await userEvent.tab({ shift });

  if (!document.hasFocus()) {
    const button = document.createElement('button');
    button.type = 'button';

    if (shift) {
      document.body.append(button);
    } else {
      document.body.prepend(button);
    }

    // Firefox needs two clicks for some reason
    do {
      await userEvent.click(button);
    } while (!document.hasFocus());

    await userEvent.tab({ shift });

    button.remove();

    if (!document.hasFocus()) {
      throw new Error('safeTab: focus should have returned to the page');
    }
  }
}
