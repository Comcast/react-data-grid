import type { RenderCheckboxProps } from '../types';
import { useRenderers } from '../DataGridRenderersContext';

type SharedInputProps = Pick<
  RenderCheckboxProps,
  'disabled' | 'tabIndex' | 'aria-label' | 'aria-labelledby' | 'indeterminate' | 'onChange'
>;

interface SelectCheckboxProps extends SharedInputProps {
  /** Whether the checkbox is checked */
  value: boolean;
}

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
