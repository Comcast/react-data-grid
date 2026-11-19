import type { RenderCheckboxProps } from '../types';
import { useRenderers } from '../DataGridRenderersContext';

/**
 * The same props as {@linkcode RenderCheckboxProps}.
 */
export type SelectCheckboxProps = RenderCheckboxProps;

/**
 * A component for rendering row selection checkboxes.
 */
export function SelectCheckbox(props: SelectCheckboxProps) {
  return useRenderers()!.renderCheckbox!(props);
}
