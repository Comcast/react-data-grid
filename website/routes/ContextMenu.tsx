import { useLayoutEffect, useReducer, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { faker } from '@faker-js/faker';
import { css } from 'ecij';

import { DataGrid, type Column } from '../../src';
import { useDirection } from '../directionContext';

export const Route = createFileRoute({
  component: ContextMenuDemo
});

const contextMenuClassname = css`
  position: absolute;
  background-color: #ffffff;
  border: 1px solid black;
  padding: 16px;
  list-style: none;

  > li {
    padding: 8px;
  }
`;

interface Row {
  id: number;
  product: string;
  price: string;
}

function createRows(): readonly Row[] {
  const rows: Row[] = [];

  for (let i = 1; i < 1000; i++) {
    rows.push({
      id: i,
      product: faker.commerce.productName(),
      price: faker.commerce.price()
    });
  }

  return rows;
}

const columns: readonly Column<Row>[] = [
  { key: 'id', name: 'ID' },
  { key: 'product', name: 'Product' },
  { key: 'price', name: 'Price' }
];

function rowKeyGetter(row: Row) {
  return row.id;
}

function ContextMenuDemo() {
  const direction = useDirection();
  const [rows, setRows] = useState(createRows);
  const [nextId, setNextId] = useReducer((id: number) => id + 1, rows[rows.length - 1].id + 1);
  const [contextMenuProps, setContextMenuProps] = useState<{
    rowIdx: number;
    top: number;
    left: number;
  } | null>(null);
  const menuRef = useRef<HTMLMenuElement>(null);
  const isContextMenuOpen = contextMenuProps !== null;

  useLayoutEffect(() => {
    if (!isContextMenuOpen) return;

    function onMouseDown(event: MouseEvent) {
      if (event.target instanceof Node && menuRef.current?.contains(event.target)) {
        return;
      }
      setContextMenuProps(null);
    }

    window.addEventListener('mousedown', onMouseDown);

    return () => {
      window.removeEventListener('mousedown', onMouseDown);
    };
  }, [isContextMenuOpen]);

  function insertRow(insertRowIdx: number) {
    const newRow: Row = {
      id: nextId,
      product: faker.commerce.productName(),
      price: faker.commerce.price()
    };

    setRows(rows.toSpliced(insertRowIdx, 0, newRow));
    setNextId();
  }

  return (
    <>
      <DataGrid
        aria-label="Context Menu Example"
        rowKeyGetter={rowKeyGetter}
        columns={columns}
        rows={rows}
        className="fill-grid"
        direction={direction}
        onCellContextMenu={({ row }, event) => {
          event.preventGridDefault();
          // Do not show the default context menu
          event.preventDefault();
          setContextMenuProps({
            rowIdx: rows.indexOf(row),
            top: event.clientY,
            left: event.clientX
          });
        }}
      />
      {isContextMenuOpen &&
        createPortal(
          <menu
            ref={menuRef}
            className={contextMenuClassname}
            style={{
              top: contextMenuProps.top,
              left: contextMenuProps.left
            }}
          >
            <li>
              <button
                type="button"
                onClick={() => {
                  setRows(rows.toSpliced(contextMenuProps.rowIdx, 1));
                  setContextMenuProps(null);
                }}
              >
                Delete Row
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  const { rowIdx } = contextMenuProps;
                  insertRow(rowIdx);
                  setContextMenuProps(null);
                }}
              >
                Insert Row Above
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  const { rowIdx } = contextMenuProps;
                  insertRow(rowIdx + 1);
                  setContextMenuProps(null);
                }}
              >
                Insert Row Below
              </button>
            </li>
          </menu>,
          document.body
        )}
    </>
  );
}
