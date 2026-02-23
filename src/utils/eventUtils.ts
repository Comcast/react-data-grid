import type { CellEvent } from '../types';

export function createCellEvent<E extends React.SyntheticEvent<HTMLDivElement>>(
  event: E
): CellEvent<E> {
  let defaultPrevented = false;

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
