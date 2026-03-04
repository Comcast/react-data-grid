import { createFileRoute } from '@tanstack/react-router';

import { DataGrid, type Column } from '../../src';
import { renderCoordinates } from '../renderers';
import { useDirection } from '../directionContext';

export const Route = createFileRoute('/MillionCells')({
  component: MillionCells
});

type Row = number;
const rows: readonly Row[] = Array.from({ length: 1000 }, (_, i) => i);

const columns: Column<Row>[] = [];

for (let i = 0; i < 1000; i++) {
  const key = String(i);
  columns.push({
    key,
    name: key,
    frozen: i < 5,
    width: 80,
    resizable: true,
    renderCell: renderCoordinates
  });
}

function MillionCells() {
  const direction = useDirection();

  return (
    <DataGrid
      aria-label="Million Cells Example"
      columns={columns}
      rows={rows}
      rowHeight={22}
      className="fill-grid"
      direction={direction}
      enableVirtualization={{rows: {overscanThreshold: 4}, columns: true}}
    />
  );
}
