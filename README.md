# react-data-grid

[![npm-badge]][npm-url]
[![type-badge]][npm-url]
[![size-badge]][size-url]
[![codecov-badge]][codecov-url]
[![ci-badge]][ci-url]

The DataGrid component is designed to handle large datasets efficiently while offering a rich set of features for customization and interactivity.

## Table of Contents

- [Features](#features)
- [Links](#links)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Styling and Customization](#styling-and-customization)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [API Reference](#api-reference)

## Features

- [React 19.2+](package.json) support
- Evergreen browsers and server-side rendering support
- Tree-shaking support with no external dependencies to keep your bundles slim
- Great performance thanks to virtualization: columns and rows outside the viewport are not rendered
- Strictly typed with TypeScript
- [Keyboard accessibility](https://comcast.github.io/react-data-grid/#/CommonFeatures)
- Light and dark mode support out of the box via `color-scheme`
- [Frozen columns](https://comcast.github.io/react-data-grid/#/CommonFeatures): Freeze columns to keep them visible during horizontal scrolling.
- [Column resizing](https://comcast.github.io/react-data-grid/#/CommonFeatures)
- [Multi-column sorting](https://comcast.github.io/react-data-grid/#/CommonFeatures)
  - Click on a sortable column header to toggle between its ascending/descending sort order
  - Ctrl+Click / Meta+Click to sort an additional column
- [Column spanning](https://comcast.github.io/react-data-grid/#/ColumnSpanning)
- [Column grouping](https://comcast.github.io/react-data-grid/#/ColumnGrouping)
- [Row selection](https://comcast.github.io/react-data-grid/#/CommonFeatures)
- [Row grouping](https://comcast.github.io/react-data-grid/#/RowGrouping)
- [Summary rows](https://comcast.github.io/react-data-grid/#/CommonFeatures)
- [Dynamic row heights](https://comcast.github.io/react-data-grid/#/VariableRowHeight)
- [No rows fallback](https://comcast.github.io/react-data-grid/#/NoRows)
- [Cell formatting](https://comcast.github.io/react-data-grid/#/CommonFeatures)
- [Cell editing](https://comcast.github.io/react-data-grid/#/CommonFeatures)
- [Cell copying / pasting](https://comcast.github.io/react-data-grid/#/AllFeatures)
- [Cell value dragging / filling](https://comcast.github.io/react-data-grid/#/AllFeatures)
- [Customizable renderers](https://comcast.github.io/react-data-grid/#/CustomizableRenderers)
- Right-to-left (RTL) support

## Links

- [Examples website](https://comcast.github.io/react-data-grid/)
  - [Source code](website)
- [Releases](https://github.com/Comcast/react-data-grid/releases)

## Installation

Install `react-data-grid` using your favorite package manager:

```sh
# npm
npm install react-data-grid
# Vite+
vp add react-data-grid
# pnpm
pnpm add react-data-grid
# Yarn
yarn add react-data-grid
# Bun
bun add react-data-grid
```

Additionally, import the default styles in your application:

```tsx
import 'react-data-grid/lib/styles.css';
```

`react-data-grid` is published as ECMAScript modules for evergreen browsers, bundlers, and server-side rendering.

> **Important**  
> Vite 8+ uses Lightning CSS by default to minify CSS, and Lightning CSS has a [bug minifying the `light-dark()` syntax](https://github.com/parcel-bundler/lightningcss/issues/873). You can tweak the `cssMinify` or `cssTarget` [settings](https://vite.dev/config/build-options) as a workaround.

```ts
build: {
  cssMinify: 'esbuild', // requires the `esbuild` package to be installed
  // or
  cssTarget: 'esnext'
}
```

## Getting Started

Here is a basic example of how to use `react-data-grid` in your React application:

```tsx
import 'react-data-grid/lib/styles.css';

import { DataGrid, type Column } from 'react-data-grid';

interface Row {
  id: number;
  title: string;
}

const columns: readonly Column<Row>[] = [
  { key: 'id', name: 'ID' },
  { key: 'title', name: 'Title' }
];

const rows: readonly Row[] = [
  { id: 0, title: 'Example' },
  { id: 1, title: 'Demo' }
];

function App() {
  return <DataGrid columns={columns} rows={rows} />;
}
```

## Styling and Customization

The DataGrid provides multiple ways to customize its appearance and behavior.

### Light/Dark Themes

The DataGrid supports both light and dark color schemes out of the box using the `light-dark()` CSS function. The theme automatically adapts based on the user's system preference when `color-scheme: light dark;` is set.

To enforce a specific theme, we recommend setting the standard `color-scheme` CSS property on the `:root`:

```css
:root {
  color-scheme: light; /* or 'dark', or 'light dark' for auto */
}
```

Alternatively, you can add the `rdg-light` or `rdg-dark` class to individual grids:

```tsx
// Force light theme
<DataGrid className="rdg-light" columns={columns} rows={rows} />

// Force dark theme
<DataGrid className="rdg-dark" columns={columns} rows={rows} />
```

### Forced Colors Mode

In [forced colors mode](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors), such as Windows contrast themes, the DataGrid uses system colors for the active cell, row selection, and the drag handle, so they follow the user's palette. Overriding `--rdg-selection-color` or `--rdg-checkbox-focus-color` in your own styles also overrides their forced colors values outside selected rows, so wrap such overrides in `@media not (forced-colors: active)`.

### CSS Variables

The DataGrid supports the following CSS variables for customization:

```css
.rdg {
  /* Selection */
  --rdg-selection-width: 2px;
  --rdg-selection-color: hsl(207, 75%, 66%);

  /* Typography */
  --rdg-font-size: 14px;

  /* Colors (using light-dark() for automatic theme switching) */
  --rdg-color: light-dark(#000, #ddd);
  --rdg-background-color: light-dark(hsl(0deg 0% 100%), hsl(0deg 0% 13%));

  /* Header */
  --rdg-header-background-color: light-dark(hsl(0deg 0% 97.5%), hsl(0deg 0% 10.5%));
  --rdg-header-draggable-background-color: light-dark(hsl(0deg 0% 90.5%), hsl(0deg 0% 17.5%));

  /* Rows */
  --rdg-row-hover-background-color: light-dark(hsl(0deg 0% 96%), hsl(0deg 0% 9%));
  --rdg-row-selected-background-color: light-dark(hsl(207deg 76% 92%), hsl(207deg 76% 42%));
  --rdg-row-selected-hover-background-color: light-dark(hsl(207deg 76% 88%), hsl(207deg 76% 38%));

  /* Borders */
  --rdg-border-width: 1px;
  --rdg-border-color: light-dark(#ddd, #444);
  --rdg-summary-border-width: calc(var(--rdg-border-width) * 2);
  --rdg-summary-border-color: light-dark(#aaa, #555);

  /* Checkboxes */
  --rdg-checkbox-focus-color: hsl(207deg 100% 69%);

  /* Frozen columns */
  --rdg-frozen-column-shadow-color: light-dark(rgb(0 0 0 / 15%), rgb(0 0 0 / 40%));
}
```

Example of customizing colors:

```css
.my-custom-grid {
  --rdg-background-color: #f0f0f0;
  --rdg-selection-color: #ff6b6b;
  --rdg-font-size: 16px;
}
```

```tsx
<DataGrid className="my-custom-grid" columns={columns} rows={rows} />
```

### Standard Props

The DataGrid accepts standard [`className`](#classname 'DataGridProps.className') and [`style`](#style 'DataGridProps.style') props:

```tsx
<DataGrid
  columns={columns}
  rows={rows}
  className="my-grid custom-theme"
  style={{ width: 800, height: 600 }}
/>
```

### Row and Cell Styling

#### Row Heights

Control row heights using the [`rowHeight`](#rowheight 'DataGridProps.rowHeight'), [`headerRowHeight`](#headerrowheight 'DataGridProps.headerRowHeight'), and [`summaryRowHeight`](#summaryrowheight 'DataGridProps.summaryRowHeight') props. The `rowHeight` prop supports both fixed heights and dynamic heights per row.

#### Row Classes

Apply custom CSS classes to rows using the [`rowClass`](#rowclass 'DataGridProps.rowClass') prop, and to header rows using the [`headerRowClass`](#headerrowclass 'DataGridProps.headerRowClass') prop.

#### Cell Classes

Apply custom CSS classes to cells using the [`cellClass`](#cellclass 'Column.cellClass') property in column definitions. You can also use [`headerCellClass`](#headercellclass 'Column.headerCellClass') and [`summaryCellClass`](#summarycellclass 'Column.summaryCellClass') for header and summary cells, respectively.

#### Column Widths

Control column widths using the [`width`](#width 'Column.width'), [`minWidth`](#minwidth 'Column.minWidth'), and [`maxWidth`](#maxwidth 'Column.maxWidth') properties in column definitions. Enable column resizing using the [`resizable`](#resizable 'Column.resizable') property, or use [`defaultColumnOptions`](#defaultcolumnoptions 'DataGridProps.defaultColumnOptions') to apply it to all columns.

### Custom Renderers

Replace default components with custom implementations using the [`renderers`](#renderers 'DataGridProps.renderers') prop. Columns can also have custom renderers using the [`renderCell`](#rendercell 'Column.renderCell'), [`renderHeaderCell`](#renderheadercell-1 'Column.renderHeaderCell'), [`renderSummaryCell`](#rendersummarycell 'Column.renderSummaryCell'), [`renderGroupCell`](#rendergroupcell 'Column.renderGroupCell'), and [`renderEditCell`](#rendereditcell 'Column.renderEditCell') properties.

## Keyboard Shortcuts

<kbd>Ctrl</kbd> also accepts <kbd>⌘</kbd>, as macOS uses <kbd>Ctrl</kbd>+<kbd>←</kbd>/<kbd>→</kbd> to switch desktops. In right-to-left grids, <kbd>←</kbd> and <kbd>→</kbd> are swapped. See [`onCellKeyDown`](#oncellkeydown 'DataGridProps.onCellKeyDown') to customize them.

### Navigation

| Keys                                                             | Action                                                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd>              | Move to the adjacent cell                                                            |
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd>                 | Move to the next or previous cell. Focus leaves the grid from the last or first cell |
| <kbd>Home</kbd> / <kbd>End</kbd>                                 | Move to the first or last cell of the row                                            |
| <kbd>Ctrl</kbd>+<kbd>Home</kbd> / <kbd>Ctrl</kbd>+<kbd>End</kbd> | Move to the first header cell or the last cell of the last row                       |
| <kbd>Page Up</kbd> / <kbd>Page Down</kbd>                        | Move up or down by one page of rows                                                  |

### Editing

| Keys                                                        | Action                                                                                                                                   |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Typing or <kbd>Enter</kbd>                                  | Open the [editor](#rendereditcell 'Column.renderEditCell')                                                                               |
| <kbd>Enter</kbd> / <kbd>Escape</kbd>                        | Commit or discard the changes and close the editor                                                                                       |
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd>            | Commit the changes and move to the next or previous cell                                                                                 |
| <kbd>Ctrl</kbd>+<kbd>C</kbd> / <kbd>Ctrl</kbd>+<kbd>V</kbd> | Copy or paste, with [`onCellCopy`](#oncellcopy 'DataGridProps.onCellCopy') and [`onCellPaste`](#oncellpaste 'DataGridProps.onCellPaste') |

### Selection

| Keys                              | Action                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------- |
| <kbd>Shift</kbd>+<kbd>Space</kbd> | Select or deselect the [row](#selectedrows 'DataGridProps.selectedRows') of the active cell |

### Header Cells

| Keys                                                                | Action                                                       |
| ------------------------------------------------------------------- | ------------------------------------------------------------ |
| <kbd>Enter</kbd> / <kbd>Space</kbd>                                 | [Sort](#sortable 'Column.sortable') by the column            |
| <kbd>Ctrl</kbd>+<kbd>Enter</kbd> / <kbd>Ctrl</kbd>+<kbd>Space</kbd> | Add the column to the sort, keeping the other sorted columns |
| <kbd>Ctrl</kbd>+<kbd>←</kbd> / <kbd>Ctrl</kbd>+<kbd>→</kbd>         | [Resize](#resizable 'Column.resizable') the column           |

See [`TreeDataGrid`](#treedatagrid-) for the keys that expand and collapse groups.

## API Reference

<!-- api:start -->

### Components

#### `<DataGrid />`

Main API component to render a data grid of rows and columns

**Example:**

```tsx
<DataGrid columns={columns} rows={rows} />
```

##### DataGridProps

###### `ref?`

```tsx
ref?: Maybe<React.Ref<DataGridHandle>>;
```

Optional ref for imperative APIs like scrolling to or focusing a cell. See [`DataGridHandle`](#datagridhandle).

###### `columns`

```tsx
columns: readonly ColumnOrColumnGroup<R, SR>[];
```

An array of column definitions and/or column groups. See the [`ColumnOrColumnGroup`](#columnorcolumngroup) type for all available options.

⚠️ **Performance:** Passing a new `columns` array will trigger a re-render and recalculation for the entire grid. Always memoize this prop using `useMemo` or define it outside the component to avoid unnecessary re-renders.

###### `rows`

```tsx
rows: readonly R[];
```

An array of rows. The row data can be of any type.

💡 **Performance:** The grid is optimized for efficient rendering:

- **Virtualization**: Only visible rows are rendered in the DOM
- **Individual row updates**: Row components are memoized, so updating a single row object will only re-render that specific row, not all rows
- **Array reference matters**: Changing the array reference itself (e.g., `setRows([...rows])`) triggers viewport and layout recalculations, even if the row objects are unchanged
- **Best practice**: When updating rows, create a new array but reuse unchanged row objects. For example:

  ```tsx
  // ✅ Good: Only the changed row is re-rendered
  setRows(rows.map((row, idx) => (idx === targetIdx ? { ...row, updated: true } : row)));

  // ❌ Avoid: Creates new references for all rows, causing all visible rows to re-render
  setRows(rows.map((row) => ({ ...row })));
  ```

###### `topSummaryRows?`

```tsx
topSummaryRows?: Maybe<readonly SR[]>;
```

Rows pinned at the top of the grid for summary purposes.

⚠️ **Performance:** Memoize this array to prevent internal memoization invalidation.

###### `bottomSummaryRows?`

```tsx
bottomSummaryRows?: Maybe<readonly SR[]>;
```

Rows pinned at the bottom of the grid for summary purposes.

⚠️ **Performance:** Memoize this array to prevent internal memoization invalidation.

###### `rowKeyGetter?`

```tsx
rowKeyGetter?: Maybe<(row: R) => K>;
```

Function to return a unique key/identifier for each row. `rowKeyGetter` is required for row selection to work.

```tsx
import { DataGrid } from 'react-data-grid';

interface Row {
  id: number;
  name: string;
}

function rowKeyGetter(row: Row) {
  return row.id;
}

function MyGrid() {
  return <DataGrid columns={columns} rows={rows} rowKeyGetter={rowKeyGetter} />;
}
```

💡 While optional, setting this prop is recommended for optimal performance, as the returned value is used to set the `key` prop on the row elements.

⚠️ **Performance:** Define this function outside your component or memoize it with `useCallback` to prevent unnecessary re-renders.

###### `onRowsChange?`

```tsx
onRowsChange?: Maybe<(rows: R[], data: RowsChangeData<R, SR>) => void>;
```

Callback triggered when rows are changed.

The first parameter is a new rows array with both the updated rows and the other untouched rows.
The second parameter is an object with an `indexes` array highlighting which rows have changed by their index, and the `column` where the change happened. See the [`RowsChangeData`](#rowschangedata) type.

```tsx
import { useState } from 'react';
import { DataGrid } from 'react-data-grid';

function MyGrid() {
  const [rows, setRows] = useState(initialRows);

  return <DataGrid columns={columns} rows={rows} onRowsChange={setRows} />;
}
```

###### `rowHeight?`

```tsx
rowHeight?: Maybe<number | ((row: R) => number)>;
```

Height of each row in pixels. A function can be used to set different row heights.

```tsx
// Fixed height for all rows
<DataGrid columns={columns} rows={rows} rowHeight={50} />;

// Dynamic height per row
function getRowHeight(row) {
  return row.isExpanded ? 100 : 35;
}

<DataGrid columns={columns} rows={rows} rowHeight={getRowHeight} />;
```

⚠️ **Performance:** When using a function, the heights of all rows are processed upfront. For large datasets (1000+ rows), this can cause performance issues if the identity of the function changes and invalidates internal memoization. Consider using a static function when possible, or memoize the `rowHeight` function.

**Default:** `35` pixels

###### `headerRowHeight?`

```tsx
headerRowHeight?: Maybe<number>;
```

Height of the header row in pixels.

**Default:** `rowHeight` when it is a number, otherwise `35` pixels

###### `summaryRowHeight?`

```tsx
summaryRowHeight?: Maybe<number>;
```

Height of each summary row in pixels.

```tsx
<DataGrid
  columns={columns}
  rows={rows}
  rowHeight={35}
  headerRowHeight={45}
  summaryRowHeight={40}
  topSummaryRows={topSummaryRows}
/>
```

**Default:** `rowHeight` when it is a number, otherwise `35` pixels

###### `columnWidths?`

```tsx
columnWidths?: Maybe<ColumnWidths>;
```

A map of column widths containing both measured and resized widths. If not provided, an internal state is used. See the [`ColumnWidths`](#columnwidths-1) type.

```tsx
const [columnWidths, setColumnWidths] = useState((): ColumnWidths => new Map());

function addNewRow() {
  setRows(...);
  // reset column widths after adding a new row
  setColumnWidths(new Map());
}

return <DataGrid columnWidths={columnWidths} onColumnWidthsChange={setColumnWidths} ... />
```

###### `onColumnWidthsChange?`

```tsx
onColumnWidthsChange?: Maybe<(columnWidths: ColumnWidths) => void>;
```

Callback triggered when column widths change. If not provided, an internal state is used. See the [`ColumnWidths`](#columnwidths-1) type.

###### `selectedRows?`

```tsx
selectedRows?: Maybe<ReadonlySet<K>>;
```

A set of selected row keys. `rowKeyGetter` is required for row selection to work.

###### `isRowSelectionDisabled?`

```tsx
isRowSelectionDisabled?: Maybe<(row: R) => boolean>;
```

Function to determine if row selection is disabled for a specific row.

###### `onSelectedRowsChange?`

```tsx
onSelectedRowsChange?: Maybe<(selectedRows: Set<K>) => void>;
```

Callback triggered when the selection changes.

```tsx
import { useState } from 'react';
import { DataGrid, SelectColumn, type Column } from 'react-data-grid';

const rows: readonly Row[] = [...];

const columns: readonly Column<Row>[] = [
  SelectColumn,
  // other columns
];

function rowKeyGetter(row: Row) {
  return row.id;
}

function isRowSelectionDisabled(row: Row) {
  return !row.isActive;
}

function MyGrid() {
  const [selectedRows, setSelectedRows] = useState((): ReadonlySet<number> => new Set());

  return (
    <DataGrid
      rowKeyGetter={rowKeyGetter}
      columns={columns}
      rows={rows}
      selectedRows={selectedRows}
      isRowSelectionDisabled={isRowSelectionDisabled}
      onSelectedRowsChange={setSelectedRows}
    />
  );
}
```

###### `sortColumns?`

```tsx
sortColumns?: Maybe<readonly SortColumn[]>;
```

An array of sorted columns. See the [`SortColumn`](#sortcolumn) type.

Sorting is controlled: the grid does not reorder `rows` for you. Apply the sorting to your `rows` state (or derived rows) based on `sortColumns`.

###### `onSortColumnsChange?`

```tsx
onSortColumnsChange?: Maybe<(sortColumns: SortColumn[]) => void>;
```

Callback triggered when sorting changes.

```tsx
import { useState } from 'react';
import { DataGrid, type Column, type SortColumn } from 'react-data-grid';

const rows: readonly Row[] = [...];

const columns: readonly Column<Row>[] = [
  {
    key: 'name',
    name: 'Name',
    sortable: true
  },
  // other columns
];

function MyGrid() {
  const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);

  return (
    <DataGrid
      columns={columns}
      rows={rows}
      sortColumns={sortColumns}
      onSortColumnsChange={setSortColumns}
    />
  );
}
```

More than one column can be sorted via Ctrl+Click (Cmd+Click on macOS). To disable multi-column sorting, change the `onSortColumnsChange` function to:

```tsx
function onSortColumnsChange(sortColumns: SortColumn[]) {
  setSortColumns(sortColumns.slice(-1));
}
```

###### `defaultColumnOptions?`

```tsx
defaultColumnOptions?: Maybe<DefaultColumnOptions<R, SR>>;
```

Default options applied to all columns. See the [`DefaultColumnOptions`](#defaultcolumnoptions-1) type.

```tsx
function MyGrid() {
  return (
    <DataGrid
      columns={columns}
      rows={rows}
      defaultColumnOptions={{
        minWidth: 100,
        resizable: true,
        sortable: true,
        draggable: true
      }}
    />
  );
}
```

###### `onCellMouseDown?`

```tsx
onCellMouseDown?: CellMouseEventHandler<R, SR>;
```

Callback triggered when a pointer becomes active in a cell. The default behavior is to focus the cell. Call `preventGridDefault` to prevent the default behavior. See the [`CellMouseArgs`](#cellmouseargs) and [`CellMouseEvent`](#cellmouseevent) types.

```tsx
function onCellMouseDown(args: CellMouseArgs<R, SR>, event: CellMouseEvent) {
  if (args.column.key === 'id') {
    event.preventGridDefault();
  }
}

<DataGrid rows={rows} columns={columns} onCellMouseDown={onCellMouseDown} />;
```

###### `onCellClick?`

```tsx
onCellClick?: CellMouseEventHandler<R, SR>;
```

Callback triggered when a cell is clicked. See the [`CellMouseArgs`](#cellmouseargs) and [`CellMouseEvent`](#cellmouseevent) types.

This event can be used to open the cell editor on a single click:

```tsx
function onCellClick(args: CellMouseArgs<R, SR>, event: CellMouseEvent) {
  if (args.column.key === 'id') {
    args.setActivePosition(true);
  }
}

<DataGrid rows={rows} columns={columns} onCellClick={onCellClick} />;
```

###### `onCellDoubleClick?`

```tsx
onCellDoubleClick?: CellMouseEventHandler<R, SR>;
```

Callback triggered when a cell is double-clicked. The default behavior is to open the editor if the cell is editable. Call `preventGridDefault` to prevent the default behavior. See the [`CellMouseArgs`](#cellmouseargs) and [`CellMouseEvent`](#cellmouseevent) types.

```tsx
function onCellDoubleClick(args: CellMouseArgs<R, SR>, event: CellMouseEvent) {
  if (args.column.key === 'id') {
    event.preventGridDefault();
  }
}

<DataGrid rows={rows} columns={columns} onCellDoubleClick={onCellDoubleClick} />;
```

###### `onCellContextMenu?`

```tsx
onCellContextMenu?: CellMouseEventHandler<R, SR>;
```

Callback triggered when a cell is right-clicked. See the [`CellMouseArgs`](#cellmouseargs) and [`CellMouseEvent`](#cellmouseevent) types.

```tsx
function onCellContextMenu(args: CellMouseArgs<R, SR>, event: CellMouseEvent) {
  if (args.column.key === 'id') {
    event.preventDefault();
    // open custom context menu
  }
}

<DataGrid rows={rows} columns={columns} onCellContextMenu={onCellContextMenu} />;
```

###### `onCellKeyDown?`

```tsx
onCellKeyDown?: Maybe<(args: CellKeyDownArgs<R, SR>, event: CellKeyboardEvent) => void>;
```

Callback triggered when a key is pressed in a cell. This event can be used to customize cell navigation and editing behavior. See the [`CellKeyDownArgs`](#cellkeydownargs) and [`CellKeyboardEvent`](#cellkeyboardevent) types.

It is not called for keydown events triggered in a [`:modal`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:modal) editor, see [`renderEditCell`](#rendereditcell).

**Examples**

- Prevent editing on `Enter`

```tsx
function onCellKeyDown(args: CellKeyDownArgs<R, SR>, event: CellKeyboardEvent) {
  if (args.mode === 'ACTIVE' && event.key === 'Enter') {
    event.preventGridDefault();
  }
}
```

- Prevent navigation on `Tab`

```tsx
function onCellKeyDown(args: CellKeyDownArgs<R, SR>, event: CellKeyboardEvent) {
  if (args.mode === 'ACTIVE' && event.key === 'Tab') {
    event.preventGridDefault();
  }
}
```

See [more examples](https://github.com/Comcast/react-data-grid/blob/main/website/routes/CellNavigation.tsx).

###### `onCellCopy?`

```tsx
onCellCopy?: Maybe<(args: CellCopyArgs<R, SR>, event: CellClipboardEvent) => void>;
```

Callback triggered when a cell's content is copied. See the [`CellCopyArgs`](#cellcopyargs) type.

###### `onCellPaste?`

```tsx
onCellPaste?: Maybe<(args: CellPasteArgs<R, SR>, event: CellClipboardEvent) => R>;
```

Callback triggered when content is pasted into a cell. See the [`CellPasteArgs`](#cellpasteargs) type.

Return the updated row; the grid will call `onRowsChange` with it.

###### `onActivePositionChange?`

```tsx
onActivePositionChange?: Maybe<(args: PositionChangeArgs<R, SR>) => void>;
```

Callback triggered when the active position changes. See the [`PositionChangeArgs`](#positionchangeargs) type.

###### `onColumnResize?`

```tsx
onColumnResize?: Maybe<(column: CalculatedColumn<R, SR>, width: number) => void>;
```

Callback triggered when a column is resized. The `column` parameter is the full [`CalculatedColumn`](#calculatedcolumn) object, and `width` is the new width in pixels.

###### `onColumnsReorder?`

```tsx
onColumnsReorder?: Maybe<(sourceColumnKey: string, targetColumnKey: string) => void>;
```

Callback triggered when columns are reordered. The parameters are the `key` values of the source and target columns.

###### `onFill?`

```tsx
onFill?: Maybe<(event: FillEvent<R>) => R>;
```

Callback triggered when the value of the active cell is dragged to fill other cells. When this prop is set, a drag handle is shown on the active cell if it is editable. Drag the handle up or down to fill the cells it passes over, or double-click it to fill all the cells below.

The grid calls `onFill` for each editable target cell. Return the updated target row; the grid will call `onRowsChange` with the updated rows. See the [`FillEvent`](#fillevent) type.

```tsx
function onFill({ columnKey, sourceRow, targetRow }: FillEvent<Row>): Row {
  return { ...targetRow, [columnKey]: sourceRow[columnKey as keyof Row] };
}

<DataGrid columns={columns} rows={rows} onRowsChange={setRows} onFill={onFill} />;
```

###### `onScroll?`

```tsx
onScroll?: React.UIEventHandler<HTMLDivElement> | undefined;
```

Native DOM `onScroll` prop.

###### `enableVirtualization?`

```tsx
enableVirtualization?: Maybe<boolean>;
```

This prop can be used to disable virtualization.

**Default:** `true`

###### `renderers?`

```tsx
renderers?: Maybe<Renderers<R, SR>>;
```

Custom renderers for cells, rows, and other components.

See the [`Renderers`](#renderers-1) type for the full shape.

Example of replacing default components:

```tsx
import { DataGrid, type Renderers } from 'react-data-grid';

const customRenderers: Renderers<Row, SummaryRow> = {
  // Custom row render function
  renderRow(key, props) {
    return <CustomRow key={key} {...props} />;
  },

  // Custom cell render function
  renderCell(key, props) {
    return <CustomCell key={key} {...props} />;
  },

  // Custom checkbox render function
  renderCheckbox(props) {
    return <CustomCheckbox {...props} />;
  },

  // Custom sort status indicator
  renderSortStatus(props) {
    return <CustomSortIcon {...props} />;
  },

  // Custom empty state
  noRowsFallback: <div>No data available</div>
};

<DataGrid columns={columns} rows={rows} renderers={customRenderers} />;
```

The default `<Row />` component can be wrapped via [`renderers.renderRow`](#renderers-1) to add contexts or tweak props:

```tsx
import { DataGrid, Row, type RenderRowProps } from 'react-data-grid';

interface MyRow {
  id: number;
}

function myRowRenderer(key: React.Key, props: RenderRowProps<MyRow>) {
  return (
    <MyContext key={key} value={123}>
      <Row {...props} />
    </MyContext>
  );
}

function MyGrid() {
  return <DataGrid columns={columns} rows={rows} renderers={{ renderRow: myRowRenderer }} />;
}
```

###### `rowClass?`

```tsx
rowClass?: Maybe<(row: R, rowIdx: number) => Maybe<string>>;
```

Function to apply custom class names to rows.

```tsx
import { DataGrid } from 'react-data-grid';

function rowClass(row: Row, rowIdx: number) {
  return rowIdx % 2 === 0 ? 'even' : 'odd';
}

function MyGrid() {
  return <DataGrid columns={columns} rows={rows} rowClass={rowClass} />;
}
```

⚠️ **Performance:** Define this function outside your component or memoize it with `useCallback` to avoid re-rendering all rows on every render.

###### `headerRowClass?`

```tsx
headerRowClass?: Maybe<string>;
```

Custom class name for the header row.

```tsx
<DataGrid columns={columns} rows={rows} headerRowClass="sticky-header" />
```

###### `direction?`

```tsx
direction?: Maybe<Direction>;
```

This property sets the text direction of the grid. It defaults to `'ltr'` (left-to-right). See the [`Direction`](#direction-1) type.

Setting `direction` to `'rtl'` has the following effects:

- Columns flow from right to left
- Start-frozen columns are pinned on the right, and end-frozen columns are pinned on the left
- Column resize cursor is shown on the left edge of the column
- Scrollbar is moved to the left

**Default:** `'ltr'`

###### `className?`

```tsx
className?: string | undefined;
```

Custom class name for the grid.

###### `style?`

```tsx
style?: React.CSSProperties | undefined;
```

Custom styles for the grid.

###### `role?`

```tsx
role?: React.AriaRole | undefined;
```

ARIA role for the grid container. Defaults to `grid`.

###### `aria-label?`

```tsx
'aria-label'?: string | undefined;
```

The label of the grid. We recommend providing a label using `aria-label` or `aria-labelledby`.

###### `aria-labelledby?`

```tsx
'aria-labelledby'?: string | undefined;
```

The id of the element containing a label for the grid. We recommend providing a label using `aria-label` or `aria-labelledby`.

###### `aria-rowcount?`

```tsx
'aria-rowcount'?: number | undefined;
```

Total number of rows for assistive technologies.

###### `aria-description?`

```tsx
'aria-description'?: string | undefined;
```

A human-readable description of the grid.

###### `aria-describedby?`

```tsx
'aria-describedby'?: string | undefined;
```

If the grid has a caption or description, `aria-describedby` can be set on the grid element with a value referring to the element containing the description.

###### `data-testid?`

```tsx
'data-testid'?: Maybe<string>;
```

This prop can be used to add a test ID for testing. We recommend querying the grid by its `role` and `name`.

```tsx
function MyGrid() {
  return <DataGrid aria-label="my-grid" columns={columns} rows={rows} />;
}

test('grid', async () => {
  await page.render(<MyGrid />);
  const grid = page.getByRole('grid', { name: 'my-grid' });
});
```

###### `data-cy?`

```tsx
'data-cy'?: Maybe<string>;
```

Optional attribute to help with Cypress (or similar) selectors.

#### `<TreeDataGrid />`

`TreeDataGrid` is a component built on top of `DataGrid` to add hierarchical row grouping. This implements the [Treegrid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/).

**How it works:**

1. The `groupBy` prop specifies which columns should be used for grouping
2. Rows are grouped by their value for each of those columns, or by `getRowGroupKey` when provided
3. Group rows are rendered with expand/collapse toggles
4. Child rows are nested under their parent groups
5. Groups can be expanded/collapsed by clicking the toggle or using keyboard navigation (<kbd>←</kbd>, <kbd>→</kbd>)

**Keyboard Navigation:**

- <kbd>→</kbd> (Right Arrow): Expand a collapsed group row when focused
- <kbd>←</kbd> (Left Arrow): Collapse an expanded group row when focused, or navigate to the parent group

**Unsupported Props:**

The following `DataGrid` props are not supported in `TreeDataGrid`:

- `onFill` - Drag-fill is disabled for tree grids
- `isRowSelectionDisabled` - Row selection disabling is not available
- `role` - `TreeDataGrid` manages the ARIA role
- `aria-rowcount` - `TreeDataGrid` manages the ARIA row count

**Caveats:**

- Group columns cannot be rendered under one column
- Group columns are automatically frozen and cannot be unfrozen
- Cell copy/paste does not work on group rows
- Column groups are not supported; `columns` must be `Column[]`

##### TreeDataGridProps

All [`DataGridProps`](#datagridprops) are supported except those listed above. The `columns` prop only supports `Column[]` (no column groups). When `rowHeight` is a function, it receives [`RowHeightArgs`](#rowheightargs) instead of just the row. Additional props are listed below:

###### `columns`

```tsx
columns: readonly Column<R, SR>[];
```

###### `rowHeight?`

```tsx
rowHeight?: Maybe<number | ((args: RowHeightArgs<R>) => number)>;
```

**Note:** Unlike `DataGrid`, the `rowHeight` function receives [`RowHeightArgs<R>`](#rowheightargs), which includes a `type` property to distinguish between regular rows and group rows:

```tsx
function getRowHeight(args: RowHeightArgs<Row>): number {
  if (args.type === 'GROUP') {
    return 50; // Custom height for group rows
  }
  return 35; // Height for regular rows
}

<TreeDataGrid rowHeight={getRowHeight} ... />
```

###### `groupBy`

```tsx
groupBy: readonly string[];
```

**Required.** An array of column keys to group by. The order determines the grouping hierarchy (first key is the top level, second key is nested under the first, etc.).

```tsx
import { TreeDataGrid, type Column } from 'react-data-grid';

interface Row {
  id: number;
  country: string;
  city: string;
  name: string;
}

const columns: readonly Column<Row>[] = [
  { key: 'country', name: 'Country' },
  { key: 'city', name: 'City' },
  { key: 'name', name: 'Name' }
];

const groupBy = ['country', 'city'];

function MyGrid() {
  return (
    <TreeDataGrid
      columns={columns}
      rows={rows}
      groupBy={groupBy}
      // ... other props
    />
  );
}
```

⚠️ **Performance:** Define this array outside your component or memoize it with `useMemo`, otherwise all the rows are grouped again on every render.

###### `expandedGroupIds`

```tsx
expandedGroupIds: ReadonlySet<unknown>;
```

**Required.** A set of group IDs that are currently expanded. Group IDs are generated by `getGroupId`.

```tsx
import { useState } from 'react';
import { TreeDataGrid } from 'react-data-grid';

function MyGrid() {
  const [expandedGroupIds, setExpandedGroupIds] = useState((): ReadonlySet<unknown> => new Set());

  return (
    <TreeDataGrid
      expandedGroupIds={expandedGroupIds}
      onExpandedGroupIdsChange={setExpandedGroupIds}
      // ... other props
    />
  );
}
```

###### `onExpandedGroupIdsChange`

```tsx
onExpandedGroupIdsChange: (expandedGroupIds: Set<unknown>) => void;
```

**Required.** Callback triggered when groups are expanded or collapsed.

###### `getRowGroupKey?`

```tsx
getRowGroupKey?: Maybe<(row: R, columnKey: string) => string>;
```

A function that returns the key of the group a row belongs to, for the specified column key. Rows sharing the same group key are grouped together, and groups are ordered by the first row that belongs to them. If not provided, a default implementation is used that stringifies the row's value for that column, i.e., `String(row[columnKey])`.

Provide your own to group on something other than the raw cell value:

```tsx
function getRowGroupKey(row: Row, columnKey: string): string {
  if (columnKey === 'date') {
    return row.date.getFullYear().toString();
  }
  return String(row[columnKey]);
}
```

⚠️ **Performance:** Define this function outside your component or memoize it with `useCallback`, otherwise all the rows are grouped again on every render.

###### `getGroupId?`

```tsx
getGroupId?: Maybe<(groupKey: string, parentId?: string) => string>;
```

Function to generate unique IDs for group rows. If not provided, a default implementation is used that concatenates parent and group keys with `__`.

⚠️ **Performance:** Define this function outside your component or memoize it with `useCallback` to prevent unnecessary re-renders.

#### `<Row />`

The default row component. Can be wrapped via the [`renderers.renderRow`](#renderers-1) prop.

##### Props

[`RenderRowProps<R, SR>`](#renderrowprops)

#### `<Cell />`

The default cell component. Can be wrapped via the [`renderers.renderCell`](#renderers-1) prop.

##### Props

[`RenderCellProps<R, SR>`](#rendercellprops)

#### `<SelectCheckbox />`

A component for rendering row selection checkboxes.

##### Props

[`SelectCheckboxProps`](#selectcheckboxprops-internal)

#### `<ToggleGroup />`

Low-level component used by `renderToggleGroup` to render the expand/collapse control. Useful if you build a custom group cell renderer.

##### Props

[`RenderGroupCellContentProps<R, SR>`](#rendergroupcellcontentprops)

### Hooks

#### `useHeaderRowSelection()`

```tsx
function useHeaderRowSelection(): {
  isIndeterminate: boolean;
  isRowSelected: boolean;
  onRowSelectionChange: (selectRowEvent: SelectHeaderRowEvent) => void;
};
```

Hook for managing header row selection state. Used within custom header cell renderers to implement custom "select all" functionality.

**Returns:**

An object with:

- `isIndeterminate: boolean` - Whether some (but not all) rows are selected
- `isRowSelected: boolean` - Whether all rows are selected
- `onRowSelectionChange: (event: SelectHeaderRowEvent) => void` - Callback to change selection state

**Example:**

```tsx
import { useLayoutEffect, useRef } from 'react';

function CustomHeaderCell() {
  const { isIndeterminate, isRowSelected, onRowSelectionChange } = useHeaderRowSelection();
  const checkboxRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = isIndeterminate && !isRowSelected;
    }
  }, [isIndeterminate, isRowSelected]);

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      checked={isRowSelected}
      onChange={(event) => onRowSelectionChange({ checked: event.target.checked })}
    />
  );
}
```

#### `useRowSelection()`

```tsx
function useRowSelection(): {
  isRowSelectionDisabled: boolean;
  isRowSelected: boolean;
  onRowSelectionChange: (selectRowEvent: SelectRowEvent<any>) => void;
};
```

Hook for managing row selection state. Used within custom cell renderers to implement custom row selection.

**Returns:**

An object with:

- `isRowSelectionDisabled: boolean` - Whether selection is disabled for this row
- `isRowSelected: boolean` - Whether this row is selected
- `onRowSelectionChange: (event: SelectRowEvent<R>) => void` - Callback to change selection state

**Example:**

```tsx
function CustomSelectCell({ row }: RenderCellContentProps<Row>) {
  const { isRowSelectionDisabled, isRowSelected, onRowSelectionChange } = useRowSelection();

  return (
    <input
      type="checkbox"
      disabled={isRowSelectionDisabled}
      checked={isRowSelected}
      onChange={(event) =>
        onRowSelectionChange({
          row,
          checked: event.currentTarget.checked,
          isShiftClick: event.nativeEvent.shiftKey
        })
      }
    />
  );
}
```

### Render Functions

#### `renderHeaderCell()`

```tsx
function renderHeaderCell<R, SR>(
  props: RenderHeaderCellContentProps<R, SR>
): string | React.JSX.Element;
```

The default header cell content renderer. Renders sortable columns with sort indicators.

**Example:**

```tsx
import { renderHeaderCell, type Column } from 'react-data-grid';

const columns: readonly Column<Row>[] = [
  {
    key: 'name',
    name: 'Name',
    sortable: true,
    renderHeaderCell
  }
];
```

#### `renderTextEditor()`

```tsx
function renderTextEditor<R, SR>(props: RenderEditCellContentProps<R, SR>): React.JSX.Element;
```

A basic text editor provided for convenience.

**Example:**

```tsx
import { renderTextEditor, type Column } from 'react-data-grid';

const columns: readonly Column<Row>[] = [
  {
    key: 'title',
    name: 'Title',
    renderEditCell: renderTextEditor
  }
];
```

#### `renderSortIcon()`

```tsx
function renderSortIcon(props: RenderSortIconProps): React.JSX.Element | null;
```

Renders the sort direction arrow icon.

#### `renderSortPriority()`

```tsx
function renderSortPriority(props: RenderSortPriorityProps): number | undefined;
```

Renders the sort priority number for multi-column sorting.

#### `renderCheckbox()`

```tsx
function renderCheckbox(props: RenderCheckboxProps): React.JSX.Element;
```

Renders a checkbox input with proper styling and accessibility.

**Example:**

```tsx
import { DataGrid, renderCheckbox } from 'react-data-grid';

<DataGrid
  renderers={{
    renderCheckbox: (props) => renderCheckbox({ ...props, 'aria-label': 'Select row' })
  }}
/>;
```

#### `renderToggleGroup()`

```tsx
function renderToggleGroup<R, SR>(props: RenderGroupCellContentProps<R, SR>): React.JSX.Element;
```

The default group cell content renderer for the columns used for grouping (`groupBy` prop). This renders the expand/collapse toggle.

**Example:**

```tsx
import { renderToggleGroup, type Column } from 'react-data-grid';

const columns: readonly Column<Row>[] = [
  {
    key: 'group',
    name: 'Group',
    renderGroupCell: renderToggleGroup
  }
];
```

#### `renderValue()`

```tsx
function renderValue<R, SR>(props: RenderCellContentProps<R, SR>): React.ReactNode;
```

The default cell content renderer that renders the value of `row[column.key]`.

**Example:**

```tsx
import { renderValue, type Column } from 'react-data-grid';

const columns: readonly Column<Row>[] = [
  {
    key: 'title',
    name: 'Title',
    renderCell: renderValue
  }
];
```

### Context

#### `DataGridRenderersContext`

```tsx
const DataGridRenderersContext: React.Context<Maybe<Renderers<any, any>>>;
```

Context for providing default renderers to DataGrids in your app.

**Example:**

```tsx
import {
  DataGridRenderersContext,
  renderCheckbox,
  renderSortIcon,
  renderSortPriority,
  type Renderers
} from 'react-data-grid';

// custom implementations of renderers
const defaultGridRenderers: Renderers<unknown, unknown> = {
  renderCheckbox,
  renderSortStatus(props) {
    return (
      <>
        {renderSortIcon(props)}
        {renderSortPriority(props)}
      </>
    );
  }
};

function AppProvider({ children }) {
  return (
    <DataGridRenderersContext value={defaultGridRenderers}>{children}</DataGridRenderersContext>
  );
}
```

### Other

#### `SelectColumn`

```tsx
const SelectColumn: Column<any, any>;
```

A pre-configured column for row selection.
Includes checkbox renderers for the header row, regular rows, and group rows.

**Example:**

```tsx
import { DataGrid, SelectColumn, type Column } from 'react-data-grid';

const columns: readonly Column<Row>[] = [SelectColumn, ...otherColumns];

function rowKeyGetter(row: Row) {
  return row.id;
}

function MyGrid() {
  return (
    <DataGrid
      columns={columns}
      rows={rows}
      rowKeyGetter={rowKeyGetter}
      selectedRows={selectedRows}
      onSelectedRowsChange={setSelectedRows}
    />
  );
}
```

#### `SELECT_COLUMN_KEY`

```tsx
const SELECT_COLUMN_KEY = 'rdg-select-column';
```

The key used for the `SelectColumn`. Useful for identifying or filtering the select column.

**Example:**

```tsx
import { SELECT_COLUMN_KEY } from 'react-data-grid';

const nonSelectColumns = columns.filter((column) => column.key !== SELECT_COLUMN_KEY);
```

### Types

#### `Column`

Defines the configuration for a column in the grid.

**See also:** [`columns`](#columns) prop on `<DataGrid />`

##### `name`

```tsx
readonly name: string | ReactElement;
```

The name of the column. Displayed in the header cell by default.

##### `key`

```tsx
readonly key: string;
```

A unique key to distinguish each column.

##### `width?`

```tsx
readonly width?: Maybe<number | string>;
```

Width can be any valid CSS grid column value. If not specified, it will be determined automatically based on grid width and specified widths of other columns.

```tsx
const columns: Column<Row>[] = [
  {
    key: 'id',
    name: 'ID',
    width: 80, // Fixed width in pixels
    resizable: false
  },
  {
    key: 'name',
    name: 'Name',
    width: '30%', // Percentage width
    minWidth: 100,
    maxWidth: 400
  },
  {
    key: 'description',
    name: 'Description'
    // No width specified - automatically sized
  }
];
```

Other examples:

```tsx
width: 80, // pixels
width: '25%',
width: 'max-content',
width: 'minmax(100px, max-content)',
```

`max-content` can be used to expand the column to show all the content. Note that the grid is only able to calculate column width for visible rows.

**Default:** `auto`

##### `minWidth?`

```tsx
readonly minWidth?: Maybe<number>;
```

Minimum column width in pixels.

**Default:** `50` pixels

##### `maxWidth?`

```tsx
readonly maxWidth?: Maybe<number>;
```

Maximum column width in pixels.

##### `cellClass?`

```tsx
readonly cellClass?: Maybe<string | ((row: R) => Maybe<string>)>;
```

Class name(s) for cells. Can be a string or a function that returns a class name based on the row.

```tsx
const columns: Column<Row>[] = [
  {
    key: 'status',
    name: 'Status',
    cellClass: (row) => `status-${row.status}`
  },
  {
    key: 'price',
    name: 'Price',
    cellClass: 'text-right' // Static class
  }
];
```

```css
.status-active {
  color: green;
  font-weight: bold;
}

.status-inactive {
  color: gray;
}

.text-right {
  text-align: right;
}
```

##### `headerCellClass?`

```tsx
readonly headerCellClass?: Maybe<string>;
```

Class name(s) for the header cell.

##### `summaryCellClass?`

```tsx
readonly summaryCellClass?: Maybe<string | ((row: SR) => Maybe<string>)>;
```

Class name(s) for summary cells. Can be a string or a function that returns a class name based on the summary row.

##### `renderCell?`

```tsx
readonly renderCell?: Maybe<(props: RenderCellContentProps<R, SR>) => ReactNode>;
```

Render function to render the content of cells.

##### `renderHeaderCell?`

```tsx
readonly renderHeaderCell?: Maybe<(props: RenderHeaderCellContentProps<R, SR>) => ReactNode>;
```

Render function to render the content of the header cell.

##### `renderSummaryCell?`

```tsx
readonly renderSummaryCell?: Maybe<(props: RenderSummaryCellContentProps<SR, R>) => ReactNode>;
```

Render function to render the content of summary cells.

##### `renderGroupCell?`

```tsx
readonly renderGroupCell?: Maybe<(props: RenderGroupCellContentProps<R, SR>) => ReactNode>;
```

Render function to render the content of group cells when using `TreeDataGrid`.

##### `renderEditCell?`

```tsx
readonly renderEditCell?: Maybe<(props: RenderEditCellContentProps<R, SR>) => ReactNode>;
```

Render function to render the content of edit cells. When set, the column is automatically set to be editable.

Editors can render a [`:modal`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:modal) element, like a `<dialog>` opened with `showModal()`, either in the cell or in a portal. Keydown events triggered in the modal are left to the editor: `onCellKeyDown` is not called, and the grid does not close the editor on `Escape`/`Enter` or navigate on `Tab`, so the editor must call `onClose` itself, for example in the dialog's `onClose` handler.

##### `editable?`

```tsx
readonly editable?: Maybe<boolean | ((row: R) => boolean)>;
```

Control whether cells can be edited with `renderEditCell`.

##### `colSpan?`

```tsx
readonly colSpan?: Maybe<(args: ColSpanArgs<R, SR>) => Maybe<number>>;
```

Function to determine how many columns this cell should span. Returns the number of columns to span, or `undefined` for no spanning. The span is clamped to the start-frozen, unfrozen, or end-frozen columns, whichever the column is part of. See the [`ColSpanArgs`](#colspanargs) type.

**Example:**

```tsx
import type { Column } from 'react-data-grid';

const columns: readonly Column<Row>[] = [
  {
    key: 'title',
    name: 'Title',
    colSpan(args) {
      if (args.type === 'ROW' && args.row.isFullWidth) {
        return 5; // Span 5 columns for full-width rows
      }
      return undefined;
    }
  }
];
```

##### `frozen?`

```tsx
readonly frozen?: Maybe<ColumnFrozen | true>;
```

Determines whether the column is frozen, and on which edge. Frozen columns stay in place when the grid is scrolled horizontally. See the [`ColumnFrozen`](#columnfrozen) type.

- `'start'` (or `true` for backward compatibility) — pins the column to the start edge (left in LTR, right in RTL).
- `'end'` — pins the column to the end edge (right in LTR, left in RTL).
- `false` (default) — the column scrolls with the rest of the grid.

```tsx
const columns: readonly Column<Row>[] = [
  { key: 'id', name: 'ID', frozen: 'start' },
  { key: 'name', name: 'Name' },
  { key: 'actions', name: 'Actions', frozen: 'end' }
];
```

**Default:** `false`

##### `resizable?`

```tsx
readonly resizable?: Maybe<boolean>;
```

Enable resizing of the column.

**Default:** `false`

##### `sortable?`

```tsx
readonly sortable?: Maybe<boolean>;
```

Enable sorting of the column.

**Default:** `false`

##### `draggable?`

```tsx
readonly draggable?: Maybe<boolean>;
```

Enable dragging of the column.

**Default:** `false`

##### `sortDescendingFirst?`

```tsx
readonly sortDescendingFirst?: Maybe<boolean>;
```

Sets the column sort order to be descending instead of ascending the first time the column is sorted.

**Default:** `false`

##### `editorOptions`

Options for cell editing.

###### `displayCellContent?`

```tsx
readonly displayCellContent?: Maybe<boolean>;
```

Render the cell content in addition to the edit cell content. Enable this option when the editor is rendered outside the grid, like a modal for example.
By default, the cell content is not rendered when the edit cell is open.

**Default:** `false`

###### `commitOnOutsideClick?`

```tsx
readonly commitOnOutsideClick?: Maybe<boolean>;
```

Commit changes when clicking outside the cell.

**Default:** `true`

###### `closeOnExternalRowChange?`

```tsx
readonly closeOnExternalRowChange?: Maybe<boolean>;
```

Close the editor when the row value changes externally.

**Default:** `true`

#### `ColumnGroup`

Defines a group of columns that share a common header.

```tsx
interface ColumnGroup<R, SR = unknown> {
  /** The name of the column group. It will be displayed in the header cell */
  readonly name: string | ReactElement;
  readonly headerCellClass?: Maybe<string>;
  readonly children: readonly ColumnOrColumnGroup<R, SR>[];
}
```

**Example:**

```tsx
import type { ColumnOrColumnGroup } from 'react-data-grid';

const columns: readonly ColumnOrColumnGroup<Row>[] = [
  {
    name: 'Personal Info',
    children: [
      { key: 'firstName', name: 'First Name' },
      { key: 'lastName', name: 'Last Name' }
    ]
  }
];
```

**See also:** [`ColumnOrColumnGroup`](#columnorcolumngroup)

#### `ColumnOrColumnGroup`

Union type representing either a `Column` or a `ColumnGroup`.

```tsx
type ColumnOrColumnGroup<R, SR = unknown> = Column<R, SR> | ColumnGroup<R, SR>;
```

**See also:** [`columns`](#columns) prop on `<DataGrid />`

#### `CalculatedColumn`

Extends `Column` with additional computed properties used internally by the grid. This is the type passed to render functions. Every `Column` property is set: the ones with a default value, like `width` and `renderCell`, are resolved to their default value when not set, and the others are `undefined` when not set.

```tsx
interface CalculatedColumn<R, SR = unknown> extends Column<R, SR> {
  /** The column group that contains the column, or `undefined` if the column is not in a group */
  readonly parent: CalculatedColumnParent<R, SR> | undefined;
  /** The index of the column in the grid. Column groups are flattened and frozen columns are moved to their edge, so it can differ from the column's index in `columns` */
  readonly idx: number;
  /** Header row level, counted from the bottom header row: always `0` for columns, and negative for column groups */
  readonly level: number;
  readonly width: number | string;
  readonly minWidth: number;
  readonly maxWidth: number | undefined;
  readonly resizable: boolean;
  readonly sortable: boolean;
  readonly draggable: boolean;
  readonly frozen: ColumnFrozen;
  readonly renderCell: (props: RenderCellContentProps<R, SR>) => ReactNode;
  readonly renderHeaderCell: (props: RenderHeaderCellContentProps<R, SR>) => ReactNode;
  /** Returns the number of columns that the cell spans: the clamped value returned by `colSpan`, or `1` */
  readonly getColSpan: (args: ColSpanArgs<R, SR> | undefined) => number;
  readonly cellClass: Column<R, SR>['cellClass'];
  readonly headerCellClass: Column<R, SR>['headerCellClass'];
  readonly summaryCellClass: Column<R, SR>['summaryCellClass'];
  readonly renderSummaryCell: Column<R, SR>['renderSummaryCell'];
  readonly renderGroupCell: Column<R, SR>['renderGroupCell'];
  readonly renderEditCell: Column<R, SR>['renderEditCell'];
  readonly editable: Column<R, SR>['editable'];
  readonly colSpan: Column<R, SR>['colSpan'];
  readonly sortDescendingFirst: Column<R, SR>['sortDescendingFirst'];
  readonly editorOptions: Column<R, SR>['editorOptions'];
}
```

**See also:** [`Column`](#column), [`onColumnResize`](#oncolumnresize) prop on `<DataGrid />`

#### `CalculatedColumnParent`

Represents a parent column group in the calculated column structure.

```tsx
interface CalculatedColumnParent<R, SR> {
  readonly name: string | ReactElement;
  readonly parent: CalculatedColumnParent<R, SR> | undefined;
  readonly idx: number;
  readonly colSpan: number;
  readonly level: number;
  readonly headerCellClass?: Maybe<string>;
}
```

**See also:** [`CalculatedColumn`](#calculatedcolumn)

#### `CalculatedColumnOrColumnGroup`

Union type representing either a `CalculatedColumnParent` or a `CalculatedColumn`.

```tsx
type CalculatedColumnOrColumnGroup<R, SR> = CalculatedColumnParent<R, SR> | CalculatedColumn<R, SR>;
```

**See also:** [`CalculatedColumn`](#calculatedcolumn), [`CalculatedColumnParent`](#calculatedcolumnparent)

#### `DefaultColumnOptions`

Default options applied to all columns.

```tsx
type DefaultColumnOptions<R, SR> = Pick<
  Column<R, SR>,
  | 'renderCell'
  | 'renderHeaderCell'
  | 'width'
  | 'minWidth'
  | 'maxWidth'
  | 'resizable'
  | 'sortable'
  | 'draggable'
>;
```

**See also:** [`defaultColumnOptions`](#defaultcolumnoptions) prop on `<DataGrid />`

#### `ColumnFrozen`

Whether a column is frozen, and on which edge.

```tsx
type ColumnFrozen = false | 'start' | 'end';
```

**See also:** [`column.frozen`](#frozen)

#### `RenderCellContentProps`

Props passed to custom cell content renderers ([`column.renderCell`](#rendercell)).

```tsx
interface RenderCellContentProps<R, SR = unknown> {
  column: CalculatedColumn<R, SR>;
  row: R;
  rowIdx: number;
  isCellEditable: boolean;
  tabIndex: number;
  onRowChange: (row: R) => void;
}
```

**Example:**

```tsx
import type { RenderCellContentProps } from 'react-data-grid';

function renderCell({ row, column, onRowChange }: RenderCellContentProps<MyRow>) {
  return (
    <div>
      {row[column.key]}
      <button onClick={() => onRowChange({ ...row, updated: true })}>Update</button>
    </div>
  );
}
```

**See also:** [`column.renderCell`](#rendercell), [`renderValue`](#rendervalue) function

#### `RenderHeaderCellContentProps`

Props passed to custom header cell content renderers ([`column.renderHeaderCell`](#renderheadercell-1)).

```tsx
interface RenderHeaderCellContentProps<R, SR = unknown> {
  column: CalculatedColumn<R, SR>;
  sortDirection: SortDirection | undefined;
  priority: number | undefined;
  tabIndex: number;
}
```

**See also:** [`column.renderHeaderCell`](#renderheadercell-1), [`renderHeaderCell`](#renderheadercell) function

#### `RenderEditCellContentProps`

Props passed to custom editors ([`column.renderEditCell`](#rendereditcell)).

```tsx
interface RenderEditCellContentProps<R, SR = unknown> {
  column: CalculatedColumn<R, SR>;
  row: R;
  rowIdx: number;
  onRowChange: (row: R, commitChanges?: boolean) => void;
  onClose: (commitChanges?: boolean, shouldFocus?: boolean) => void;
}
```

**Example:**

```tsx
import type { RenderEditCellContentProps } from 'react-data-grid';

function renderEditor({ row, column, onRowChange, onClose }: RenderEditCellContentProps<MyRow>) {
  return (
    <input
      autoFocus
      value={row[column.key]}
      onChange={(event) => onRowChange({ ...row, [column.key]: event.target.value })}
      onBlur={() => onClose(true)}
    />
  );
}
```

**See also:** [`column.renderEditCell`](#rendereditcell), [`renderTextEditor`](#rendertexteditor) function

#### `RenderSummaryCellContentProps`

Props passed to summary cell content renderers ([`column.renderSummaryCell`](#rendersummarycell)).

```tsx
interface RenderSummaryCellContentProps<SR, R = unknown> {
  column: CalculatedColumn<R, SR>;
  row: SR;
  tabIndex: number;
}
```

**See also:** [`column.renderSummaryCell`](#rendersummarycell)

#### `RenderGroupCellContentProps`

Props passed to group cell content renderers ([`column.renderGroupCell`](#rendergroupcell)) when using `TreeDataGrid`.

```tsx
interface RenderGroupCellContentProps<R, SR = unknown> {
  groupKey: unknown;
  column: CalculatedColumn<R, SR>;
  row: GroupRow<R>;
  childRows: readonly R[];
  isExpanded: boolean;
  tabIndex: number;
  toggleGroup: () => void;
}
```

**See also:** [`column.renderGroupCell`](#rendergroupcell), [`renderToggleGroup`](#rendertogglegroup) function, [`<ToggleGroup />`](#togglegroup-)

#### `RenderRowProps`

Props passed to custom row renderers.

```tsx
interface RenderRowProps<R, SR = unknown>
  extends
    Omit<React.ComponentProps<'div'>, 'children'>,
    Pick<
      DataGridProps<R, SR>,
      'onCellMouseDown' | 'onCellClick' | 'onCellDoubleClick' | 'onCellContextMenu'
    > {
  setActivePosition: (position: Position, options?: SetActivePositionOptions) => void;
  /**
   * Calls `callback` for each cell to render in the row, and returns the results.
   * `activeIdx` is the column index of the row's active cell, if any: that cell is rendered even when it is scrolled out of view.
   * If virtualization would leave out the active row, it is rendered with only its active cell, if any.
   * `colSpanArgs` is passed to `column.colSpan`, and the columns that a cell spans are skipped, even the active one.
   * The callback receives the cell's column, whether the cell is active, its `colSpan`, and its index in the results.
   */
  mapViewportColumns: MapViewportColumns<R, SR>;
  rowIdx: number;
  activeCellIdx: number | undefined;
  isRowSelectionDisabled: boolean;
  isRowSelected: boolean;
  gridRowStart: number;
  row: R;
  draggedOverCellIdx: number | undefined;
  activeCellEditor: ReactElement<EditCellProps<R, SR>> | undefined;
  onRowChange: (column: CalculatedColumn<R, SR>, rowIdx: number, newRow: R) => void;
  rowClass: Maybe<(row: R, rowIdx: number) => Maybe<string>>;
  isTreeGrid: boolean;
}
```

**See also:** [`renderers.renderRow`](#renderers), [`<Row />`](#row-), [`MapViewportColumns`](#mapviewportcolumns-internal)

#### `RenderCellProps`

Props passed to the cell renderer when using [`renderers.renderCell`](#renderers-1).

```tsx
interface RenderCellProps<R, SR>
  extends
    Omit<React.ComponentProps<'div'>, 'children'>,
    Pick<
      DataGridProps<R, SR>,
      'onCellMouseDown' | 'onCellClick' | 'onCellDoubleClick' | 'onCellContextMenu'
    > {
  rowIdx: number;
  setActivePosition: (position: Position, options?: SetActivePositionOptions) => void;
  column: CalculatedColumn<R, SR>;
  row: R;
  colSpan: number;
  isDraggedOver: boolean;
  isCellActive: boolean;
  onRowChange: (column: CalculatedColumn<R, SR>, rowIdx: number, newRow: R) => void;
}
```

**See also:** [`renderers.renderCell`](#renderers), [`<Cell />`](#cell-)

#### `RenderCheckboxProps`

Props for custom checkbox renderers.

```tsx
interface RenderCheckboxProps {
  /** Whether the checkbox is checked */
  checked?: boolean | undefined;
  /** Whether the checkbox is in an indeterminate state, like the select all checkbox when only some rows are selected */
  indeterminate?: boolean | undefined;
  /** Whether the checkbox is disabled */
  disabled?: boolean | undefined;
  /** Called when the checkbox is toggled. `shift` is `true` if the Shift key was held, to select a range of rows */
  onChange: (checked: boolean, shift: boolean) => void;
  /** `0` when the checkbox's cell is active and `-1` otherwise, so the grid can move focus from the cell to the checkbox */
  tabIndex?: number | undefined;
  /** Accessible label for the checkbox */
  'aria-label'?: string | undefined;
  /** ID of the element that labels the checkbox */
  'aria-labelledby'?: string | undefined;
}
```

**See also:** [`renderCheckbox`](#rendercheckbox) function, [`renderers.renderCheckbox`](#renderers), [`<SelectCheckbox />`](#selectcheckbox-)

#### `RenderSortStatusProps`

Props for custom sort status renderers.

```tsx
interface RenderSortStatusProps extends RenderSortIconProps, RenderSortPriorityProps {}
```

**See also:** [`renderers.renderSortStatus`](#renderers)

#### `RenderSortIconProps`

Props for custom sort icon renderers.

```tsx
interface RenderSortIconProps {
  /** The sort direction of the column, or `undefined` if it is not sorted */
  sortDirection: SortDirection | undefined;
}
```

**See also:** [`renderSortIcon`](#rendersorticon) function

#### `RenderSortPriorityProps`

Props for custom sort priority renderers.

```tsx
interface RenderSortPriorityProps {
  /** The column's position in `sortColumns`, starting at 1, when sorting by multiple columns, or `undefined` otherwise */
  priority: number | undefined;
}
```

**See also:** [`renderSortPriority`](#rendersortpriority) function

#### `Renderers`

Custom renderer configuration for the grid.

```tsx
interface Renderers<R, SR> {
  readonly renderCell?: Maybe<(key: Key, props: RenderCellProps<R, SR>) => ReactNode>;
  readonly renderCheckbox?: Maybe<(props: RenderCheckboxProps) => ReactNode>;
  readonly renderRow?: Maybe<(key: Key, props: RenderRowProps<R, SR>) => ReactNode>;
  readonly renderSortStatus?: Maybe<(props: RenderSortStatusProps) => ReactNode>;
  readonly noRowsFallback?: Maybe<ReactNode>;
}
```

**See also:** [`renderers`](#renderers) prop on `<DataGrid />`, [`DataGridRenderersContext`](#datagridrendererscontext)

#### `CellMouseArgs`

Arguments passed to cell mouse event handlers.

```tsx
interface CellMouseArgs<R, SR = unknown> {
  /** The column object of the cell. */
  column: CalculatedColumn<R, SR>;
  /** The row object of the cell. */
  row: R;
  /** The row index of the cell. */
  rowIdx: number;
  /** Function to manually focus the cell. Pass `true` to immediately start editing. */
  setActivePosition: (enableEditor?: boolean) => void;
}
```

**Example:**

```tsx
import type { CellMouseArgs, CellMouseEvent } from 'react-data-grid';

function onCellClick(args: CellMouseArgs<Row>, event: CellMouseEvent) {
  console.log('Clicked cell at row', args.rowIdx, 'column', args.column.key);
  args.setActivePosition(true); // Focus and start editing
}
```

**See also:** [`onCellMouseDown`](#oncellmousedown), [`onCellClick`](#oncellclick), [`onCellDoubleClick`](#oncelldoubleclick), and [`onCellContextMenu`](#oncellcontextmenu) props on `<DataGrid />`

#### `CellMouseEvent`

Extends `React.MouseEvent<HTMLDivElement>` with grid-specific methods.

```tsx
type CellMouseEvent = CellEvent<React.MouseEvent<HTMLDivElement>>;
```

**Example:**

```tsx
import type { CellMouseArgs, CellMouseEvent } from 'react-data-grid';

function onCellMouseDown(args: CellMouseArgs<Row>, event: CellMouseEvent) {
  if (args.column.key === 'actions') {
    event.preventGridDefault(); // Prevent cell focus
  }
}
```

**See also:** [`onCellMouseDown`](#oncellmousedown), [`onCellClick`](#oncellclick), [`onCellDoubleClick`](#oncelldoubleclick), and [`onCellContextMenu`](#oncellcontextmenu) props on `<DataGrid />`

#### `CellKeyDownArgs`

Arguments passed to the `onCellKeyDown` handler. The shape differs based on whether the cell is in ACTIVE or EDIT mode.

```tsx
type CellKeyDownArgs<R, SR = unknown> = ActiveCellKeyDownArgs<R, SR> | EditCellKeyDownArgs<R, SR>;

interface ActiveCellKeyDownArgs<R, SR = unknown> {
  mode: 'ACTIVE';
  /**
   * column object of the active position,
   * undefined if the active position is a row instead of a cell
   */
  column: CalculatedColumn<R, SR> | undefined;
  row: R;
  rowIdx: number;
  setActivePosition: (position: Position, options?: SetActivePositionOptions) => void;
}

interface EditCellKeyDownArgs<R, SR = unknown> {
  mode: 'EDIT';
  column: CalculatedColumn<R, SR>;
  row: R;
  rowIdx: number;
  navigate: () => void;
  onClose: (commitChanges?: boolean, shouldFocus?: boolean) => void;
}
```

**Example:**

```tsx
import type { CellKeyboardEvent, CellKeyDownArgs } from 'react-data-grid';

function onCellKeyDown(args: CellKeyDownArgs<Row>, event: CellKeyboardEvent) {
  if (args.mode === 'EDIT' && event.key === 'Escape') {
    args.onClose(false); // Close without committing
    event.preventGridDefault();
  }
}
```

**See also:** [`onCellKeyDown`](#oncellkeydown) prop on `<DataGrid />`

#### `CellKeyboardEvent`

Extends `React.KeyboardEvent<HTMLDivElement>` with grid-specific methods.

```tsx
type CellKeyboardEvent = CellEvent<React.KeyboardEvent<HTMLDivElement>>;
```

**See also:** [`onCellKeyDown`](#oncellkeydown) prop on `<DataGrid />`

#### `CellCopyArgs`

Arguments passed to `onCellCopy`.

```tsx
type CellCopyArgs<R, SR = unknown> = CellCopyPasteArgs<R, SR>;

interface CellCopyPasteArgs<R, SR = unknown> {
  column: CalculatedColumn<R, SR>;
  row: R;
}
```

**See also:** [`onCellCopy`](#oncellcopy) prop on `<DataGrid />`

#### `CellPasteArgs`

Arguments passed to `onCellPaste`.

```tsx
type CellPasteArgs<R, SR = unknown> = CellCopyPasteArgs<R, SR>;

interface CellCopyPasteArgs<R, SR = unknown> {
  column: CalculatedColumn<R, SR>;
  row: R;
}
```

**See also:** [`onCellPaste`](#oncellpaste) prop on `<DataGrid />`

#### `PositionChangeArgs`

Arguments passed to `onActivePositionChange`.

```tsx
interface PositionChangeArgs<R, SR = unknown> {
  /** row index of the active position */
  rowIdx: number;
  /**
   * row object of the active position,
   * undefined if the active position is on a header or summary row
   */
  row: R | undefined;
  /**
   * column object of the active position,
   * undefined if the active position is a row instead of a cell
   */
  column: CalculatedColumn<R, SR> | undefined;
}
```

**See also:** [`onActivePositionChange`](#onactivepositionchange) prop on `<DataGrid />`

#### `ColSpanArgs`

Arguments passed to the `colSpan` function.

```tsx
type ColSpanArgs<R, SR> =
  | {
      readonly type: 'HEADER';
    }
  | {
      readonly type: 'ROW';
      readonly row: R;
    }
  | {
      readonly type: 'SUMMARY';
      readonly row: SR;
    };
```

**Example:**

```tsx
import type { Column } from 'react-data-grid';

const columns: readonly Column<Row>[] = [
  {
    key: 'title',
    name: 'Title',
    colSpan(args) {
      if (args.type === 'ROW' && args.row.isFullWidth) {
        return 3; // Span 3 columns
      }
      return undefined;
    }
  }
];
```

**See also:** [`column.colSpan`](#colspan)

#### `RowHeightArgs`

Arguments passed to `TreeDataGrid`'s `rowHeight` prop when it is a function.

```tsx
type RowHeightArgs<R> =
  | {
      type: 'ROW';
      row: R;
    }
  | {
      type: 'GROUP';
      row: GroupRow<R>;
    };
```

**Example:**

```tsx
function getRowHeight(args: RowHeightArgs<Row>): number {
  if (args.type === 'GROUP') {
    return 40;
  }
  return args.row.isLarge ? 60 : 35;
}

<TreeDataGrid rowHeight={getRowHeight} ... />
```

**See also:** [`rowHeight`](#rowheight-1) prop on `<TreeDataGrid />`

#### `SortColumn`

Describes a sorted column.

```tsx
interface SortColumn {
  readonly columnKey: string;
  readonly direction: SortDirection;
}
```

**See also:** [`sortColumns`](#sortcolumns) and [`onSortColumnsChange`](#onsortcolumnschange) props on `<DataGrid />`

#### `SortDirection`

```tsx
type SortDirection = 'ASC' | 'DESC';
```

**See also:** [`SortColumn`](#sortcolumn)

#### `RowsChangeData`

Data provided to the `onRowsChange` callback.

```tsx
interface RowsChangeData<R, SR = unknown> {
  /** Indexes of the rows that changed */
  indexes: number[];
  /** The column of the cells that changed */
  column: CalculatedColumn<R, SR>;
}
```

**See also:** [`onRowsChange`](#onrowschange) prop on `<DataGrid />`

#### `SelectRowEvent`

Event object for row selection changes.

```tsx
interface SelectRowEvent<R> {
  row: R;
  checked: boolean;
  isShiftClick: boolean;
}
```

**See also:** [`useRowSelection`](#userowselection) hook

#### `SelectHeaderRowEvent`

Event object for header row selection changes.

```tsx
interface SelectHeaderRowEvent {
  checked: boolean;
}
```

**See also:** [`useHeaderRowSelection`](#useheaderrowselection) hook

#### `FillEvent`

Event object for drag-fill operations.

```tsx
interface FillEvent<R> {
  columnKey: string;
  sourceRow: R;
  targetRow: R;
}
```

**See also:** [`onFill`](#onfill) prop on `<DataGrid />`

#### `DataGridHandle`

Handle type assigned to a grid's `ref` for programmatic grid control.

```tsx
interface DataGridHandle {
  element: HTMLDivElement | null;
  scrollToCell: (position: PartialPosition) => void;
  setActivePosition: (position: Position, options?: SetActivePositionOptions) => void;
}
```

**Example:**

```tsx
import { useRef } from 'react';
import { DataGrid, type DataGridHandle } from 'react-data-grid';

function MyGrid() {
  const gridRef = useRef<DataGridHandle>(null);

  function scrollToTop() {
    gridRef.current?.scrollToCell({ rowIdx: 0 });
  }

  return <DataGrid ref={gridRef} columns={columns} rows={rows} />;
}
```

**See also:** [`ref`](#ref) prop on `<DataGrid />`

#### `SetActivePositionOptions`

Options for programmatically updating the grid's active position.

```tsx
interface SetActivePositionOptions {
  enableEditor?: Maybe<boolean>;
  shouldFocus?: Maybe<boolean>;
}
```

**See also:** [`DataGridHandle`](#datagridhandle), [`CellKeyDownArgs`](#cellkeydownargs)

#### `ColumnWidths`

A map of column widths.

```tsx
type ColumnWidths = ReadonlyMap<string, ColumnWidth>;
```

**See also:** [`columnWidths`](#columnwidths) and [`onColumnWidthsChange`](#oncolumnwidthschange) props on `<DataGrid />`

#### `ColumnWidth`

Represents a single column's width.

```tsx
interface ColumnWidth {
  /** `'resized'` if the user resized the column, or `'measured'` if the grid measured it */
  readonly type: 'resized' | 'measured';
  /** The width in pixels */
  readonly width: number;
}
```

**See also:** [`ColumnWidths`](#columnwidths-1)

#### `Direction`

Text direction of the grid.

```tsx
type Direction = 'ltr' | 'rtl';
```

**See also:** [`direction`](#direction) prop on `<DataGrid />`

#### `CellClipboardEvent` (internal)

Type alias for `React.ClipboardEvent<HTMLDivElement>`. Used for copy and paste events. This helper type is not exported; the shape is shown for reference.

```tsx
type CellClipboardEvent = React.ClipboardEvent<HTMLDivElement>;
```

**See also:** [`onCellCopy`](#oncellcopy) and [`onCellPaste`](#oncellpaste) props on `<DataGrid />`

#### `CellEvent` (internal)

Adds grid-specific methods to a React event. This helper type is not exported; the shape is shown for reference.

```tsx
type CellEvent<E extends React.SyntheticEvent<HTMLDivElement>> = E & {
  /** Prevents the default grid behavior for this event */
  preventGridDefault: () => void;
  /** Returns whether `preventGridDefault` was called */
  isGridDefaultPrevented: () => boolean;
};
```

**See also:** [`CellMouseEvent`](#cellmouseevent), [`CellKeyboardEvent`](#cellkeyboardevent)

#### `CellMouseEventHandler` (internal)

Handler type used by `onCellMouseDown`, `onCellClick`, `onCellDoubleClick`, and `onCellContextMenu`. This helper type is not exported; the shape is shown for reference.

```tsx
type CellMouseEventHandler<R, SR> = Maybe<
  (args: CellMouseArgs<R, SR>, event: CellMouseEvent) => void
>;
```

#### `GroupRow` (internal)

Represents a group row in `TreeDataGrid`. This helper type is not exported; the shape is shown for reference.

```tsx
interface GroupRow<R> {
  readonly childRows: readonly R[];
  readonly id: string;
  readonly parentId: unknown;
  readonly groupKey: unknown;
  readonly isExpanded: boolean;
  readonly level: number;
  readonly posInSet: number;
  readonly setSize: number;
  readonly startRowIndex: number;
}
```

**See also:** [`RenderGroupCellContentProps`](#rendergroupcellcontentprops), [`RowHeightArgs`](#rowheightargs), [`<TreeDataGrid />`](#treedatagrid-)

#### `MapViewportColumns` (internal)

Type of `mapViewportColumns` in `RenderRowProps`. This helper type is not exported; the shape is shown for reference.

```tsx
type MapViewportColumns<R, SR> = <T>(
  activeIdx: number | undefined,
  colSpanArgs: ColSpanArgs<R, SR> | undefined,
  callback: (
    column: CalculatedColumn<R, SR>,
    isCellActive: boolean,
    colSpan: number,
    index: number
  ) => T
) => T[];
```

**See also:** [`RenderRowProps`](#renderrowprops), [`ColSpanArgs`](#colspanargs)

#### `Maybe` (internal)

Utility type for optional values. This helper type is not exported; the shape is shown for reference.

```tsx
type Maybe<T> = T | undefined | null;
```

#### `PartialPosition` (internal)

Position for scrolling to a cell. Both fields are optional: omit `idx` to scroll to a row, or omit `rowIdx` to scroll to a column. This helper type is not exported; the shape is shown for reference.

```tsx
interface PartialPosition {
  readonly idx?: Maybe<number>;
  readonly rowIdx?: Maybe<number>;
}
```

**See also:** [`DataGridHandle`](#datagridhandle)

#### `Position` (internal)

Represents a cell position in the grid. This helper type is not exported; the shape is shown for reference.

```tsx
interface Position {
  /** Column index, or `-1` for the whole row in `TreeDataGrid` */
  readonly idx: number;
  /** Row index: `0` is the first row, header rows and top summary rows have negative indexes, and bottom summary rows come after the last row */
  readonly rowIdx: number;
}
```

**See also:** [`DataGridHandle`](#datagridhandle), [`CellKeyDownArgs`](#cellkeydownargs)

#### `SelectCheckboxProps` (internal)

The props of [`<SelectCheckbox />`](#selectcheckbox-): the same props as [`RenderCheckboxProps`](#rendercheckboxprops), with `value: boolean` in place of `checked`.

```tsx
interface SelectCheckboxProps extends Pick<
  RenderCheckboxProps,
  'disabled' | 'tabIndex' | 'aria-label' | 'aria-labelledby' | 'indeterminate' | 'onChange'
> {
  /** Whether the checkbox is checked */
  value: boolean;
}
```

<!-- api:end -->

### Generics

- `R`: Row type
- `SR`: Summary row type
- `K`: Row key type

[ci-badge]: https://github.com/Comcast/react-data-grid/actions/workflows/ci.yml/badge.svg
[ci-url]: https://github.com/Comcast/react-data-grid/actions/workflows/ci.yml
[codecov-badge]: https://codecov.io/gh/Comcast/react-data-grid/branch/main/graph/badge.svg?token=cvrRSWiz0Q
[codecov-url]: https://app.codecov.io/gh/Comcast/react-data-grid
[npm-badge]: https://img.shields.io/npm/v/react-data-grid
[npm-url]: https://www.npmjs.com/package/react-data-grid
[size-badge]: https://img.shields.io/bundlephobia/minzip/react-data-grid
[size-url]: https://bundlephobia.com/package/react-data-grid
[type-badge]: https://img.shields.io/npm/types/react-data-grid
