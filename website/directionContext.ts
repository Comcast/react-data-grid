import { createContext, use } from 'react';

import type { Direction } from '../src';

export const DirectionContext = createContext<Direction>('ltr');
DirectionContext.displayName = 'DirectionContext';

export function useDirection(): Direction {
  return use(DirectionContext);
}
