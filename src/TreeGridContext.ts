import { createContext } from 'react';

// Internal: `TreeDataGrid` provides `true` around its `DataGrid`, which provides `false` to its own
// children, so a `DataGrid` rendered in a cell of a `TreeDataGrid` isn't treated as a tree grid
export const TreeGridContext = createContext(false);
TreeGridContext.displayName = 'TreeGridContext';
