import { createContext, useContext } from 'react';
import type { Direction } from '../src/types';

export const DirectionContext = createContext<Direction>('ltr');

export function useDirection(): Direction {
  return useContext(DirectionContext);
}
