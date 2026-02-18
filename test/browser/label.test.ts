import { page } from 'vitest/browser';

import { setup } from './utils';

const grid = page.getGrid();

test('should set label and description', async () => {
  await setup({
    rows: [],
    columns: [],
    'aria-label': 'label',
    'aria-labelledby': 'labelledby',
    'aria-description': 'description',
    'aria-describedby': 'describedby',
    'data-testid': 'testid',
    'data-cy': 'cy'
  });

  await expect.element(grid).toHaveAttribute('aria-label', 'label');
  await expect.element(grid).toHaveAttribute('aria-labelledby', 'labelledby');
  await expect.element(grid).toHaveAttribute('aria-description', 'description');
  await expect.element(grid).toHaveAttribute('aria-describedby', 'describedby');
  await expect.element(grid).toHaveAttribute('data-testid', 'testid');
  await expect.element(grid).toHaveAttribute('data-cy', 'cy');
});
