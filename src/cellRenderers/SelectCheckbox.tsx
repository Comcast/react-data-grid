import type { RenderCheckboxProps } from '../types';
import { useRenderers } from '../DataGridRenderersContext';

/**
 * The props of {@linkcode SelectCheckbox | <SelectCheckbox />}: the same props as {@linkcode RenderCheckboxProps}, with `value: boolean` in place of `checked`.
 */
interface SelectCheckboxProps extends Pick<
  RenderCheckboxProps,
  'disabled' | 'tabIndex' | 'aria-label' | 'aria-labelledby' | 'indeterminate' | 'onChange'
> {
  /** Whether the checkbox is checked */
  value: boolean;
}

/**
 * A component for rendering row selection checkboxes.
 */
export function SelectCheckbox({
  value,
  tabIndex,
  indeterminate,
  disabled,
  onChange,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy
}: SelectCheckboxProps) {
  const renderCheckbox = useRenderers()!.renderCheckbox!;

  return renderCheckbox({
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    tabIndex,
    indeterminate,
    disabled,
    checked: value,
    onChange
  });
}
