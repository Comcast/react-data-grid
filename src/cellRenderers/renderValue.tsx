import type { RenderCellContentProps } from '../types';

/**
 * The default cell content renderer that renders the value of `row[column.key]`.
 *
 * @example
 * ```tsx
 * import { renderValue, type Column } from 'react-data-grid';
 *
 * const columns: readonly Column<Row>[] = [
 *   {
 *     key: 'title',
 *     name: 'Title',
 *     renderCell: renderValue
 *   }
 * ];
 * ```
 */
export function renderValue<R, SR>(props: RenderCellContentProps<R, SR>) {
  return props.row?.[props.column.key as keyof R] as React.ReactNode;
}
