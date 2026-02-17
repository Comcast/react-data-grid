import { createContext, useContext } from 'react';

import type { Maybe, Renderers } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DataGridDefaultRenderersContext = createContext<Maybe<Renderers<any, any>>>(undefined);

export function useDefaultRenderers<R, SR>(): Maybe<Renderers<R, SR>> {
  return useContext(DataGridDefaultRenderersContext);
}
