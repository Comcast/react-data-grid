import { useId, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';

import type { CellKeyboardEvent, CellKeyDownArgs, Column } from '../../src';
import { DataGrid } from '../../src';
import { useDirection } from '../directionContext';

export const Route = createFileRoute('/CellNavigation')({
  component: CellNavigation
});

interface Row {
  id: number;
  task: string;
  complete: number;
  priority: string;
  issueType: string;
  startDate: string;
  completeDate: string;
}

type CellNavigationMode = 'NONE' | 'CHANGE_ROW' | 'LOOP_OVER_ROW' | 'LOOP_OVER_COLUMN' | 'NO_TAB';

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
      completeDate: getRandomDate(new Date(), new Date(2016, 0, 1))
    });
  }

  return rows;
}

function CellNavigation() {
  const groupId = useId();
  const direction = useDirection();
  const [rows] = useState(createRows);
  const [cellNavigationMode, setCellNavigationMode] = useState<CellNavigationMode>('CHANGE_ROW');

  function handleCellKeyDown(args: CellKeyDownArgs<Row>, event: CellKeyboardEvent) {
    if (args.mode === 'EDIT') return;
    const { column, rowIdx, selectCell } = args;
    const idx = column?.idx ?? -1;
    const { key, shiftKey } = event;

    const preventDefault = () => {
      event.preventGridDefault();
      event.preventDefault();
    };

    const loopOverNavigation = () => {
      if ((key === 'ArrowRight' || (key === 'Tab' && !shiftKey)) && idx === columns.length - 1) {
        selectCell({ rowIdx, idx: 0 });
        preventDefault();
      } else if ((key === 'ArrowLeft' || (key === 'Tab' && shiftKey)) && idx === 0) {
        selectCell({ rowIdx, idx: columns.length - 1 });
        preventDefault();
      }
    };

    const changeRowNavigation = () => {
      if (key === 'ArrowRight' && idx === columns.length - 1) {
        if (rows.length === 0) return;
        if (rowIdx === -1) {
          selectCell({ rowIdx: 0, idx: 0 });
        } else {
          if (rowIdx === rows.length - 1) return;
          selectCell({ rowIdx: rowIdx + 1, idx: 0 });
        }
        preventDefault();
      } else if (key === 'ArrowLeft' && idx === 0) {
        if (rowIdx === -1) return;
        selectCell({ rowIdx: rowIdx - 1, idx: columns.length - 1 });
        preventDefault();
      }
    };

    const loopOverColumnNavigation = () => {
      let newRowIdx: number;
      if (rowIdx === -1) {
        newRowIdx = shiftKey ? rows.length - 1 : 0;
      } else {
        newRowIdx = shiftKey ? rowIdx - 1 : rowIdx === rows.length - 1 ? -1 : rowIdx + 1;
      }
      selectCell({ rowIdx: newRowIdx, idx });
      preventDefault();
    };

    if (cellNavigationMode === 'LOOP_OVER_ROW') {
      loopOverNavigation();
    } else if (cellNavigationMode === 'CHANGE_ROW') {
      changeRowNavigation();
    } else if (cellNavigationMode === 'LOOP_OVER_COLUMN' && key === 'Tab') {
      loopOverColumnNavigation();
    } else if (cellNavigationMode === 'NO_TAB' && key === 'Tab') {
      // Need to allow default event to focus the next element
      event.preventGridDefault();
    }
  }

  return (
    <>
      <div role="radiogroup" aria-labelledby={groupId} style={{ marginBlockEnd: 5 }}>
        <span id={groupId}>Cell Navigation Modes:</span>
        <label>
          <input
            type="radio"
            name="mode"
            checked={cellNavigationMode === 'NONE'}
            onChange={() => setCellNavigationMode('NONE')}
          />
          None
        </label>
        <label>
          <input
            type="radio"
            name="mode"
            checked={cellNavigationMode === 'CHANGE_ROW'}
            onChange={() => setCellNavigationMode('CHANGE_ROW')}
          />
          Change Row
        </label>
        <label>
          <input
            type="radio"
            name="mode"
            checked={cellNavigationMode === 'LOOP_OVER_ROW'}
            onChange={() => setCellNavigationMode('LOOP_OVER_ROW')}
          />
          Loop Over Row
        </label>
        <label>
          <input
            type="radio"
            name="mode"
            checked={cellNavigationMode === 'LOOP_OVER_COLUMN'}
            onChange={() => setCellNavigationMode('LOOP_OVER_COLUMN')}
          />
          Loop Over Column
        </label>
        <label>
          <input
            type="radio"
            name="mode"
            checked={cellNavigationMode === 'NO_TAB'}
            onChange={() => setCellNavigationMode('NO_TAB')}
          />
          No Tab
        </label>
      </div>
      <DataGrid
        aria-label="Cell Navigation Example"
        columns={columns}
        rows={rows}
        direction={direction}
        onCellKeyDown={handleCellKeyDown}
      />
    </>
  );
}
