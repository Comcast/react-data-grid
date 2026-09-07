import { createFileRoute } from '@tanstack/react-router';
import { css } from 'ecij';

import { DataGrid, type Column } from '../../src';
import { renderCoordinates } from '../renderers';
import { useDirection } from '../directionContext';

export const Route = createFileRoute('/RowSpanning')({
  component: RowSpanning
});

type Row = number;
const rows: readonly Row[] = Array.from({ length: 100 }, (_, i) => i);

const rowSpanClassname = css`
  background-color: #ffb300;
  color: black;
  text-align: center;
`;

const columns: Column<Row>[] = [];

for (let i = 0; i < 10; i++) {
  const key = String(i);
  columns.push({
    key,
    name: key,
    resizable: true,
    renderCell: renderCoordinates,
    rowSpan(args) {
      if (key === '0') {
        if (args.row === 1) return [1, 3];
        if (args.row === 2) return [2, 3];
        if (args.row === 3) return [3, 3];
      }
      return undefined;
    },
    cellClass(row) {
      if (key === '0' && row >= 1 && row <= 3) {
        return rowSpanClassname;
      }
      return undefined;
    }
  });
}

function RowSpanning() {
  const direction = useDirection();

  return (
    <DataGrid
      aria-label="Row Spanning Example"
      columns={columns}
      rows={rows}
      rowHeight={22}
      className="fill-grid"
      direction={direction}
    />
  );
}
