import type { Column } from '../../../src';
import { setup } from '../utils';

test('key is escaped in query selectors', async () => {
  const columns: readonly Column<never>[] = [
    {
      key: '!@#%$#%$#()%$#&\n123234\n',
      name: 'test'
    }
  ];

  await expect(setup({ columns, rows: [] })).resolves.not.toThrowError();
});
