import { css } from 'ecij';

import type { CalculatedColumn } from '../types';

const measuringCellClassname = css`
  @layer rdg.MeasuringCell {
    contain: strict;
    grid-row: 1;
    visibility: hidden;
  }
`;

export function renderMeasuringCells<R, SR>(
  viewportColumns: readonly CalculatedColumn<R, SR>[],
  observeMeasuringCellRef: (cell: HTMLDivElement) => () => void
) {
  return viewportColumns.map(({ key, idx }) => (
    <div
      key={key}
      ref={observeMeasuringCellRef}
      className={measuringCellClassname}
      style={{ gridColumnStart: idx + 1 }}
      data-measuring-cell-key={key}
    />
  ));
}
