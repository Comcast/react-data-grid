import { css } from '@linaria/core';

import { DataGrid, type Column } from '../../src';
import { renderCoordinates } from '../renderers';
import { useDirection } from '../directionContext';

export const Route = createFileRoute({
  component: ColumnSpanning
});

type Row = number;
const rows: readonly Row[] = Array.from({ length: 100 }, (_, i) => i);

const colSpanClassname = css`
  background-color: #ffb300;
  color: black;
  text-align: center;
`;

const columns: Column<Row>[] = [];

for (let i = 0; i < 30; i++) {
  const key = String(i);
  columns.push({
    key,
    name: key,
    frozen: i < 5,
    resizable: true,
    renderCell: renderCoordinates,
    colSpan(args) {
      if (args.type === 'ROW') {
        if (key === '2' && args.row === 2) return 3;
        if (key === '4' && args.row === 4) return 6; // Will not work as colspan includes both frozen and regular columns
        if (key === '0' && args.row === 5) return 5;
        if (key === '27' && args.row === 8) return 3;
        if (key === '6' && args.row < 8) return 2;
      }
      if (args.type === 'HEADER' && key === '8') {
        return 3;
      }
      return undefined;
    },
    cellClass(row) {
      if (
        (key === '0' && row === 5) ||
        (key === '2' && row === 2) ||
        (key === '27' && row === 8) ||
        (key === '6' && row < 8)
      ) {
        return colSpanClassname;
      }
      return undefined;
    }
  });
}

function ColumnSpanning() {
  const direction = useDirection();

  return (
    <DataGrid
      aria-label="Column Spanning Example"
      columns={columns}
      rows={rows}
      rowHeight={22}
      className="fill-grid"
      direction={direction}
    />
  );
}
