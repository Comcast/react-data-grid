import type { RenderCheckboxProps } from '../types';
import { useDefaultRenderers } from '../DataGridDefaultRenderersContext';

type SharedInputProps = Pick<
  RenderCheckboxProps,
  'disabled' | 'tabIndex' | 'aria-label' | 'aria-labelledby' | 'indeterminate' | 'onChange'
>;

interface SelectCheckboxProps extends SharedInputProps {
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
  const renderCheckbox = useDefaultRenderers()!.renderCheckbox!;

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
