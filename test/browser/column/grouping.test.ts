import { page, userEvent } from 'vitest/browser';

import type { ColumnOrColumnGroup } from '../../../src';
import { setup, tabIntoGrid, testCount, validateCellPosition } from '../utils';

const grid = page.getGrid();
const headerRows = grid.getHeaderRow();
const headerCells = grid.getHeaderCell();

const columns: readonly ColumnOrColumnGroup<NonNullable<unknown>>[] = [
  { key: 'col1', name: 'col 1' },
  {
    name: 'group 1',
    children: [
      { key: 'col2', name: 'col 2' },
      { key: 'col3', name: 'col 3' }
    ]
  },
  { key: 'col4', name: 'col 4' },
  { name: 'empty group', children: [] },
  {
    name: 'deep empty group',
    children: [
      {
        name: '',
        children: [
          {
            name: '',
            children: [
              { name: '', children: [{ name: '', children: [{ name: '', children: [] }] }] }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'empty group',
    children: [
      { name: 'empty subgroup', children: [] },
      { name: 'empty subgroup', children: [] },
      { name: 'empty subgroup', children: [] }
    ]
  },
  {
    name: 'group 2',
    children: [
      {
        name: 'subgroup 2-1',
        children: [
          {
            name: 'empty subgroup',
            children: [
              { name: 'empty subgroup', children: [] },
              { name: 'empty subgroup', children: [] },
              { name: 'empty subgroup', children: [] }
            ]
          },
          {
            name: 'subgroup 2-1-1',
            children: [{ key: 'col5', name: 'col 5' }]
          }
        ]
      },
      { key: 'col6', name: 'col 6' },
      { key: 'col7', name: 'col 7' },
      {
        name: 'subgroup 2-2',
        children: [{ key: 'col8', name: 'col 8' }]
      }
    ]
  },
  {
    name: 'group 3',
    children: [
      { key: 'col9', name: 'col 9' },
      {
        name: 'subgroup 3-1',
        children: [
          {
            name: 'subgroup 3-1-1',
            children: [
              { key: 'col10', name: 'col 10' },
              { key: 'col11', name: 'col 11' }
            ]
          }
        ]
      },
      { key: 'col12', name: 'col 12' }
    ]
  }
];

test('grouping', async () => {
  await setup({ columns, rows: [{}] });

  await expect.element(grid).toHaveAttribute('aria-colcount', '12');
  await expect.element(grid).toHaveAttribute('aria-rowcount', '5');

  await testCount(headerRows, 4);

  await expect.element(headerRows.nth(0)).toHaveAttribute('aria-rowindex', '1');
  await expect.element(headerRows.nth(1)).toHaveAttribute('aria-rowindex', '2');
  await expect.element(headerRows.nth(2)).toHaveAttribute('aria-rowindex', '3');
  await expect.element(headerRows.nth(3)).toHaveAttribute('aria-rowindex', '4');

  await testCount(headerRows.nth(0).getHeaderCell(), 2);
  await testCount(headerRows.nth(1).getHeaderCell(), 2);
  await testCount(headerRows.nth(2).getHeaderCell(), 4);
  await testCount(headerRows.nth(3).getHeaderCell(), 12);

  await testCount(headerCells, 20);

  const expected = [
    {
      colIndex: '5',
      colSpan: '4',
      rowSpan: '1',
      text: 'group 2'
    },
    {
      colIndex: '9',
      colSpan: '4',
      rowSpan: '1',
      text: 'group 3'
    },
    {
      colIndex: '5',
      colSpan: '1',
      rowSpan: '1',
      text: 'subgroup 2-1'
    },
    {
      colIndex: '10',
      colSpan: '2',
      rowSpan: '1',
      text: 'subgroup 3-1'
    },
    {
      colIndex: '2',
      colSpan: '2',
      rowSpan: '3',
      text: 'group 1'
    },
    {
      colIndex: '5',
      colSpan: '1',
      rowSpan: '1',
      text: 'subgroup 2-1-1'
    },
    {
      colIndex: '8',
      colSpan: '1',
      rowSpan: '2',
      text: 'subgroup 2-2'
    },
    {
      colIndex: '10',
      colSpan: '2',
      rowSpan: '1',
      text: 'subgroup 3-1-1'
    },
    {
      colIndex: '1',
      colSpan: null,
      rowSpan: '4',
      text: 'col 1'
    },
    {
      colIndex: '2',
      colSpan: null,
      rowSpan: '1',
      text: 'col 2'
    },
    {
      colIndex: '3',
      colSpan: null,
      rowSpan: '1',
      text: 'col 3'
    },
    {
      colIndex: '4',
      colSpan: null,
      rowSpan: '4',
      text: 'col 4'
    },
    {
      colIndex: '5',
      colSpan: null,
      rowSpan: '1',
      text: 'col 5'
    },
    {
      colIndex: '6',
      colSpan: null,
      rowSpan: '3',
      text: 'col 6'
    },
    {
      colIndex: '7',
      colSpan: null,
      rowSpan: '3',
      text: 'col 7'
    },
    {
      colIndex: '8',
      colSpan: null,
      rowSpan: '1',
      text: 'col 8'
    },
    {
      colIndex: '9',
      colSpan: null,
      rowSpan: '3',
      text: 'col 9'
    },
    {
      colIndex: '10',
      colSpan: null,
      rowSpan: '1',
      text: 'col 10'
    },
    {
      colIndex: '11',
      colSpan: null,
      rowSpan: '1',
      text: 'col 11'
    },
    {
      colIndex: '12',
      colSpan: null,
      rowSpan: '3',
      text: 'col 12'
    }
  ] as const;

  await testCount(headerCells, expected.length);

  for (const [n, item] of expected.entries()) {
    const cell = headerCells.nth(n);
    await expect.element(cell).toHaveTextContent(item.text);
    await expect.element(cell).toHaveAttribute('aria-colindex', item.colIndex);
    if (item.colSpan == null) {
      // eslint-disable-next-line vitest/no-conditional-expect
      await expect.element(cell).not.toHaveAttribute('aria-colspan');
    } else {
      // eslint-disable-next-line vitest/no-conditional-expect
      await expect.element(cell).toHaveAttribute('aria-colspan', item.colSpan);
    }
    await expect.element(cell).toHaveAttribute('aria-rowspan', item.rowSpan);
  }
});

test('keyboard navigation', async () => {
  await setup({ columns, rows: [{}] }, true);

  // no initial selection
  await expect.element(grid.getSelectedCell()).not.toBeInTheDocument();

  await tabIntoGrid();
  await validateCellPosition(0, 3);

  // arrow navigation
  await userEvent.keyboard('{arrowup}');
  await validateCellPosition(0, 3);
  await userEvent.keyboard('{arrowright}');
  await validateCellPosition(1, 3);
  await userEvent.keyboard('{arrowup}');
  await validateCellPosition(1, 2);
  await userEvent.keyboard('{arrowup}');
  await validateCellPosition(1, 2);
  await userEvent.keyboard('{arrowleft}');
  await validateCellPosition(0, 3);
  await userEvent.keyboard('{arrowright}{arrowright}');
  await validateCellPosition(2, 3);
  await userEvent.keyboard('{arrowup}');
  await validateCellPosition(1, 2);
  await userEvent.keyboard('{arrowdown}');
  await validateCellPosition(1, 3);
  await userEvent.keyboard('{arrowright}{arrowright}');
  await validateCellPosition(3, 3);
  await userEvent.keyboard('{arrowright}');
  await validateCellPosition(4, 3);
  await userEvent.keyboard('{arrowdown}');
  await validateCellPosition(4, 4);
  await userEvent.keyboard('{arrowup}');
  await validateCellPosition(4, 3);
  await userEvent.keyboard('{arrowup}');
  await validateCellPosition(4, 2);
  await userEvent.keyboard('{arrowup}');
  await validateCellPosition(4, 1);
  await userEvent.keyboard('{arrowup}');
  await validateCellPosition(4, 0);
  await userEvent.keyboard('{arrowdown}');
  await validateCellPosition(4, 1);
  await userEvent.keyboard('{arrowright}');
  await validateCellPosition(5, 3);
  await userEvent.keyboard('{arrowleft}');
  await validateCellPosition(4, 3);
  await userEvent.keyboard('{arrowup}');
  await validateCellPosition(4, 2);
  await userEvent.keyboard('{arrowright}');
  await validateCellPosition(5, 3);
  await userEvent.keyboard('{arrowright}');
  await validateCellPosition(6, 3);
  await userEvent.keyboard('{arrowright}');
  await validateCellPosition(7, 3);
  await userEvent.keyboard('{arrowup}');
  await validateCellPosition(7, 2);
  await userEvent.keyboard('{arrowup}');
  await validateCellPosition(4, 0);
  await userEvent.keyboard('{arrowright}');
  await validateCellPosition(8, 0);
  await userEvent.keyboard('{arrowleft}');
  await validateCellPosition(4, 0);

  // home/end navigation
  await userEvent.keyboard('{home}');
  await validateCellPosition(0, 3);
  await userEvent.keyboard('{end}');
  await validateCellPosition(11, 3);
  await userEvent.keyboard('{arrowleft}');
  await validateCellPosition(10, 3);

  // tab navigation
  await userEvent.tab();
  await validateCellPosition(11, 3);
  await userEvent.tab({ shift: true });
  await userEvent.tab({ shift: true });
  await userEvent.tab({ shift: true });
  await validateCellPosition(8, 3);
  await userEvent.keyboard('{arrowup}');
  await userEvent.tab({ shift: true });
  await validateCellPosition(4, 0);
  await userEvent.tab();
  await validateCellPosition(8, 0);

  await userEvent.keyboard('{home}{end}');
  await userEvent.tab();
  await validateCellPosition(0, 4);
  await userEvent.tab({ shift: true });
  await validateCellPosition(11, 3);
});
