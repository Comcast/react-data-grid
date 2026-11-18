import { createFileRoute } from '@tanstack/react-router';

import { DataGrid, type Column } from '../../src';
import { renderCoordinates } from '../renderers';
import { createRandom, initialGridSize } from '../utils';
import { useDirection } from '../directionContext';

export const Route = createFileRoute('/VariableRowHeight')({
  staticData: {
    title: 'Variable Row Height'
  },
  component: VariableRowHeight
});

type Row = number;
const rows: readonly Row[] = Array.from({ length: 500 }, (_, i) => i);

const columns: Column<Row>[] = [];

for (let i = 0; i < 30; i++) {
  const key = String(i);
  columns.push({
    key,
    name: key,
    frozen: i < 5,
    resizable: true,
    renderCell: renderCoordinates
  });
}

function VariableRowHeight() {
  const direction = useDirection();

  return (
    <DataGrid
      aria-label="Variable Row Height Example"
      columns={columns}
      rows={rows}
      rowHeight={rowHeight}
      className="fill-grid"
      direction={direction}
      initialSize={initialGridSize}
    />
  );
}

function rowHeight(row: Row) {
  // should be based on the content of the row
  return 25 + Math.round(createRandom(row)() * 75);
}
