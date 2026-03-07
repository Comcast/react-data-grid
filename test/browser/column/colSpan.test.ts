import { page, userEvent } from 'vitest/browser';

import type { Column } from '../../../src';
import { safeTab, setup } from '../utils';

const headerCells = page.getHeaderCell();

describe('colSpan', () => {
  function setupColSpan(colCount = 15) {
    type Row = number;
    const columns: Column<Row, Row>[] = [];
    const rows: readonly Row[] = Array.from({ length: 10 }, (_, i) => i);

    for (let i = 0; i < colCount; i++) {
      const key = String(i);
      columns.push({
        key,
        name: key,
        width: 80,
        frozen: i < 5,
        colSpan(args) {
          if (args.type === 'ROW') {
            if (key === '2' && args.row === 2) return 3;
            if (key === '4' && args.row === 4) return 6; // Will not work as colspan includes both frozen and regular columns
            if (key === '0' && args.row === 5) return 5;
            if (key === `${colCount - 3}` && args.row === 8) return 3;
            if (key === '6' && args.row < 8) return 2;
          }
          if (args.type === 'HEADER' && key === '8') {
            return 3;
          }
          if (args.type === 'SUMMARY' && key === '7' && args.row === 1) {
            return 2;
          }
          return undefined;
        }
      });
    }
    return setup({ columns, rows, bottomSummaryRows: [1, 2], topSummaryRows: [1, 2] });
  }

  it('should merges cells', async () => {
    await setupColSpan();
    // header
    await expect.element(headerCells).toHaveLength(13);

    // top summary rows
    const topSummarryRow1 = page.getCellsAtRowIndex(0);
    await expect.element(topSummarryRow1).toHaveLength(14);
    // 7th-8th cells are merged
    await expect.element(topSummarryRow1.nth(7)).toHaveAttribute('aria-colindex', '8');
    await expect.element(topSummarryRow1.nth(7)).toHaveAttribute('aria-colspan', '2');
    await expect.element(topSummarryRow1.nth(7)).toHaveStyle({
      gridColumnStart: '8',
      gridColumnEnd: '10'
    });
    await expect.element(page.getCellsAtRowIndex(1)).toHaveLength(15);

    // rows
    const row1 = page.getCellsAtRowIndex(3);
    await expect.element(row1).toHaveLength(14);
    // 7th-8th cells are merged
    await expect.element(row1.nth(6)).toHaveAttribute('aria-colindex', '7');
    await expect.element(row1.nth(6)).toHaveAttribute('aria-colspan', '2');
    await expect.element(row1.nth(6)).toHaveStyle({
      gridTemplateColumns: '7',
      gridColumnEnd: '9'
    });
    await expect.element(row1.nth(7)).toHaveAttribute('aria-colindex', '9');
    await expect.element(row1.nth(7)).not.toHaveAttribute('aria-colspan');

    // 3rd-5th, 7th-8th cells are merged
    const row2 = page.getCellsAtRowIndex(4);
    await expect.element(row2).toHaveLength(12);
    await expect.element(row2.nth(2)).toHaveAttribute('aria-colindex', '3');
    await expect.element(row2.nth(2)).toHaveStyle({
      gridColumnStart: '3',
      gridColumnEnd: '6'
    });
    await expect.element(row2.nth(2)).toHaveAttribute('aria-colspan', '3');
    await expect.element(row2.nth(3)).toHaveAttribute('aria-colindex', '6');
    await expect.element(row2.nth(4)).toHaveAttribute('aria-colindex', '7');
    await expect.element(row2.nth(4)).toHaveStyle({
      gridColumnStart: '7',
      gridColumnEnd: '9'
    });
    await expect.element(row2.nth(5)).toHaveAttribute('aria-colindex', '9');

    await expect.element(page.getCellsAtRowIndex(6)).toHaveLength(14); // colSpan 6 won't work as there are 5 frozen columns
    await expect.element(page.getCellsAtRowIndex(7)).toHaveLength(10);

    // bottom summary row
    await expect.element(page.getCellsAtRowIndex(12)).toHaveLength(14);
    await expect.element(page.getCellsAtRowIndex(13)).toHaveLength(15);
  });

  it('should navigate between merged cells', async () => {
    await setupColSpan();
    // header row
    await userEvent.click(headerCells.nth(7));
    await expect.element(page.getActiveCell()).toHaveCellPosition(7, 0);
    await userEvent.keyboard('{arrowright}');
    await expect.element(page.getActiveCell()).toHaveCellPosition(8, 0);
    await userEvent.keyboard('{arrowright}');
    await expect.element(page.getActiveCell()).toHaveCellPosition(11, 0);
    await userEvent.keyboard('{arrowright}');
    await expect.element(page.getActiveCell()).toHaveCellPosition(12, 0);
    await userEvent.keyboard('{arrowleft}{arrowleft}{arrowleft}');
    await expect.element(page.getActiveCell()).toHaveCellPosition(7, 0);

    // top summary rows
    await userEvent.click(page.getCellsAtRowIndex(0).nth(6));
    await expect.element(page.getActiveCell()).toHaveCellPosition(6, 1);
    await userEvent.keyboard('{arrowright}');
    await expect.element(page.getActiveCell()).toHaveCellPosition(7, 1);
    await userEvent.keyboard('{arrowright}');
    await expect.element(page.getActiveCell()).toHaveCellPosition(9, 1);
    await userEvent.keyboard('{arrowright}');
    await expect.element(page.getActiveCell()).toHaveCellPosition(10, 1);
    await userEvent.keyboard('{arrowleft}{arrowleft}{arrowleft}');
    await expect.element(page.getActiveCell()).toHaveCellPosition(6, 1);

    // viewport rows
    await userEvent.click(page.getCellsAtRowIndex(3).nth(1));
    await expect.element(page.getActiveCell()).toHaveCellPosition(1, 4);
    await userEvent.keyboard('{arrowright}');
    await expect.element(page.getActiveCell()).toHaveCellPosition(2, 4);
    await userEvent.keyboard('{arrowright}');
    await expect.element(page.getActiveCell()).toHaveCellPosition(3, 4);
    await userEvent.keyboard('{arrowdown}');
    await expect.element(page.getActiveCell()).toHaveCellPosition(2, 5);
    await userEvent.keyboard('{arrowleft}');
    await expect.element(page.getActiveCell()).toHaveCellPosition(1, 5);
    await userEvent.keyboard('{arrowright}');
    await expect.element(page.getActiveCell()).toHaveCellPosition(2, 5);
    await userEvent.keyboard('{arrowright}');
    await expect.element(page.getActiveCell()).toHaveCellPosition(5, 5);
    await userEvent.keyboard('{arrowleft}');
    await expect.element(page.getActiveCell()).toHaveCellPosition(2, 5);
    await userEvent.keyboard('{arrowdown}');
    await expect.element(page.getActiveCell()).toHaveCellPosition(2, 6);
    await userEvent.keyboard('{arrowdown}{arrowdown}');
    await expect.element(page.getActiveCell()).toHaveCellPosition(0, 8);
    await userEvent.keyboard('{arrowLeft}');
    await expect.element(page.getActiveCell()).toHaveCellPosition(0, 8);
    await userEvent.keyboard('{arrowright}');
    await expect.element(page.getActiveCell()).toHaveCellPosition(5, 8);
    await safeTab(true);
    await safeTab(true);
    await expect.element(page.getActiveCell()).toHaveCellPosition(14, 7);
    await safeTab();
    await expect.element(page.getActiveCell()).toHaveCellPosition(0, 8);
    await userEvent.click(page.getCellsAtRowIndex(10).nth(11));
    await expect.element(page.getActiveCell()).toHaveCellPosition(11, 11);
    await safeTab();
    await expect.element(page.getActiveCell()).toHaveCellPosition(12, 11);
    await safeTab();
    await expect.element(page.getActiveCell()).toHaveCellPosition(0, 12);
    await safeTab(true);
    await expect.element(page.getActiveCell()).toHaveCellPosition(12, 11);

    // bottom summary rows
    await userEvent.click(page.getCellsAtRowIndex(12).nth(6));
    await expect.element(page.getActiveCell()).toHaveCellPosition(6, 13);
    await userEvent.keyboard('{arrowright}');
    await expect.element(page.getActiveCell()).toHaveCellPosition(7, 13);
    await userEvent.keyboard('{arrowright}');
    await expect.element(page.getActiveCell()).toHaveCellPosition(9, 13);
    await userEvent.keyboard('{arrowright}');
    await expect.element(page.getActiveCell()).toHaveCellPosition(10, 13);
    await userEvent.keyboard('{arrowleft}{arrowleft}{arrowleft}');
    await expect.element(page.getActiveCell()).toHaveCellPosition(6, 13);
  });

  it('should scroll to the merged cell when selected', async () => {
    await setupColSpan(30);
    await userEvent.click(page.getCellsAtRowIndex(10).nth(23)); // last visible cell (1920/80)
    const spy = vi.spyOn(window.HTMLElement.prototype, 'scrollIntoView');
    const testScrollIntoView = () => {
      expect(spy).toHaveBeenCalled();
      spy.mockClear();
    };
    await navigate(3);
    testScrollIntoView();
    await navigate(1);
    testScrollIntoView(); // should bring the merged cell into view
    await expect.element(page.getActiveCell()).toHaveCellPosition(27, 11);
    await navigate(7);
    testScrollIntoView();
    await expect.element(page.getActiveCell()).toHaveCellPosition(6, 12); // should navigate to the next row
    await navigate(7, true);
    testScrollIntoView();
    await expect.element(page.getActiveCell()).toHaveCellPosition(27, 11); // should navigate to the previous row
    await navigate(27);
    testScrollIntoView();
    await navigate(1);
    testScrollIntoView(); // should only bring 1 cell into view

    async function navigate(count: number, shift = false) {
      for (let i = 0; i < count; i++) {
        await safeTab(shift);
      }
    }
  });
});
