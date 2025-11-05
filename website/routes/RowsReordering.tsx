import { useCallback, useState } from 'react';

import { DataGrid, renderTextEditor } from '../../src';
import type { CellRendererProps, Column } from '../../src';
import { DraggableCellRenderer } from '../components';
import { startViewTransition } from '../utils';
import { useDirection } from '../directionContext';

export const Route = createFileRoute({
  component: RowsReordering
});

interface Row {
  id: number;
  task: string;
  complete: number;
  priority: string;
  issueType: string;
}

function createRows(): readonly Row[] {
  const rows: Row[] = [];

  for (let i = 1; i < 500; i++) {
    rows.push({
      id: i,
      task: `Task ${i}`,
      complete: Math.min(100, Math.round(Math.random() * 110)),
      priority: ['Critical', 'High', 'Medium', 'Low'][Math.round(Math.random() * 3)],
      issueType: ['Bug', 'Improvement', 'Epic', 'Story'][Math.round(Math.random() * 3)]
    });
  }

  return rows;
}

const columns: readonly Column<Row>[] = [
  {
    key: 'id',
    name: 'ID',
    width: 80
  },
  {
    key: 'task',
    name: 'Title',
    renderEditCell: renderTextEditor
  },
  {
    key: 'priority',
    name: 'Priority'
  },
  {
    key: 'issueType',
    name: 'Issue Type'
  },
  {
    key: 'complete',
    name: '% Complete'
  }
];

function RowsReordering() {
  const direction = useDirection();
  const [rows, setRows] = useState(createRows);

  const renderCell = useCallback((key: React.Key, props: CellRendererProps<Row, unknown>) => {
    function onRowReorder(fromIndex: number, toIndex: number) {
      function reorderRows() {
        setRows((rows) => {
          const row = rows[fromIndex];
          const newRows = rows.toSpliced(fromIndex, 1);
          newRows.splice(toIndex, 0, row);
          return newRows;
        });
      }

      startViewTransition(reorderRows);
    }

    return <DraggableCellRenderer key={key} {...props} onRowReorder={onRowReorder} />;
  }, []);

  return (
    <DataGrid
      aria-label="Rows Reordering Example"
      columns={columns}
      rows={rows}
      onRowsChange={setRows}
      renderers={{ renderCell }}
      direction={direction}
    />
  );
}
