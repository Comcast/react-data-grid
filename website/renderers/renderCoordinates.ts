import type { RenderCellProps } from '../../src';

// oxlint-disable-next-line typescript/no-explicit-any
export function renderCoordinates(props: RenderCellProps<number, any>) {
  return `${props.column.key}×${props.row}`;
}
