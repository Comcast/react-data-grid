import type { Column } from '../../../src';
import { getCells, setup } from '../utils';

interface SummaryRow {
  id: number;
  col1: string;
  col2: string;
}

const columns: readonly Column<never, SummaryRow>[] = [
  {
    key: 'col1',
    name: 'Col1',
    renderSummaryCell(props) {
      return `Summary: ${props.row.id}`;
    }
  },
  {
    key: 'col2',
    name: 'Col2'
  }
];

test('renderSummaryCell', async () => {
  await setup({
    columns,
    rows: [],
    topSummaryRows: [
      { id: 1, col1: 'ab', col2: 'cd' },
      { id: 2, col1: 'ef', col2: 'gh' }
    ],
    bottomSummaryRows: [
      { id: 3, col1: 'ab', col2: 'cd' },
      { id: 4, col1: 'ef', col2: 'gh' }
    ]
  });

  const cells = getCells();
  expect(cells).toHaveLength(8);
  expect(cells[0]).toHaveTextContent('Summary: 1');
  expect(cells[2]).toHaveTextContent('Summary: 2');
  expect(cells[4]).toHaveTextContent('Summary: 3');
  expect(cells[6]).toHaveTextContent('Summary: 4');
  // nothing is rendered when renderSummaryCell is not defined
  expect(cells[1]).toBeEmptyDOMElement();
  expect(cells[3]).toBeEmptyDOMElement();
  expect(cells[5]).toBeEmptyDOMElement();
  expect(cells[7]).toBeEmptyDOMElement();
});
