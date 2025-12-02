import type { Column } from '../../../src';
import { setup } from '../utils';

test('key is escaped in query selectors', () => {
  const columns: readonly Column<never>[] = [
    {
      key: '!@#%$#%$#()%$#&\n123234\n',
      name: 'test'
    }
  ];

  expect(async () => {
    await setup({ columns, rows: [] });
  }).not.toThrowError();
});
