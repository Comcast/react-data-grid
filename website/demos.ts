import type { FileRoutesByTo } from './routeTree.gen';

interface Demo {
  readonly path: keyof FileRoutesByTo;
  readonly label: string;
}

// in navigation order
export const demos: readonly Demo[] = [
  { path: '/CommonFeatures', label: 'Common Features' },
  { path: '/AllFeatures', label: 'All Features' },
  { path: '/CellNavigation', label: 'Cell Navigation' },
  { path: '/ColumnSpanning', label: 'Column Spanning' },
  { path: '/ColumnGrouping', label: 'Column Grouping' },
  { path: '/ColumnsReordering', label: 'Columns Reordering' },
  { path: '/ContextMenu', label: 'Context Menu' },
  { path: '/CustomizableRenderers', label: 'Customizable Renderers' },
  { path: '/RowGrouping', label: 'Row Grouping' },
  { path: '/HeaderFilters', label: 'Header Filters' },
  { path: '/InfiniteScrolling', label: 'Infinite Scrolling' },
  { path: '/MasterDetail', label: 'Master Detail' },
  { path: '/MillionCells', label: 'A Million Cells' },
  { path: '/NoRows', label: 'No Rows' },
  { path: '/ResizableGrid', label: 'Resizable Grid' },
  { path: '/RowsReordering', label: 'Rows Reordering' },
  { path: '/ScrollToCell', label: 'Scroll to Cell' },
  { path: '/TreeView', label: 'Tree View' },
  { path: '/VariableRowHeight', label: 'Variable Row Height' },
  { path: '/Animation', label: 'Animation' }
];
