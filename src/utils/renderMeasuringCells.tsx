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
  return viewportColumns.map(({ key, idx, minWidth }) => (
    <div
      key={key}
      ref={observeMeasuringCellRef}
      className={measuringCellClassname}
      // the column is at least as wide as its measuring cell
      style={{ gridColumnStart: idx + 1, minWidth }}
      data-measuring-cell-key={key}
    />
  ));
}
