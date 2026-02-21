import type { RenderCellContentProps } from '../types';

export function renderValue<R, SR>(props: RenderCellContentProps<R, SR>) {
  try {
    return props.row[props.column.key as keyof R] as React.ReactNode;
  } catch {
    return null;
  }
}
