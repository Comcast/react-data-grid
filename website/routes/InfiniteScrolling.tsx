import { useState } from 'react';
import { faker } from '@faker-js/faker';
import { css } from 'ecij';
import { DataGrid, type Column } from '../../src';
import { useDirection } from '../directionContext';

export const Route = createFileRoute({
  component: InfiniteScrolling
});

const loadMoreRowsClassname = css`
  inline-size: 180px;
  padding-block: 8px;
  padding-inline: 16px;
  position: absolute;
  inset-block-end: 8px;
  inset-inline-end: 8px;
  color: white;
  line-height: 35px;
  background: rgb(0 0 0 / 0.6);
`;

interface Row {
  id: string;
  email: string;
  title: string;
  firstName: string;
  lastName: string;
}

function rowKeyGetter(row: Row) {
  return row.id;
}

const columns: readonly Column<Row>[] = [
  {
    key: 'id',
    name: 'ID'
  },
  {
    key: 'title',
    name: 'Title'
  },
  {
    key: 'firstName',
    name: 'First Name'
  },
  {
    key: 'lastName',
    name: 'Last Name'
  },
  {
    key: 'email',
    name: 'Email'
  }
];

function createFakeRowObjectData(index: number): Row {
  return {
    id: `id_${index}`,
    email: faker.internet.email(),
    title: faker.person.prefix(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName()
  };
}

function createRows(numberOfRows: number): Row[] {
  const rows: Row[] = [];

  for (let i = 0; i < numberOfRows; i++) {
    rows[i] = createFakeRowObjectData(i);
  }

  return rows;
}

function isAtBottom({ currentTarget }: React.UIEvent<HTMLDivElement>): boolean {
  return currentTarget.scrollTop + 10 >= currentTarget.scrollHeight - currentTarget.clientHeight;
}

function loadMoreRows(newRowsCount: number, length: number): Promise<Row[]> {
  return new Promise((resolve) => {
    const newRows: Row[] = [];

    for (let i = 0; i < newRowsCount; i++) {
      newRows[i] = createFakeRowObjectData(i + length);
    }

    setTimeout(() => resolve(newRows), 1000);
  });
}

function InfiniteScrolling() {
  const direction = useDirection();
  const [rows, setRows] = useState(() => createRows(50));
  const [isLoading, setIsLoading] = useState(false);

  async function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    if (isLoading || !isAtBottom(event)) return;

    setIsLoading(true);

    const newRows = await loadMoreRows(50, rows.length);

    setRows([...rows, ...newRows]);
    setIsLoading(false);
  }

  return (
    <>
      <DataGrid
        aria-label="Infinite Scrolling Example"
        columns={columns}
        rows={rows}
        rowKeyGetter={rowKeyGetter}
        onRowsChange={setRows}
        rowHeight={30}
        onScroll={handleScroll}
        className="fill-grid"
        direction={direction}
      />
      {isLoading && <div className={loadMoreRowsClassname}>Loading more rows...</div>}
    </>
  );
}
