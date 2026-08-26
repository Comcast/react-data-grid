import { createContext, use } from 'react';

import type { Maybe, Renderers } from './types';

// oxlint-disable-next-line typescript/no-explicit-any
export const DataGridDefaultRenderersContext = createContext<Maybe<Renderers<any, any>>>(undefined);
DataGridDefaultRenderersContext.displayName = 'DataGridDefaultRenderersContext';

export function useDefaultRenderers<R, SR>(): Maybe<Renderers<R, SR>> {
  return use(DataGridDefaultRenderersContext);
}
