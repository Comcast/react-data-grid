import { useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { faker } from '@faker-js/faker';
import { createFileRoute } from '@tanstack/react-router';
import { css } from 'ecij';

import {
  DataGrid,
  renderTextEditor,
  SelectCellFormatter,
  SelectColumn,
  type Column,
  type DataGridHandle,
  type SortColumn
} from '../../src';
import { textEditorClassname } from '../../src/editors/renderTextEditor';
import {
  compare,
  currencyFormatter,
  dateFormatter,
  exportToCsv,
  exportToPdf,
  showModalRef
} from '../utils';
import { useDirection } from '../directionContext';

export const Route = createFileRoute('/CommonFeatures')({
  component: CommonFeatures
});

const toolbarClassname = css`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-block-end: 8px;
`;

interface SummaryRow {
  id: string;
  totalCount: number;
  yesCount: number;
}

interface Row {
  id: number;
  title: string;
  client: string;
  area: string;
  country: string;
  contact: string;
  assignee: string;
  progress: number;
  startTimestamp: number;
  endTimestamp: number;
  budget: number;
  transaction: string;
  account: string;
  version: string;
  available: boolean;
}

const columns: readonly Column<Row, SummaryRow>[] = [
  SelectColumn,
  {
    key: 'id',
    name: 'ID',
    frozen: true,
    resizable: false,
    renderSummaryCell() {
      return <strong>Total</strong>;
    }
  },
  {
    key: 'title',
    name: 'Task',
    frozen: 'start',
    renderEditCell: renderTextEditor,
    renderSummaryCell({ row }) {
      return `${row.totalCount} records`;
    }
  },
  {
    key: 'client',
    name: 'Client',
    width: 'max-content',
    draggable: true,
    renderEditCell: renderTextEditor
  },
  {
    key: 'area',
    name: 'Area',
    renderEditCell: renderTextEditor
  },
  {
    key: 'country',
    name: 'Country',
    renderEditCell: (p) => (
      <select
        autoFocus
        className={textEditorClassname}
        value={p.row.country}
        onChange={(e) => p.onRowChange({ ...p.row, country: e.target.value }, true)}
        onFocus={(event) => {
          event.target.showPicker();
        }}
      >
        {countries.map((country) => (
          <option key={country}>{country}</option>
        ))}
      </select>
    )
  },
  {
    key: 'contact',
    name: 'Contact',
    renderEditCell: renderTextEditor
  },
  {
    key: 'assignee',
    name: 'Assignee',
    renderEditCell: renderTextEditor
  },
  {
    key: 'progress',
    name: 'Completion',
    renderCell(props) {
      const value = props.row.progress;
      return (
        <>
          <progress max={100} value={value} style={{ inlineSize: 50 }} /> {Math.round(value)}%
        </>
      );
    },
    renderEditCell({ row, onRowChange, onClose }) {
      const dialogId = 'edit-progress-dialog';

      return (
        <dialog
          ref={showModalRef}
          id={dialogId}
          className={css`
            display: flex;
            flex-direction: column;
            width: 300px;
            gap: 16px;
            padding: 16px;
          `}
          closedby="any"
          onClose={() => onClose()}
        >
          <input
            autoFocus
            type="range"
            min="0"
            max="100"
            value={row.progress}
            onChange={(e) => onRowChange({ ...row, progress: e.target.valueAsNumber })}
          />
          <menu
            className={css`
              list-style: none;
              display: flex;
              justify-content: end;
              gap: 8px;
              margin: 0;
              padding: 0;
            `}
          >
            <li>
              <button type="button" command="close" commandfor={dialogId}>
                Cancel
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onClose(true)}>
                Save
              </button>
            </li>
          </menu>
        </dialog>
      );
    },
    editorOptions: {
      displayCellContent: true
    }
  },
  {
    key: 'startTimestamp',
    name: 'Start date',
    renderCell(props) {
      return dateFormatter.format(props.row.startTimestamp);
    }
  },
  {
    key: 'endTimestamp',
    name: 'Deadline',
    renderCell(props) {
      return dateFormatter.format(props.row.endTimestamp);
    }
  },
  {
    key: 'budget',
    name: 'Budget',
    renderCell(props) {
      return currencyFormatter.format(props.row.budget);
    }
  },
  {
    key: 'transaction',
    name: 'Transaction type'
  },
  {
    key: 'account',
    name: 'Account'
  },
  {
    key: 'version',
    name: 'Version',
    renderEditCell: renderTextEditor
  },
  {
    key: 'available',
    name: 'Available',
    frozen: 'end',
    renderCell({ row, onRowChange, tabIndex }) {
      return (
        <SelectCellFormatter
          value={row.available}
          onChange={() => {
            onRowChange({ ...row, available: !row.available });
          }}
          tabIndex={tabIndex}
        />
      );
    },
    renderSummaryCell({ row: { yesCount, totalCount } }) {
      return `${Math.floor((100 * yesCount) / totalCount)}% ✔️`;
    }
  }
];

function rowKeyGetter(row: Row) {
  return row.id;
}

let countries: string[];

function createRows(): readonly Row[] {
  const now = Date.now();
  const rows: Row[] = [];
  const countrySet = new Set<string>();

  for (let i = 0; i < 1000; i++) {
    const country = faker.location.country();
    countrySet.add(country);

    rows.push({
      id: i,
      title: `Task #${i + 1}`,
      client: faker.company.name(),
      area: faker.person.jobArea(),
      country,
      contact: faker.internet.exampleEmail(),
      assignee: faker.person.fullName(),
      progress: Math.random() * 100,
      startTimestamp: now - Math.round(Math.random() * 1e10),
      endTimestamp: now + Math.round(Math.random() * 1e10),
      budget: 500 + Math.random() * 10_500,
      transaction: faker.finance.transactionType(),
      account: faker.finance.iban(),
      version: faker.system.semver(),
      available: Math.random() > 0.5
    });
  }

  countries = [...countrySet];
  countries.sort(compare);

  return rows;
}

type Comparator = (a: Row, b: Row) => number;

function getComparator({ columnKey, direction }: SortColumn): Comparator {
  let sortFn: Comparator;

  switch (columnKey) {
    case 'assignee':
    case 'title':
    case 'client':
    case 'area':
    case 'country':
    case 'contact':
    case 'transaction':
    case 'account':
    case 'version':
      sortFn = (a, b) => {
        return compare(a[columnKey], b[columnKey]);
      };
      break;
    case 'available':
      sortFn = (a, b) => {
        return a[columnKey] === b[columnKey] ? 0 : a[columnKey] ? 1 : -1;
      };
      break;
    case 'id':
    case 'progress':
    case 'startTimestamp':
    case 'endTimestamp':
    case 'budget':
      sortFn = (a, b) => {
        return a[columnKey] - b[columnKey];
      };
      break;
    default:
      throw new Error(`unsupported columnKey: "${columnKey}"`);
  }

  if (direction === 'DESC') {
    return (a, b) => sortFn(b, a);
  }

  return sortFn;
}

function CommonFeatures() {
  const direction = useDirection();
  const [rows, setRows] = useState(createRows);
  const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);
  const [selectedRows, setSelectedRows] = useState((): ReadonlySet<number> => new Set());
  const [isExporting, setIsExporting] = useState(false);
  const gridRef = useRef<DataGridHandle>(null);

  const summaryRows = useMemo((): readonly SummaryRow[] => {
    return [
      {
        id: 'total_0',
        totalCount: rows.length,
        yesCount: rows.filter((r) => r.available).length
      }
    ];
  }, [rows]);

  const sortedRows = useMemo((): readonly Row[] => {
    if (sortColumns.length === 0) return rows;

    const comparators = sortColumns.map(getComparator);

    return rows.toSorted((a, b) => {
      for (const comparator of comparators) {
        const compResult = comparator(a, b);
        if (compResult !== 0) {
          return compResult;
        }
      }
      return 0;
    });
  }, [rows, sortColumns]);

  function handleExportToCsv() {
    flushSync(() => {
      setIsExporting(true);
    });

    exportToCsv(gridRef.current!.element!, 'CommonFeatures.csv');

    flushSync(() => {
      setIsExporting(false);
    });
  }

  async function handleExportToPdf() {
    flushSync(() => {
      setIsExporting(true);
    });

    await exportToPdf(gridRef.current!.element!, 'CommonFeatures.pdf');

    flushSync(() => {
      setIsExporting(false);
    });
  }

  return (
    <>
      <div className={toolbarClassname}>
        <button type="button" onClick={handleExportToCsv}>
          Export to CSV
        </button>
        <button type="button" onClick={handleExportToPdf}>
          Export to PDF
        </button>
      </div>
      <DataGrid
        ref={gridRef}
        aria-label="Common Features Example"
        rowKeyGetter={rowKeyGetter}
        columns={columns}
        rows={sortedRows}
        defaultColumnOptions={{
          sortable: true,
          resizable: true
        }}
        selectedRows={selectedRows}
        onSelectedRowsChange={setSelectedRows}
        onRowsChange={setRows}
        sortColumns={sortColumns}
        onSortColumnsChange={setSortColumns}
        topSummaryRows={summaryRows}
        bottomSummaryRows={summaryRows}
        className="fill-grid"
        direction={direction}
        enableVirtualization={!isExporting}
      />
    </>
  );
}
