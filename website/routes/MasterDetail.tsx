import { useMemo, useState } from 'react';
import { faker } from '@faker-js/faker';
import { createFileRoute } from '@tanstack/react-router';
import { css } from 'ecij';

import { DataGrid, type Column, type Direction, type RowsChangeData } from '../../src';
import { CellExpanderFormatter } from '../components';
import { useDirection } from '../directionContext';

export const Route = createFileRoute('/MasterDetail')({
  component: MasterDetail
});

type DepartmentRow =
  | {
      type: 'MASTER';
      id: number;
      department: string;
      expanded: boolean;
    }
  | {
      type: 'DETAIL';
      id: number;
      parentId: number;
    };

interface ProductRow {
  id: number;
  product: string;
  description: string;
  price: string;
}

function createDepartments(): readonly DepartmentRow[] {
  const departments: DepartmentRow[] = [];
  for (let i = 1; i < 30; i++) {
    departments.push({
      type: 'MASTER',
      id: i,
      department: faker.commerce.department(),
      expanded: false
    });
  }
  return departments;
}

const productsMap = new Map<number, readonly ProductRow[]>();

function getProducts(parentId: number): readonly ProductRow[] {
  if (productsMap.has(parentId)) return productsMap.get(parentId)!;
  const products: ProductRow[] = [];
  for (let i = 0; i < 20; i++) {
    products.push({
      id: i,
      product: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: faker.commerce.price()
    });
  }
  productsMap.set(parentId, products);
  return products;
}

const productColumns: readonly Column<ProductRow>[] = [
  { key: 'id', name: 'ID', width: 35 },
  { key: 'product', name: 'Product' },
  { key: 'description', name: 'Description' },
  { key: 'price', name: 'Price' }
];

function MasterDetail() {
  const direction = useDirection();

  const columns = useMemo((): readonly Column<DepartmentRow>[] => {
    return [
      {
        key: 'expanded',
        name: '',
        minWidth: 30,
        width: 30,
        colSpan(args) {
          return args.type === 'ROW' && args.row.type === 'DETAIL' ? 3 : undefined;
        },
        cellClass(row) {
          return row.type === 'DETAIL'
            ? css`
                padding: 24px;
              `
            : undefined;
        },
        renderCell({ row, tabIndex, onRowChange }) {
          if (row.type === 'DETAIL') {
            return <ProductGrid parentId={row.parentId} direction={direction} />;
          }

          return (
            <CellExpanderFormatter
              expanded={row.expanded}
              tabIndex={tabIndex}
              onCellExpand={() => {
                onRowChange({ ...row, expanded: !row.expanded });
              }}
            />
          );
        }
      },
      { key: 'id', name: 'ID', width: 35 },
      { key: 'department', name: 'Department' }
    ];
  }, [direction]);
  const [rows, setRows] = useState(createDepartments);

  function onRowsChange(rows: DepartmentRow[], { indexes }: RowsChangeData<DepartmentRow>) {
    const row = rows[indexes[0]];
    if (row.type === 'MASTER') {
      if (row.expanded) {
        rows.splice(indexes[0] + 1, 0, {
          type: 'DETAIL',
          id: row.id + 100,
          parentId: row.id
        });
      } else {
        rows.splice(indexes[0] + 1, 1);
      }
      setRows(rows);
    }
  }

  return (
    <DataGrid
      aria-label="Master Detail Example"
      rowKeyGetter={rowKeyGetter}
      columns={columns}
      rows={rows}
      onRowsChange={onRowsChange}
      headerRowHeight={45}
      rowHeight={(row) => (row.type === 'DETAIL' ? 300 : 45)}
      className="fill-grid"
      enableVirtualization={false}
      direction={direction}
      onCellKeyDown={(_, event) => {
        if (event.isDefaultPrevented()) {
          // skip parent grid keyboard navigation if nested grid handled it
          event.preventGridDefault();
        }
      }}
    />
  );
}

function ProductGrid({ parentId, direction }: { parentId: number; direction: Direction }) {
  const products = getProducts(parentId);

  return (
    <DataGrid
      rows={products}
      columns={productColumns}
      rowKeyGetter={rowKeyGetter}
      style={{ blockSize: 250 }}
      direction={direction}
    />
  );
}

function rowKeyGetter(row: DepartmentRow | ProductRow) {
  return row.id;
}
