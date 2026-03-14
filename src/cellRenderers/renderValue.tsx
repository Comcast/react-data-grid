import type { RenderCellContentProps } from '../types';

export function renderValue<R, SR>(props: RenderCellContentProps<R, SR>) {
  return props.row?.[props.column.key as keyof R] as React.ReactNode;
}
