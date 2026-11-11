import { createContext, use } from 'react';

import type { Maybe, Renderers } from './types';

/**
 * Context for providing default renderers to DataGrids in your app.
 *
 * @example
 * ```tsx
 * import {
 *   DataGridRenderersContext,
 *   renderCheckbox,
 *   renderSortIcon,
 *   renderSortPriority,
 *   type Renderers
 * } from 'react-data-grid';
 *
 * // custom implementations of renderers
 * const defaultGridRenderers: Renderers<unknown, unknown> = {
 *   renderCheckbox,
 *   renderSortStatus(props) {
 *     return (
 *       <>
 *         {renderSortIcon(props)}
 *         {renderSortPriority(props)}
 *       </>
 *     );
 *   }
 * };
 *
 * function AppProvider({ children }) {
 *   return (
 *     <DataGridRenderersContext value={defaultGridRenderers}>{children}</DataGridRenderersContext>
 *   );
 * }
 * ```
 */
// oxlint-disable-next-line typescript/no-explicit-any
export const DataGridRenderersContext = createContext<Maybe<Renderers<any, any>>>(undefined);
DataGridRenderersContext.displayName = 'DataGridRenderersContext';

export function useRenderers<R, SR>(): Maybe<Renderers<R, SR>> {
  return use(DataGridRenderersContext);
}
