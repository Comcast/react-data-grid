import { useMemo, useState } from 'react';
import { css } from 'ecij';
import { Row as BaseRow, Cell, DataGrid, renderTextEditor, SelectColumn } from '../../src';
import type {
  CellRendererProps,
  Column,
  RenderCheckboxProps,
  RenderRowProps,
  RenderSortStatusProps,
  SortColumn
} from '../../src';
import { useDirection } from '../directionContext';

export const Route = createFileRoute({
  component: CustomizableRenderers
});

const selectCellClassname = css`
  display: flex;
  align-items: center;
  justify-content: center;

  > input {
    margin: 0;
  }
`;

const sortPriorityClassname = css`
  color: grey;
  margin-left: 2px;
`;

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
    ...SelectColumn,
    headerCellClass: selectCellClassname,
    cellClass: selectCellClassname
  },
  {
    key: 'id',
    name: 'ID',
    width: 80
  },
  {
    key: 'task',
    name: 'Title',
    renderEditCell: renderTextEditor,
    sortable: true
  },
  {
    key: 'priority',
    name: 'Priority',
    sortable: true
  },
  {
    key: 'issueType',
    name: 'Issue Type',
    sortable: true
  },
  {
    key: 'complete',
    name: '% Complete',
    sortable: true
  }
];

function CustomizableRenderers() {
  const direction = useDirection();
  const [rows, setRows] = useState(createRows);
  const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);
  const [selectedRows, setSelectedRows] = useState((): ReadonlySet<number> => new Set());

  const sortedRows = useMemo((): readonly Row[] => {
    if (sortColumns.length === 0) return rows;

    return rows.toSorted((a, b) => {
      for (const sort of sortColumns) {
        const comparator = getComparator(sort.columnKey);
        const compResult = comparator(a, b);
        if (compResult !== 0) {
          return sort.direction === 'ASC' ? compResult : -compResult;
        }
      }
      return 0;
    });
  }, [rows, sortColumns]);

  return (
    <DataGrid
      aria-label="Customizable Renderers Example"
      className="fill-grid"
      columns={columns}
      rows={sortedRows}
      rowKeyGetter={rowKeyGetter}
      onRowsChange={setRows}
      sortColumns={sortColumns}
      onSortColumnsChange={setSortColumns}
      selectedRows={selectedRows}
      onSelectedRowsChange={setSelectedRows}
      renderers={{ renderSortStatus, renderCheckbox, renderCell, renderRow }}
      direction={direction}
    />
  );
}

function renderCheckbox({ onChange, indeterminate, ...props }: RenderCheckboxProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.checked, (e.nativeEvent as MouseEvent).shiftKey);
  }

  return (
    <input
      ref={(el) => {
        if (el) {
          el.indeterminate = indeterminate === true;
        }
      }}
      type="checkbox"
      {...props}
      onChange={handleChange}
    />
  );
}

function renderSortStatus({ sortDirection, priority }: RenderSortStatusProps) {
  return (
    <>
      {sortDirection !== undefined ? (sortDirection === 'ASC' ? '\u2B9D' : '\u2B9F') : null}
      <span className={sortPriorityClassname}>{priority}</span>
    </>
  );
}

const cellStyle: React.CSSProperties = { color: 'red' };

function renderCell(key: React.Key, props: CellRendererProps<Row, unknown>) {
  const style =
    props.column.key === 'priority' && props.row.priority === 'Critical' ? cellStyle : undefined;

  return <Cell key={key} {...props} style={style} />;
}

const rowStyle: React.CSSProperties = { color: 'green' };

function renderRow(key: React.Key, props: RenderRowProps<Row>) {
  const style = props.row.complete === 100 ? rowStyle : undefined;

  return <BaseRow key={key} {...props} style={style} />;
}

function rowKeyGetter(row: Row) {
  return row.id;
}

type Comparator = (a: Row, b: Row) => number;

function getComparator(sortColumn: string): Comparator {
  switch (sortColumn) {
    case 'task':
    case 'priority':
    case 'issueType':
      return (a, b) => {
        return a[sortColumn].localeCompare(b[sortColumn]);
      };
    case 'complete':
      return (a, b) => {
        return a[sortColumn] - b[sortColumn];
      };
    default:
      throw new Error(`unsupported sortColumn: "${sortColumn}"`);
  }
}
