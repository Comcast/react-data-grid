import { page, userEvent } from 'vite-plus/test/browser';

import type { Column, ColumnFrozen, ColumnOrColumnGroup } from '../../../src';
import { getCellsAtRowIndex, safeTab, scrollGrid, setup, validateCellPosition } from '../utils';

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

  it('should merge cells', async () => {
    await setupColSpan();
    // header
    await expect.element(headerCells).toHaveLength(13);

    // top summary rows
    const topSummaryRow1 = getCellsAtRowIndex(0);
    await expect.element(topSummaryRow1).toHaveLength(14);
    // 8th-9th cells are merged
    await expect.element(topSummaryRow1.nth(7)).toHaveAttribute('aria-colindex', '8');
    await expect.element(topSummaryRow1.nth(7)).toHaveAttribute('aria-colspan', '2');
    await expect.element(topSummaryRow1.nth(7)).toHaveStyle({
      gridColumnStart: '8',
      gridColumnEnd: '10'
    });
    await expect.element(getCellsAtRowIndex(1)).toHaveLength(15);

    // rows
    const row1 = getCellsAtRowIndex(3);
    await expect.element(row1).toHaveLength(14);
    // 7th-8th cells are merged
    await expect.element(row1.nth(6)).toHaveAttribute('aria-colindex', '7');
    await expect.element(row1.nth(6)).toHaveAttribute('aria-colspan', '2');
    await expect.element(row1.nth(6)).toHaveStyle({
      gridColumnStart: '7',
      gridColumnEnd: '9'
    });
    await expect.element(row1.nth(7)).toHaveAttribute('aria-colindex', '9');
    await expect.element(row1.nth(7)).not.toHaveAttribute('aria-colspan');

    // 3rd-5th, 7th-8th cells are merged
    const row2 = getCellsAtRowIndex(4);
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

    await expect.element(getCellsAtRowIndex(6)).toHaveLength(14); // colSpan 6 won't work as there are 5 frozen columns
    await expect.element(getCellsAtRowIndex(7)).toHaveLength(10);

    // bottom summary row
    await expect.element(getCellsAtRowIndex(12)).toHaveLength(14);
    await expect.element(getCellsAtRowIndex(13)).toHaveLength(15);
  });

  it('should navigate between merged cells', async () => {
    await setupColSpan();
    // header row
    await userEvent.click(headerCells.nth(7));
    await validateCellPosition(7, 0);
    await userEvent.keyboard('{arrowright}');
    await validateCellPosition(8, 0);
    await userEvent.keyboard('{arrowright}');
    await validateCellPosition(11, 0);
    await userEvent.keyboard('{arrowright}');
    await validateCellPosition(12, 0);
    await userEvent.keyboard('{arrowleft}{arrowleft}{arrowleft}');
    await validateCellPosition(7, 0);

    // top summary rows
    await userEvent.click(getCellsAtRowIndex(0).nth(6));
    await validateCellPosition(6, 1);
    await userEvent.keyboard('{arrowright}');
    await validateCellPosition(7, 1);
    await userEvent.keyboard('{arrowright}');
    await validateCellPosition(9, 1);
    await userEvent.keyboard('{arrowright}');
    await validateCellPosition(10, 1);
    await userEvent.keyboard('{arrowleft}{arrowleft}{arrowleft}');
    await validateCellPosition(6, 1);

    // viewport rows
    await userEvent.click(getCellsAtRowIndex(3).nth(1));
    await validateCellPosition(1, 4);
    await userEvent.keyboard('{arrowright}');
    await validateCellPosition(2, 4);
    await userEvent.keyboard('{arrowright}');
    await validateCellPosition(3, 4);
    await userEvent.keyboard('{arrowdown}');
    await validateCellPosition(2, 5);
    await userEvent.keyboard('{arrowleft}');
    await validateCellPosition(1, 5);
    await userEvent.keyboard('{arrowright}');
    await validateCellPosition(2, 5);
    await userEvent.keyboard('{arrowright}');
    await validateCellPosition(5, 5);
    await userEvent.keyboard('{arrowleft}');
    await validateCellPosition(2, 5);
    await userEvent.keyboard('{arrowdown}');
    await validateCellPosition(2, 6);
    await userEvent.keyboard('{arrowdown}{arrowdown}');
    await validateCellPosition(0, 8);
    await userEvent.keyboard('{arrowLeft}');
    await validateCellPosition(0, 8);
    await userEvent.keyboard('{arrowright}');
    await validateCellPosition(5, 8);
    await safeTab(true);
    await safeTab(true);
    await validateCellPosition(14, 7);
    await safeTab();
    await validateCellPosition(0, 8);
    await userEvent.click(getCellsAtRowIndex(10).nth(11));
    await validateCellPosition(11, 11);
    await safeTab();
    await validateCellPosition(12, 11);
    await safeTab();
    await validateCellPosition(0, 12);
    await safeTab(true);
    await validateCellPosition(12, 11);

    // bottom summary rows
    await userEvent.click(getCellsAtRowIndex(12).nth(6));
    await validateCellPosition(6, 13);
    await userEvent.keyboard('{arrowright}');
    await validateCellPosition(7, 13);
    await userEvent.keyboard('{arrowright}');
    await validateCellPosition(9, 13);
    await userEvent.keyboard('{arrowright}');
    await validateCellPosition(10, 13);
    await userEvent.keyboard('{arrowleft}{arrowleft}{arrowleft}');
    await validateCellPosition(6, 13);
  });

  it('should call colSpan with header args when navigating to a column group header row', async () => {
    const colSpan = vi.fn(() => undefined);
    const columns: readonly ColumnOrColumnGroup<number, number>[] = [
      {
        name: 'group',
        children: [
          { key: 'col1', name: 'col 1', colSpan },
          { key: 'col2', name: 'col 2' }
        ]
      }
    ];
    await setup({ columns, rows: [1], bottomSummaryRows: [1] });
    await userEvent.click(page.getHeaderCell({ name: 'col 2' }));
    await validateCellPosition(1, 1);
    colSpan.mockClear();
    await userEvent.keyboard('{arrowup}');
    await validateCellPosition(0, 0);
    expect(colSpan).toHaveBeenCalledExactlyOnceWith({ type: 'HEADER' });
  });

  it('should scroll to the merged cell when selected', async () => {
    await setupColSpan(30);
    await userEvent.click(getCellsAtRowIndex(10).nth(23)); // last visible cell (1920/80)
    const spy = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');
    const testScrollIntoView = () => {
      expect(spy).toHaveBeenCalled();
      spy.mockClear();
    };
    await navigate(3);
    testScrollIntoView();
    await navigate(1);
    testScrollIntoView(); // should bring the merged cell into view
    await validateCellPosition(27, 11);
    await navigate(7);
    testScrollIntoView();
    await validateCellPosition(6, 12); // should navigate to the next row
    await navigate(7, true);
    testScrollIntoView();
    await validateCellPosition(27, 11); // should navigate to the previous row
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

  describe('when a cell spans columns outside of the overscan range', () => {
    describe.for(['ROW', 'HEADER', 'SUMMARY'] as const)('in %s rows', (type) => {
      function setupColSpanOutsideOfOverscan(
        spanningColumnIdx: number,
        frozen: (idx: number) => ColumnFrozen
      ) {
        const columns: Column<number, number>[] = Array.from({ length: 40 }, (_, idx) => ({
          key: String(idx),
          name: String(idx),
          width: 100,
          frozen: frozen(idx),
          colSpan(args) {
            return idx === spanningColumnIdx &&
              (args.type === 'HEADER' || (args.type === type && args.row === 0))
              ? 2
              : undefined;
          }
        }));
        return setup({ columns, rows: [0, 1], bottomSummaryRows: [0, 1] });
      }

      // the cells of the row with the spanning cell: the header row, the first row, or the first bottom summary row
      const spanningRowCells =
        type === 'HEADER' ? headerCells : getCellsAtRowIndex(type === 'ROW' ? 0 : 2);
      // the cells of a row without spanning cells
      const otherRowCells = getCellsAtRowIndex(1);

      function getSpanningRowCellAt(idx: number) {
        return spanningRowCells.and(page.getBySelector(`[aria-colindex="${idx + 1}"]`));
      }

      it('should render the columns after an active cell before the viewport', async () => {
        await setupColSpanOutsideOfOverscan(1, () => false);
        await userEvent.click(getSpanningRowCellAt(1));
        scrollGrid({ left: 2000 });

        // the active cell, then the same columns as the other row
        await expect.element(otherRowCells.first()).toHaveAttribute('aria-colindex', '20');
        await expect.element(spanningRowCells.first()).toHaveAttribute('aria-colindex', '2');
        await expect.element(spanningRowCells.first()).toHaveAttribute('aria-colspan', '2');
        await expect.element(spanningRowCells.nth(1)).toHaveAttribute('aria-colindex', '20');
      });

      it('should render the end-frozen columns after an active cell after the viewport', async () => {
        await setupColSpanOutsideOfOverscan(30, (idx) => (idx === 39 ? 'end' : false));
        scrollGrid({ left: 2000 });
        await userEvent.click(getSpanningRowCellAt(30));
        scrollGrid({ left: 0 });

        await expect.element(otherRowCells.first()).toHaveAttribute('aria-colindex', '1');
        await expect.element(spanningRowCells.nth(-2)).toHaveAttribute('aria-colindex', '31');
        await expect.element(spanningRowCells.nth(-2)).toHaveAttribute('aria-colspan', '2');
        await expect.element(spanningRowCells.last()).toHaveAttribute('aria-colindex', '40');
      });

      it('should render the end-frozen columns after the last cell of the overscan range', async () => {
        // the overscan range ends at the 20th column
        await setupColSpanOutsideOfOverscan(19, (idx) => (idx === 39 ? 'end' : false));

        await expect.element(otherRowCells.nth(-2)).toHaveAttribute('aria-colindex', '20');
        await expect.element(spanningRowCells.nth(-2)).toHaveAttribute('aria-colindex', '20');
        await expect.element(spanningRowCells.nth(-2)).toHaveAttribute('aria-colspan', '2');
        await expect.element(spanningRowCells.last()).toHaveAttribute('aria-colindex', '40');
      });
    });
  });
});
