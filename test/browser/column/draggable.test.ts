import { userEvent } from 'vitest/browser';

import type { Column } from '../../../src';
import { getHeaderCellsNew, setup } from '../utils';

const columns: readonly Column<never>[] = [
  {
    key: 'col1',
    name: 'col1'
  },
  {
    key: 'col2',
    name: 'col2',
    draggable: true
  },
  {
    key: 'col3',
    name: 'col3',
    draggable: true
  },
  {
    key: 'col4',
    name: 'col4',
    draggable: true
  }
];

test('draggable columns', async () => {
  const onColumnsReorder = vi.fn();
  await setup({ columns, rows: [], onColumnsReorder });
  const [cell1, cell2, cell3, cell4] = getHeaderCellsNew('col1', 'col2', 'col3', 'col4');

  await expect.element(cell1).not.toHaveAttribute('draggable');
  await expect.element(cell2).toHaveAttribute('draggable');
  await expect.element(cell3).toHaveAttribute('draggable');
  await expect.element(cell4).toHaveAttribute('draggable');

  expect(onColumnsReorder).not.toHaveBeenCalled();

  await userEvent.dragAndDrop(cell2, cell4);
  expect(onColumnsReorder).toHaveBeenCalledExactlyOnceWith('col2', 'col4');
  onColumnsReorder.mockClear();

  // should not call `onColumnsReorder` if drag and drop elements are the same
  await userEvent.dragAndDrop(cell2, cell2);
  expect(onColumnsReorder).not.toHaveBeenCalled();

  // should not drag a column if it is not specified as draggable
  await userEvent.dragAndDrop(cell1, cell2);
  expect(onColumnsReorder).not.toHaveBeenCalled();
});
