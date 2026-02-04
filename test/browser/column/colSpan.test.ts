import { userEvent } from 'vitest/browser';

import type { Column } from '../../../src';
import { getCellsAtRowIndex, getHeaderCells, setup, validateCellPosition } from '../utils';

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
    expect(getHeaderCells()).toHaveLength(13);

    // top summary rows
    const topSummarryRow1 = getCellsAtRowIndex(0);
    expect(topSummarryRow1).toHaveLength(14);
    // 7th-8th cells are merged
    await expect.element(topSummarryRow1[7]).toHaveAttribute('aria-colindex', '8');
    await expect.element(topSummarryRow1[7]).toHaveAttribute('aria-colspan', '2');
    await expect.element(topSummarryRow1[7]).toHaveStyle({
      gridColumnStart: '8',
      gridColumnEnd: '10'
    });
    expect(getCellsAtRowIndex(1)).toHaveLength(15);

    // rows
    const row1 = getCellsAtRowIndex(3);
    expect(row1).toHaveLength(14);
    // 7th-8th cells are merged
    await expect.element(row1[6]).toHaveAttribute('aria-colindex', '7');
    await expect.element(row1[6]).toHaveAttribute('aria-colspan', '2');
    await expect.element(row1[6]).toHaveStyle({
      gridTemplateColumns: '7',
      gridColumnEnd: '9'
    });
    await expect.element(row1[7]).toHaveAttribute('aria-colindex', '9');
    await expect.element(row1[7]).not.toHaveAttribute('aria-colspan');

    // 3rd-5th, 7th-8th cells are merged
    const row2 = getCellsAtRowIndex(4);
    expect(row2).toHaveLength(12);
    await expect.element(row2[2]).toHaveAttribute('aria-colindex', '3');
    await expect.element(row2[2]).toHaveStyle({
      gridColumnStart: '3',
      gridColumnEnd: '6'
    });
    await expect.element(row2[2]).toHaveAttribute('aria-colspan', '3');
    await expect.element(row2[3]).toHaveAttribute('aria-colindex', '6');
    await expect.element(row2[4]).toHaveAttribute('aria-colindex', '7');
    await expect.element(row2[4]).toHaveStyle({
      gridColumnStart: '7',
      gridColumnEnd: '9'
    });
    await expect.element(row2[5]).toHaveAttribute('aria-colindex', '9');

    expect(getCellsAtRowIndex(6)).toHaveLength(14); // colSpan 6 won't work as there are 5 frozen columns
    expect(getCellsAtRowIndex(7)).toHaveLength(10);

    // bottom summary row
    expect(getCellsAtRowIndex(12)).toHaveLength(14);
    expect(getCellsAtRowIndex(13)).toHaveLength(15);
  });

  it('should navigate between merged cells', async () => {
    await setupColSpan();
    // header row
    await userEvent.click(getHeaderCells()[7]);
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
    await userEvent.click(getCellsAtRowIndex(0)[6]);
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
    await userEvent.click(getCellsAtRowIndex(3)[1]);
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
    await userEvent.tab({ shift: true });
    await userEvent.tab({ shift: true });
    await validateCellPosition(14, 7);
    await userEvent.tab();
    await validateCellPosition(0, 8);
    await userEvent.click(getCellsAtRowIndex(10)[11]);
    await validateCellPosition(11, 11);
    await userEvent.tab();
    await validateCellPosition(12, 11);
    await userEvent.tab();
    await validateCellPosition(0, 12);
    await userEvent.tab({ shift: true });
    await validateCellPosition(12, 11);

    // bottom summary rows
    await userEvent.click(getCellsAtRowIndex(12)[6]);
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

  it('should scroll to the merged cell when selected', async () => {
    await setupColSpan(30);
    await userEvent.click(getCellsAtRowIndex(10)[23]); // last visible cell (1920/80)
    const spy = vi.spyOn(window.HTMLElement.prototype, 'scrollIntoView');
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
        await userEvent.tab({ shift });
      }
    }
  });
});
