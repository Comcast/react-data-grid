import { createFileRoute } from '@tanstack/react-router';

import { DataGrid, type ColumnOrColumnGroup } from '../../src';
import { renderCoordinates } from '../renderers';
import { useDirection } from '../directionContext';

export const Route = createFileRoute('/ColumnGrouping')({
  component: ColumnGrouping
});

const columns: readonly ColumnOrColumnGroup<number, number>[] = [
  { key: '1', name: 'Column 1' },
  {
    name: 'Group 1',
    children: [
      { key: '2', name: 'Column 2' },
      { key: '3', name: 'Column 3' }
    ]
  },
  { key: '4', name: 'Column 4' },
  { name: 'empty group', children: [] },
  {
    name: 'deep empty group',
    children: [
      {
        name: '',
        children: [
          {
            name: '',
            children: [
              { name: '', children: [{ name: '', children: [{ name: '', children: [] }] }] }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'empty group',
    children: [
      { name: 'empty subgroup', children: [] },
      { name: 'empty subgroup', children: [] },
      { name: 'empty subgroup', children: [] }
    ]
  },
  {
    name: 'Group 2',
    children: [
      {
        name: 'Subgroup 2-1',
        children: [
          {
            name: 'empty subgroup',
            children: [
              { name: 'empty subgroup', children: [] },
              { name: 'empty subgroup', children: [] },
              { name: 'empty subgroup', children: [] }
            ]
          },
          {
            name: 'Subgroup 2-1-1',
            children: [{ key: '5', name: 'Column 5' }]
          }
        ]
      },
      { key: '6', name: 'Column 6' },
      { key: '7', name: 'Column 7' },
      {
        name: 'Subgroup 2-2',
        children: [{ key: '8', name: 'Column 8' }]
      }
    ]
  },
  {
    name: 'Group 3',
    children: [
      { key: '9', name: 'Column 9' },
      {
        name: 'Subgroup 3-1',
        children: [
          {
            name: 'Subgroup 3-1-1',
            children: [
              { key: '10', name: 'Column 10' },
              { key: '11', name: 'Column 11' }
            ]
          }
        ]
      },
      { key: '12', name: 'Column 12' }
    ]
  }
];

const rows: readonly number[] = Array.from({ length: 100 }, (_, i) => i);

function ColumnGrouping() {
  const direction = useDirection();

  return (
    <DataGrid
      aria-label="Column Grouping Example"
      columns={columns}
      rows={rows}
      topSummaryRows={[0]}
      bottomSummaryRows={[6]}
      className="fill-grid"
      direction={direction}
      defaultColumnOptions={{
        resizable: true,
        renderCell: renderCoordinates
      }}
    />
  );
}
