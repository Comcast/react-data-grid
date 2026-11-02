import type { RenderCheckboxProps } from '../types';
import { useRenderers } from '../DataGridRenderersContext';

export interface SelectCheckboxProps extends RenderCheckboxProps {
  /** Whether the checkbox is checked */
  checked: boolean;
}

export function SelectCheckbox(props: SelectCheckboxProps) {
  return useRenderers()!.renderCheckbox!(props);
}
