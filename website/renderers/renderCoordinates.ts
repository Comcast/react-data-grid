import type { RenderCellContentProps } from '../../src';

// oxlint-disable-next-line typescript/no-explicit-any
export function renderCoordinates(props: RenderCellContentProps<number, any>) {
  return `${props.column.key}×${props.row}`;
}
