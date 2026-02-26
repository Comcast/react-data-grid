import { useMemo, useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { faker } from '@faker-js/faker';
import { createFileRoute } from '@tanstack/react-router';
import { css } from 'ecij';

import {
  DataGrid,
  renderTextEditor,
  SelectCheckbox,
  SelectColumn,
  type Column,
  type DataGridHandle,
  type Direction,
  type SortColumn
} from '../../src';
import { textEditorClassname } from '../../src/editors/renderTextEditor';
import { exportToCsv, exportToPdf } from '../utils';
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

const dialogContainerClassname = css`
  position: absolute;
  inset: 0;
  display: flex;
  place-items: center;
  background: rgba(0, 0, 0, 0.1);

  > dialog {
    width: 300px;
    > input {
      width: 100%;
    }

    > menu {
      text-align: end;
    }
  }
`;

const dateFormatter = new Intl.DateTimeFormat(navigator.language).format;
const currencyFormatter = new Intl.NumberFormat(navigator.language, {
  style: 'currency',
  currency: 'eur'
}).format;

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

function getColumns(
  countries: readonly string[],
  direction: Direction
): readonly Column<Row, SummaryRow>[] {
  return [
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
      frozen: true,
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
        return createPortal(
          <div
            dir={direction}
            className={dialogContainerClassname}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                onClose();
              }
            }}
          >
            <dialog open>
              <input
                autoFocus
                type="range"
                min="0"
                max="100"
                value={row.progress}
                onChange={(e) => onRowChange({ ...row, progress: e.target.valueAsNumber })}
              />
              <menu>
                <button type="button" onClick={() => onClose()}>
                  Cancel
                </button>
                <button type="button" onClick={() => onClose(true)}>
                  Save
                </button>
              </menu>
            </dialog>
          </div>,
          document.body
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
        return dateFormatter(props.row.startTimestamp);
      }
    },
    {
      key: 'endTimestamp',
      name: 'Deadline',
      renderCell(props) {
        return dateFormatter(props.row.endTimestamp);
      }
    },
    {
      key: 'budget',
      name: 'Budget',
      renderCell(props) {
        return currencyFormatter(props.row.budget);
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
      renderCell({ row, onRowChange, tabIndex }) {
        return (
          <SelectCheckbox
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
}

function rowKeyGetter(row: Row) {
  return row.id;
}

let countries: string[] = [];

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
      budget: 500 + Math.random() * 10500,
      transaction: faker.finance.transactionType(),
      account: faker.finance.iban(),
      version: faker.system.semver(),
      available: Math.random() > 0.5
    });
  }

  countries = [...countrySet].sort(new Intl.Collator().compare);

  return rows;
}

type Comparator = (a: Row, b: Row) => number;

function getComparator(sortColumn: string): Comparator {
  switch (sortColumn) {
    case 'assignee':
    case 'title':
    case 'client':
    case 'area':
    case 'country':
    case 'contact':
    case 'transaction':
    case 'account':
    case 'version':
      return (a, b) => {
        return a[sortColumn].localeCompare(b[sortColumn]);
      };
    case 'available':
      return (a, b) => {
        return a[sortColumn] === b[sortColumn] ? 0 : a[sortColumn] ? 1 : -1;
      };
    case 'id':
    case 'progress':
    case 'startTimestamp':
    case 'endTimestamp':
    case 'budget':
      return (a, b) => {
        return a[sortColumn] - b[sortColumn];
      };
    default:
      throw new Error(`unsupported sortColumn: "${sortColumn}"`);
  }
}

function CommonFeatures() {
  const direction = useDirection();
  const [rows, setRows] = useState(createRows);
  const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);
  const [selectedRows, setSelectedRows] = useState((): ReadonlySet<number> => new Set());
  const [isExporting, setIsExporting] = useState(false);
  const gridRef = useRef<DataGridHandle>(null);
  const columns = useMemo(() => getColumns(countries, direction), [direction]);

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
