import { useState } from 'react';
import { css } from '@linaria/core';

import { DataGrid, SelectColumn, type Column } from '../../src';
import { useDirection } from '../directionContext';

export const Route = createFileRoute({
  component: NoRows
});

const gridClassname = css`
  block-size: 300px;
`;

function EmptyRowsRenderer() {
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
  const [selectedRows, onSelectedRowsChange] = useState((): ReadonlySet<number> => new Set());

  return (
    <DataGrid
      aria-label="No Rows Example"
      columns={columns}
      rows={rows}
      renderers={{ noRowsFallback: <EmptyRowsRenderer /> }}
      selectedRows={selectedRows}
      onSelectedRowsChange={onSelectedRowsChange}
      rowKeyGetter={rowKeyGetter}
      className={gridClassname}
      direction={direction}
    />
  );
}
