import { useState, type JSX } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { css } from 'ecij';

import { DataGrid, type Column } from '../../src';
import { useDirection } from '../directionContext';

export const Route = createFileRoute('/DynamicHeightCells')({
  component: DynamicHeightCells
});

interface Row {
  id: number;
  task: string;
  complete: number;
  priority: string;
  issueType: string;
  startDate: string;
  completeDate: string;
  dynamicContent: JSX.Element;
}

const columns: Column<Row>[] = [
  {
    key: 'id',
    name: 'ID',
    width: 80
  },
  {
    key: 'task',
    name: 'Title'
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
  },
  {
    key: 'startDate',
    name: 'Start Date'
  },
  {
    key: 'completeDate',
    name: 'Expected Complete',
    width: 200
  },
  {
    key: 'dynamicContent',
    name: 'Dynamic HTML Content',
    width: 200
  }
];

function getRandomDate(start: Date, end: Date) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  ).toLocaleDateString();
}

function createRows(): Row[] {
  const rows = [];
  for (let i = 1; i < 500; i++) {
    rows.push({
      id: i,
      task: `Task ${i}`,
      complete: Math.min(100, Math.round(Math.random() * 110)),
      priority: ['Critical', 'High', 'Medium', 'Low'][Math.floor(Math.random() * 3 + 1)],
      issueType: ['Bug', 'Improvement', 'Epic', 'Story'][Math.floor(Math.random() * 3 + 1)],
      startDate: getRandomDate(new Date(2015, 3, 1), new Date()),
      completeDate: getRandomDate(new Date(), new Date(2016, 0, 1)),
      dynamicContent: (() => {
        const arr = [];
        for (let i = 0; i < Math.ceil(Math.random() * 6); i++) {
          arr.push(`Dynamic content ${i + 1}`);
        }
        return (
          <ul>
            {arr.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        );
      })()
    });
  }

  return rows;
}

const rootClassname = css`
  display: flex;
  flex-direction: column;
  block-size: 100%;
  gap: 10px;

  > .rdg {
    flex: 1;
  }

  .rdg-cell {
    padding-block: 0.75em;
  }
`;

function DynamicHeightCells() {
  const direction = useDirection();
  const [rows] = useState(createRows);

  return (
    <div className={rootClassname}>
      <DataGrid columns={columns} rows={rows} direction={direction} rowHeight="auto" />
    </div>
  );
}
