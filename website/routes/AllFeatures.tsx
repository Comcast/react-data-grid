import { useState } from 'react';
import { faker } from '@faker-js/faker';
import { css } from 'ecij';
import clsx from 'clsx';

import type { CalculatedColumn, CellCopyArgs, CellPasteArgs, Column, FillEvent } from '../../src';
import { DataGrid, renderTextEditor, SelectColumn } from '../../src';
import { textEditorClassname } from '../../src/editors/renderTextEditor';
import { useDirection } from '../directionContext';

export const Route = createFileRoute({
  component: AllFeatures,
  loader() {
    rows ??= createRows();
    return rows;
  }
});

let rows: readonly Row[] | undefined;

function createRows(): Row[] {
  const rows: Row[] = [];

  for (let i = 0; i < 2000; i++) {
    rows.push({
      id: `id_${i}`,
      avatar: faker.image.avatar(),
      email: faker.internet.email(),
      title: faker.person.prefix(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      street: faker.location.street(),
      zipCode: faker.location.zipCode(),
      date: faker.date.past().toLocaleDateString(),
      bs: faker.company.buzzPhrase(),
      catchPhrase: faker.company.catchPhrase(),
      companyName: faker.company.name(),
      words: faker.lorem.words(),
      sentence: faker.lorem.sentence()
    });
  }

  return rows;
}

const highlightClassname = css`
  .rdg-cell {
    background-color: #9370db;
    color: white;
  }

  &:hover .rdg-cell {
    background-color: #800080;
  }
`;

const copiedRowClassname = css``;

export interface Row {
  id: string;
  avatar: string;
  email: string;
  title: string;
  firstName: string;
  lastName: string;
  street: string;
  zipCode: string;
  date: string;
  bs: string;
  catchPhrase: string;
  companyName: string;
  words: string;
  sentence: string;
}

function rowKeyGetter(row: Row) {
  return row.id;
}

const avatarClassname = css`
  margin: auto;
  background-size: 100%;
  block-size: 28px;
  inline-size: 28px;
`;

const titles = ['Dr.', 'Mr.', 'Mrs.', 'Miss', 'Ms.'] as const;

const columns: readonly Column<Row>[] = [
  SelectColumn,
  {
    key: 'id',
    name: 'ID',
    width: 80,
    resizable: true,
    frozen: true
  },
  {
    key: 'avatar',
    name: 'Avatar',
    width: 40,
    resizable: true,
    renderCell({ row }) {
      return <div className={avatarClassname} style={{ backgroundImage: `url(${row.avatar})` }} />;
    }
  },
  {
    key: 'title',
    name: 'Title',
    width: 200,
    resizable: true,
    renderEditCell({ row, onRowChange }) {
      return (
        <select
          className={textEditorClassname}
          value={row.title}
          onChange={(event) => onRowChange({ ...row, title: event.target.value }, true)}
          autoFocus
        >
          {titles.map((title) => (
            <option key={title} value={title}>
              {title}
            </option>
          ))}
        </select>
      );
    }
  },
  {
    key: 'firstName',
    name: 'First Name',
    width: 200,
    resizable: true,
    frozen: true,
    renderEditCell: renderTextEditor
  },
  {
    key: 'lastName',
    name: 'Last Name',
    width: 200,
    resizable: true,
    frozen: true,
    renderEditCell: renderTextEditor
  },
  {
    key: 'email',
    name: 'Email',
    width: 'max-content',
    resizable: true,
    renderEditCell: renderTextEditor
  },
  {
    key: 'street',
    name: 'Street',
    width: 200,
    resizable: true,
    renderEditCell: renderTextEditor
  },
  {
    key: 'zipCode',
    name: 'ZipCode',
    width: 200,
    resizable: true,
    renderEditCell: renderTextEditor
  },
  {
    key: 'date',
    name: 'Date',
    width: 200,
    resizable: true,
    renderEditCell: renderTextEditor
  },
  {
    key: 'bs',
    name: 'bs',
    width: 200,
    resizable: true,
    renderEditCell: renderTextEditor
  },
  {
    key: 'catchPhrase',
    name: 'Catch Phrase',
    width: 'max-content',
    resizable: true,
    renderEditCell: renderTextEditor
  },
  {
    key: 'companyName',
    name: 'Company Name',
    width: 200,
    resizable: true,
    renderEditCell: renderTextEditor
  },
  {
    key: 'sentence',
    name: 'Sentence',
    width: 'max-content',
    resizable: true,
    renderEditCell: renderTextEditor
  }
];

function AllFeatures() {
  const direction = useDirection();
  const initialRows = Route.useLoaderData();
  const [rows, setRows] = useState(initialRows);
  const [selectedRows, setSelectedRows] = useState((): ReadonlySet<string> => new Set());
  const [copiedCell, setCopiedCell] = useState<{
    readonly row: Row;
    readonly column: CalculatedColumn<Row>;
  } | null>(null);

  function handleFill({ columnKey, sourceRow, targetRow }: FillEvent<Row>): Row {
    return { ...targetRow, [columnKey]: sourceRow[columnKey as keyof Row] };
  }

  function handleCellPaste(
    { row, column }: CellCopyArgs<Row>,
    event: React.ClipboardEvent<HTMLDivElement>
  ): Row {
    const targetColumnKey = column.key;

    if (copiedCell !== null) {
      const sourceColumnKey = copiedCell.column.key;
      const sourceRow = copiedCell.row;

      const incompatibleColumns = ['email', 'zipCode', 'date'];
      if (
        sourceColumnKey === 'avatar' ||
        ['id', 'avatar'].includes(targetColumnKey) ||
        ((incompatibleColumns.includes(targetColumnKey) ||
          incompatibleColumns.includes(sourceColumnKey)) &&
          sourceColumnKey !== targetColumnKey)
      ) {
        return row;
      }

      return { ...row, [targetColumnKey]: sourceRow[sourceColumnKey as keyof Row] };
    }

    const copiedText = event.clipboardData.getData('text/plain');
    if (copiedText !== '') {
      return { ...row, [targetColumnKey]: copiedText };
    }

    return row;
  }

  function handleCellCopy(
    { row, column }: CellPasteArgs<Row>,
    event: React.ClipboardEvent<HTMLDivElement>
  ): void {
    // copy highlighted text only
    if (window.getSelection()?.isCollapsed === false) {
      setCopiedCell(null);
      return;
    }

    setCopiedCell({ row, column });
    event.clipboardData.setData('text/plain', row[column.key as keyof Row]);
    event.preventDefault();
  }

  return (
    <>
      {copiedCell && (
        <style>
          {`
          .${copiedRowClassname} > [aria-colindex="${copiedCell.column.idx + 1}"] {
            background-color: #ccccff;
            &.rdg-cell-dragged-over {
              background-color: #9999ff;
            }
          }
       `}
        </style>
      )}
      <DataGrid
        aria-label="All Features Example"
        columns={columns}
        rows={rows}
        rowKeyGetter={rowKeyGetter}
        onRowsChange={setRows}
        onFill={handleFill}
        onCellCopy={handleCellCopy}
        onCellPaste={handleCellPaste}
        rowHeight={30}
        selectedRows={selectedRows}
        isRowSelectionDisabled={(row) => row.id === 'id_2'}
        onSelectedRowsChange={setSelectedRows}
        className="fill-grid"
        rowClass={(row, index) => {
          return clsx({
            [highlightClassname]: row.id.includes('7') || index === 0,
            [copiedRowClassname]: copiedCell?.row === row
          });
        }}
        direction={direction}
        onCellClick={(args, event) => {
          if (args.column.key === 'title') {
            event.preventGridDefault();
            args.selectCell(true);
          }
        }}
        onCellKeyDown={(_, event) => {
          if (event.key === 'Escape') {
            setCopiedCell(null);
          }
        }}
      />
    </>
  );
}
