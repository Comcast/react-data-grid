import { useState } from 'react';
import { css } from '@linaria/core';

import { DataGrid, type Column } from '../../src';
import { useDirection } from '../directionContext';

export const Route = createFileRoute({
  component: Animation
});

const rangeClassname = css`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const transitionClassname = css`
  transition: grid-template-rows 0.5s ease;
`;

interface Row {
  readonly id: number;
  readonly task: string;
  readonly complete: number;
  readonly priority: string;
  readonly issueType: string;
}

function createRows(): Row[] {
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
    resizable: true
  },
  {
    key: 'priority',
    name: 'Priority',
    resizable: true
  },
  {
    key: 'issueType',
    name: 'Issue Type',
    resizable: true
  },
  {
    key: 'complete',
    name: '% Complete',
    resizable: true
  }
];

const rows = createRows();

function Animation() {
  const direction = useDirection();
  const [rowHeight, setRowHeight] = useState(30);

  return (
    <>
      <div className={rangeClassname}>
        Row Height
        <button type="button" onClick={() => setRowHeight(30)}>
          Small
        </button>
        <button type="button" onClick={() => setRowHeight(60)}>
          Medium
        </button>
        <button type="button" onClick={() => setRowHeight(90)}>
          Large
        </button>
      </div>
      <DataGrid
        aria-label="Animation Example"
        className={`${transitionClassname} fill-grid`}
        columns={columns}
        rows={rows}
        direction={direction}
        rowHeight={rowHeight}
      />
    </>
  );
}
