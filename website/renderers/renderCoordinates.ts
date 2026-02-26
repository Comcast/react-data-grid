import type { RenderCellContentProps } from '../../src';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function renderCoordinates(props: RenderCellContentProps<number, any>) {
  return `${props.column.key}×${props.row}`;
}
