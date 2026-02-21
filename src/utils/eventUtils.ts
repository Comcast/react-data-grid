import type { CellEvent } from '../types';

export function createCellEvent<E extends React.SyntheticEvent<HTMLDivElement>>(
  event: E
): CellEvent<E> {
  let defaultPrevented = false;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return Object.create(event, {
    preventGridDefault: {
      value() {
        defaultPrevented = true;
      }
    },
    isGridDefaultPrevented: {
      value() {
        return defaultPrevented;
      }
    }
  });
}
