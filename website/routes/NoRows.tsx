import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { css } from 'ecij';

import { DataGrid, SelectColumn, type Column } from '../../src';
import { useDirection } from '../directionContext';

export const Route = createFileRoute('/NoRows')({
  component: NoRows
});

const gridClassname = css`
  block-size: 300px;
`;

function NoRowsFallback() {
  return (
    <div style={{ textAlign: 'center', gridColumn: '1/-1' }}>
      Nothing to show{' '}
      <span lang="ja" title="ショボーン">
        (´・ω・`)
      </span>
    </div>
  );
}

interface Row {
  id: number;
  title: string;
  count: number;
}

const columns: readonly Column<Row>[] = [
  SelectColumn,
  { key: 'id', name: 'ID' },
  { key: 'title', name: 'Title' },
  { key: 'count', name: 'Count' }
];

const rows: readonly Row[] = [];

function rowKeyGetter(row: Row) {
  return row.id;
}

function NoRows() {
  const direction = useDirection();
  const [selectedRows, setSelectedRows] = useState((): ReadonlySet<number> => new Set());

  return (
    <DataGrid
      aria-label="No Rows Example"
      columns={columns}
      rows={rows}
      renderers={{ noRowsFallback: <NoRowsFallback /> }}
      selectedRows={selectedRows}
      onSelectedRowsChange={setSelectedRows}
      rowKeyGetter={rowKeyGetter}
      className={gridClassname}
      direction={direction}
    />
  );
}
