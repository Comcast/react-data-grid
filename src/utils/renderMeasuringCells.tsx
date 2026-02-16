import { css } from 'ecij';
import type { CalculatedColumn } from '../types';

const measuringCellClassname = css`
  @layer rdg.MeasuringCell {
    contain: strict;
    grid-row: 1;
    visibility: hidden;
  }
`;

export function renderMeasuringCells<R, SR>(viewportColumns: readonly CalculatedColumn<R, SR>[]) {
  return viewportColumns.map(({ key, idx, minWidth, maxWidth }) => (
    <div
      key={key}
      className={measuringCellClassname}
      style={{ gridColumnStart: idx + 1, minWidth, maxWidth }}
      data-measuring-cell-key={key}
    />
  ));
}
