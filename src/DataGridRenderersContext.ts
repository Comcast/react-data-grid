import { createContext, use } from 'react';

import type { Maybe, Renderers } from './types';

// oxlint-disable-next-line typescript/no-explicit-any
export const DataGridRenderersContext = createContext<Maybe<Renderers<any, any>>>(undefined);
DataGridRenderersContext.displayName = 'DataGridRenderersContext';

export function useRenderers<R, SR>(): Maybe<Renderers<R, SR>> {
  return use(DataGridRenderersContext);
}
