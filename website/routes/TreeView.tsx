import { useMemo, useReducer, useState } from 'react';
import { css } from '@nstep/ecis';

import { DataGrid, type Column } from '../../src';
import { CellExpanderFormatter, ChildRowDeleteButton } from '../components';
import { useDirection } from '../directionContext';

export const Route = createFileRoute({
  component: TreeView
});

const gridClassname = css`
  block-size: 600px;
`;

interface Row {
  id: string;
  name: string;
  format: string;
  position: string;
  price: number;
  children?: Row[];
  parentId?: string;
  isExpanded?: boolean;
}

interface Action {
  type: 'toggleSubRow' | 'deleteSubRow';
  id: string;
}

function createRows(): Row[] {
  const rows = [];
  for (let i = 0; i < 100; i++) {
    const price = Math.random() * 30;
    const id = `row${i}`;
    const row: Row = {
      id,
      name: `supplier ${i}`,
      format: `package ${i}`,
      position: 'Run of site',
      price,
      children: [
        {
          id: `${id}-0`,
          parentId: id,
          name: `supplier ${i}`,
          format: '728x90',
          position: 'run of site',
          price: price / 2
        },
        {
          id: `${id}-1`,
          parentId: id,
          name: `supplier ${i}`,
          format: '480x600',
          position: 'run of site',
          price: price * 0.25
        },
        {
          id: `${id}-2`,
          parentId: id,
          name: `supplier ${i}`,
          format: '328x70',
          position: 'run of site',
          price: price * 0.25
        }
      ],
      isExpanded: false
    };
    rows.push(row);
  }
  return rows;
}

function toggleSubRow(rows: Row[], id: string): Row[] {
  const rowIndex = rows.findIndex((r) => r.id === id);
  const row = rows[rowIndex];
  const { children } = row;
  if (!children) return rows;

  const newRows = rows.with(rowIndex, { ...row, isExpanded: !row.isExpanded });
  if (row.isExpanded) {
    newRows.splice(rowIndex + 1, children.length);
  } else {
    newRows.splice(rowIndex + 1, 0, ...children);
  }
  return newRows;
}

function deleteSubRow(rows: Row[], id: string): Row[] {
  const row = rows.find((r) => r.id === id);
  if (row?.parentId === undefined) return rows;

  // Remove sub row from flattened rows.
  const newRows = rows.filter((r) => r.id !== id);

  // Remove sub row from parent row.
  const parentRowIndex = newRows.findIndex((r) => r.id === row.parentId);
  const { children } = newRows[parentRowIndex];
  if (children) {
    const newChildren = children.filter((sr) => sr.id !== id);
    newRows[parentRowIndex] = { ...newRows[parentRowIndex], children: newChildren };
  }

  return newRows;
}

function reducer(rows: Row[], { type, id }: Action): Row[] {
  switch (type) {
    case 'toggleSubRow':
      return toggleSubRow(rows, id);
    case 'deleteSubRow':
      return deleteSubRow(rows, id);
    default:
      return rows;
  }
}

const defaultRows = createRows();

function TreeView() {
  const direction = useDirection();
  const [rows, dispatch] = useReducer(reducer, defaultRows);
  const [allowDelete, setAllowDelete] = useState(true);

  const columns = useMemo((): readonly Column<Row>[] => {
    return [
      {
        key: 'id',
        name: 'id',
        frozen: true
      },
      {
        key: 'name',
        name: 'Name'
      },
      {
        key: 'format',
        name: 'format',
        renderCell({ row, tabIndex }) {
          const hasChildren = row.children !== undefined;
          const style = hasChildren ? undefined : { marginInlineStart: 30 };
          return (
            <div
              className={css`
                display: flex;
                gap: 10px;
                block-size: 100%;
                align-items: center;
              `}
            >
              {hasChildren && (
                <CellExpanderFormatter
                  tabIndex={tabIndex}
                  expanded={row.isExpanded === true}
                  onCellExpand={() => dispatch({ id: row.id, type: 'toggleSubRow' })}
                />
              )}
              {!hasChildren && (
                <ChildRowDeleteButton
                  tabIndex={tabIndex}
                  isDeleteSubRowEnabled={allowDelete}
                  onDeleteSubRow={() => dispatch({ id: row.id, type: 'deleteSubRow' })}
                />
              )}
              <div style={style}>{row.format}</div>
            </div>
          );
        }
      },
      {
        key: 'position',
        name: 'position'
      },
      {
        key: 'price',
        name: 'price'
      }
    ];
  }, [allowDelete]);

  return (
    <>
      <label>
        Allow Delete
        <input
          type="checkbox"
          checked={allowDelete}
          onChange={() => setAllowDelete(!allowDelete)}
        />
      </label>
      <DataGrid
        aria-label="TreeView Example"
        columns={columns}
        rows={rows}
        className={gridClassname}
        direction={direction}
      />
    </>
  );
}
