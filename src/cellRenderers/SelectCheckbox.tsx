import type { RenderCheckboxProps } from '../types';
import { useRenderers } from '../DataGridRenderersContext';

/**
 * The same props as {@linkcode RenderCheckboxProps}, with `checked` required.
 */
export interface SelectCheckboxProps extends RenderCheckboxProps {
  /** Whether the checkbox is checked */
  checked: boolean;
}

/**
 * A component for rendering row selection checkboxes.
 */
export function SelectCheckbox(props: SelectCheckboxProps) {
  return useRenderers()!.renderCheckbox!(props);
}
