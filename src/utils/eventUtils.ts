import type { CellEvent } from '../types';

export function createCellEvent<E extends React.SyntheticEvent<HTMLDivElement>>(
  event: E
): CellEvent<E> {
  let defaultPrevented = false;

  return Object.create(event, {
    // React's methods store their state on `this`: call them on the React event itself,
    // so React and parent handlers see that propagation was stopped or the default was prevented
    preventDefault: {
      value() {
        event.preventDefault();
      }
    },
    stopPropagation: {
      value() {
        event.stopPropagation();
      }
    },
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
