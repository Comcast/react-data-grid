import { useCallback, useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';

import { DataGrid, type Column, type ColumnWidths, type SortColumn } from '../../src';
import { compare } from '../utils';
import { useDirection } from '../directionContext';

export const Route = createFileRoute('/ColumnsReordering')({
  component: ColumnsReordering
});

interface Row {
  readonly id: number;
  readonly task: string;
  readonly complete: number;
  readonly priority: string;
  readonly issueType: string;
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

const columns: Column<Row>[] = [
  {
    key: 'id',
    name: 'ID',
    width: 80
  },
  {
    key: 'task',
    name: 'Title',
    resizable: true,
    sortable: true,
    draggable: true
  },
  {
    key: 'priority',
    name: 'Priority',
    resizable: true,
    sortable: true,
    draggable: true
  },
  {
    key: 'issueType',
    name: 'Issue Type',
    resizable: true,
    sortable: true,
    draggable: true
  },
  {
    key: 'complete',
    name: '% Complete',
    resizable: true,
    sortable: true,
    draggable: true
  }
];

const initialColumnsOrder: readonly number[] = columns.map((_, index) => index);

function ColumnsReordering() {
  const direction = useDirection();
  const [rows] = useState(createRows);
  const [columnsOrder, setColumnsOrder] = useState(initialColumnsOrder);
  const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);
  const onSortColumnsChange = useCallback((sortColumns: SortColumn[]) => {
    setSortColumns(sortColumns.slice(-1));
  }, []);
  const [columnWidths, setColumnWidths] = useState((): ColumnWidths => new Map());

  const reorderedColumns = useMemo(() => {
    return columnsOrder.map((index) => columns[index]);
  }, [columnsOrder]);

  const sortedRows = useMemo((): readonly Row[] => {
    if (sortColumns.length === 0) return rows;
    const { columnKey, direction } = sortColumns[0];

    let sortFn: (a: Row, b: Row) => number;

    switch (columnKey) {
      case 'task':
      case 'priority':
      case 'issueType':
        sortFn = (a, b) => compare(a[columnKey], b[columnKey]);
        break;
      case 'complete':
        sortFn = (a, b) => a[columnKey] - b[columnKey];
        break;
      default:
        throw new Error(`unsupported columnKey: "${columnKey}"`);
    }

    if (direction === 'DESC') {
      const sortImpl = sortFn;
      sortFn = (a, b) => sortImpl(b, a);
    }

    return rows.toSorted(sortFn);
  }, [rows, sortColumns]);

  function onColumnsReorder(sourceKey: string, targetKey: string) {
    function reorderColumns() {
      setColumnsOrder((columnsOrder) => {
        const sourceColumnOrderIndex = columnsOrder.findIndex(
          (index) => columns[index].key === sourceKey
        );
        const targetColumnOrderIndex = columnsOrder.findIndex(
          (index) => columns[index].key === targetKey
        );
        const sourceColumnOrder = columnsOrder[sourceColumnOrderIndex];
        const newColumnsOrder = columnsOrder.toSpliced(sourceColumnOrderIndex, 1);
        newColumnsOrder.splice(targetColumnOrderIndex, 0, sourceColumnOrder);
        return newColumnsOrder;
      });
    }

    document.startViewTransition(reorderColumns);
  }

  function resetOrderAndWidths() {
    setColumnsOrder(initialColumnsOrder);
    setColumnWidths(new Map());
  }

  return (
    <>
      <button
        type="button"
        onClick={resetOrderAndWidths}
        style={{
          width: 150,
          marginBottom: 16
        }}
      >
        Reset Columns
      </button>
      <DataGrid
        aria-label="Columns Reordering Example"
        columns={reorderedColumns}
        rows={sortedRows}
        sortColumns={sortColumns}
        onSortColumnsChange={onSortColumnsChange}
        direction={direction}
        defaultColumnOptions={{ width: '1fr' }}
        onColumnsReorder={onColumnsReorder}
        columnWidths={columnWidths}
        onColumnWidthsChange={setColumnWidths}
      />
    </>
  );
}
