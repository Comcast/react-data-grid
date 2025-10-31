# react-data-grid

[![npm-badge]][npm-url]
[![type-badge]][npm-url]
[![size-badge]][size-url]
[![codecov-badge]][codecov-url]
[![ci-badge]][ci-url]

[npm-badge]: https://img.shields.io/npm/v/react-data-grid
[npm-url]: https://www.npmjs.com/package/react-data-grid
[size-badge]: https://img.shields.io/bundlephobia/minzip/react-data-grid
[size-url]: https://bundlephobia.com/package/react-data-grid
[type-badge]: https://img.shields.io/npm/types/react-data-grid
[codecov-badge]: https://codecov.io/gh/Comcast/react-data-grid/branch/main/graph/badge.svg?token=cvrRSWiz0Q
[codecov-url]: https://app.codecov.io/gh/Comcast/react-data-grid
[ci-badge]: https://github.com/Comcast/react-data-grid/workflows/CI/badge.svg
[ci-url]: https://github.com/Comcast/react-data-grid/actions

The DataGrid component is designed to handle large datasets efficiently while offering a rich set of features for customization and interactivity.

## Features

- [React 19.2+](package.json) support
- Evergreen browsers and server-side rendering support
- Tree-shaking support with no external dependencies to keep your bundles slim
- Great performance thanks to virtualization: columns and rows outside the viewport are not rendered
- Strictly typed with TypeScript
- [Keyboard accessibility](https://comcast.github.io/react-data-grid/#/CommonFeatures)
- Light and dark mode support out of the box.
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
- [Cell copy / pasting](https://comcast.github.io/react-data-grid/#/AllFeatures)
- [Cell value dragging / filling](https://comcast.github.io/react-data-grid/#/AllFeatures)
- [Customizable Renderers](https://comcast.github.io/react-data-grid/#/CustomizableRenderers)
- Right-to-left (RTL) support.

## Links

- [Examples website](https://comcast.github.io/react-data-grid/)
  - [Source code](website)
- [Changelog](CHANGELOG.md)
- [Contributing](CONTRIBUTING.md)

> **Important** <br />
> `rolldown-vite` by default uses `lightningcss` to minify css which has a [bug minifying light-dark syntax](https://github.com/parcel-bundler/lightningcss/issues/873). You can switch to `esbuild` as a workaround

```ts
build: {
  ....,
  cssMinify: 'esbuild'
}
```

## Installation

Install `react-data-grid` using your favorite package manager:

```sh
npm i react-data-grid
```

```sh
pnpm add react-data-grid
```

```sh
yarn add react-data-grid
```

```sh
bun add react-data-grid
```

Additionally, import the default styles in your application:

```tsx
import 'react-data-grid/lib/styles.css';
```

`react-data-grid` is published as ECMAScript modules for evergreen browsers, bundlers, and server-side rendering.

## Getting started

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

## Theming

Set `--rdg-color-scheme: light/dark` at the `:root` to control the color theme. The light or dark themes can be enforced using the `rdg-light` or `rdg-dark` classes.

## API Reference

### Components

#### `<DataGrid />`

##### DataGridProps

###### `columns: readonly Column<R, SR>[]`

An array of column definitions. Each column should have a key and name. See the [`Column`](#columntrow-tsummaryrow) type for all available options.

:warning: Passing a new `columns` array will trigger a re-render for the whole grid, avoid changing it as much as possible for optimal performance.

###### `rows: readonly R[]`

An array of rows, the rows data can be of any type.

###### `topSummaryRows?: Maybe<readonly SR[]>`

Rows pinned at the top of the grid for summary purposes.

###### `bottomSummaryRows?: Maybe<readonly SR[]>`

Rows pinned at the bottom of the grid for summary purposes.

###### `rowKeyGetter?: Maybe<(row: R) => K>`

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

:bulb: While optional, setting this prop is recommended for optimal performance as the returned value is used to set the `key` prop on the row elements.

###### `onRowsChange?: Maybe<(rows: R[], data: RowsChangeData<R, SR>) => void>`

Callback triggered when rows are changed.

The first parameter is a new rows array with both the updated rows and the other untouched rows.
The second parameter is an object with an `indexes` array highlighting which rows have changed by their index, and the `column` where the change happened.

```tsx
import { useState } from 'react';
import { DataGrid } from 'react-data-grid';

function MyGrid() {
  const [rows, setRows] = useState(initialRows);

  return <DataGrid columns={columns} rows={rows} onRowsChange={setRows} />;
}
```

###### `rowHeight?: Maybe<number | ((row: R) => number)>`

**Default:** `35` pixels

Height of each row in pixels. A function can be used to set different row heights.

###### `headerRowHeight?: Maybe<number>`

**Default:** `35` pixels

Height of the header row in pixels.

###### `summaryRowHeight?: Maybe<number>`

**Default:** `35` pixels

Height of each summary row in pixels.

###### `columnWidths?: Maybe<ColumnWidths>`

A map of column widths containing both measured and resized widths. If not provided then an internal state is used.

```tsx
const [columnWidths, setColumnWidths] = useState((): ColumnWidths => new Map());

function addNewRow() {
  setRows(...);
  // reset column widths after adding a new row
  setColumnWidths(new Map());
}

return <DataGrid columnWidths={columnWidths} onColumnWidthsChange={setColumnWidths} ... />
```

###### `onColumnWidthsChange?: Maybe<(columnWidths: ColumnWidths) => void>`

Callback triggered when column widths change. If not provided then an internal state is used.

###### `selectedRows?: Maybe<ReadonlySet<K>>`

A set of selected row keys. `rowKeyGetter` is required for row selection to work.

###### `isRowSelectionDisabled?: Maybe<(row: NoInfer<R>) => boolean>`

Function to determine if row selection is disabled for a specific row.

###### `onSelectedRowsChange?: Maybe<(selectedRows: Set<K>) => void>`

Callback triggered when the selection changes.

```tsx
import { useState } from 'react';
import { DataGrid, SelectColumn } from 'react-data-grid';

const rows: readonly Rows[] = [...];

const columns: readonly Column<Row>[] = [
  SelectColumn,
  // other columns
];

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

function rowKeyGetter(row: Row) {
  return row.id;
}

function isRowSelectionDisabled(row: Row) {
  return !row.isActive;
}
```

###### `sortColumns?: Maybe<readonly SortColumn[]>`

An array of sorted columns.

###### `onSortColumnsChange?: Maybe<(sortColumns: SortColumn[]) => void>`

Callback triggered when sorting changes.

```tsx
import { useState } from 'react';
import { DataGrid, SelectColumn } from 'react-data-grid';

const rows: readonly Rows[] = [...];

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

More than one column can be sorted via `ctrl (command) + click`. To disable multiple column sorting, change the `onSortColumnsChange` function to

```tsx
function onSortColumnsChange(sortColumns: SortColumn[]) {
  setSortColumns(sortColumns.slice(-1));
}
```

###### `defaultColumnOptions?: Maybe<DefaultColumnOptions<R, SR>>`

Default options applied to all columns.

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

###### `onFill?: Maybe<(event: FillEvent<R>) => R>`

###### `onCellMouseDown: Maybe<(args: CellMouseArgs<R, SR>, event: CellMouseEvent) => void>`

Callback triggered when a pointer becomes active in a cell. The default behavior is to select the cell. Call `preventGridDefault` to prevent the default behavior.

```tsx
function onCellMouseDown(args: CellMouseDownArgs<R, SR>, event: CellMouseEvent) {
  if (args.column.key === 'id') {
    event.preventGridDefault();
  }
}

<DataGrid rows={rows} columns={columns} onCellMouseDown={onCellMouseDown} />;
```

###### `onCellClick?: Maybe<(args: CellMouseArgs<R, SR>, event: CellMouseEvent) => void>`

Callback triggered when a cell is clicked.

```tsx
function onCellClick(args: CellMouseArgs<R, SR>, event: CellMouseEvent) {
  if (args.column.key === 'id') {
    event.preventGridDefault();
  }
}

<DataGrid rows={rows} columns={columns} onCellClick={onCellClick} />;
```

This event can be used to open cell editor on single click

```tsx
function onCellClick(args: CellMouseArgs<R, SR>, event: CellMouseEvent) {
  if (args.column.key === 'id') {
    args.selectCell(true);
  }
}
```

###### `onCellDoubleClick?: Maybe<(args: CellMouseArgs<R, SR>, event: CellMouseEvent) => void>`

Callback triggered when a cell is double-clicked. The default behavior is to open the editor if the cell is editable. Call `preventGridDefault` to prevent the default behavior.

```tsx
function onCellDoubleClick(args: CellMouseArgs<R, SR>, event: CellMouseEvent) {
  if (args.column.key === 'id') {
    event.preventGridDefault();
  }
}

<DataGrid rows={rows} columns={columns} onCellDoubleClick={onCellDoubleClick} />;
```

###### `onCellContextMenu?: Maybe<(args: CellMouseArgs<R, SR>, event: CellMouseEvent) => void>`

Callback triggered when a cell is right-clicked.

```tsx
function onCellContextMenu(args: CellMouseArgs<R, SR>, event: CellMouseEvent) {
  if (args.column.key === 'id') {
    event.preventDefault();
    // open custom context menu
  }
}

<DataGrid rows={rows} columns={columns} onCellContextMenu={onCellContextMenu} />;
```

###### `onCellKeyDown?: Maybe<(args: CellKeyDownArgs<R, SR>, event: CellKeyboardEvent) => void>`

A function called when keydown event is triggered on a cell. This event can be used to customize cell navigation and editing behavior.

**Examples**

- Prevent editing on `Enter`

```tsx
function onCellKeyDown(args: CellKeyDownArgs<R, SR>, event: CellKeyboardEvent) {
  if (args.mode === 'SELECT' && event.key === 'Enter') {
    event.preventGridDefault();
  }
}
```

- Prevent navigation on `Tab`

```tsx
function onCellKeyDown(args: CellKeyDownArgs<R, SR>, event: CellKeyboardEvent) {
  if (args.mode === 'SELECT' && event.key === 'Tab') {
    event.preventGridDefault();
  }
}
```

Check [more examples](website/routes/CellNavigation.tsx)

###### `onCellCopy?: Maybe<(args: CellCopyArgs<NoInfer<R>, NoInfer<SR>>, event: CellClipboardEvent) => void>`

Callback triggered when a cell's content is copied.

###### `onCellPaste?: Maybe<(args: CellPasteArgs<NoInfer<R>, NoInfer<SR>>, event: CellClipboardEvent) => void>`

Callback triggered when content is pasted into a cell.

###### `onSelectedCellChange?: Maybe<(args: CellSelectArgs<R, SR>) => void>;`

Triggered when the selected cell is changed.

Arguments:

- `args.rowIdx`: `number` - row index
- `args.row`: `R` - row object of the currently selected cell
- `args.column`: `CalculatedColumn<TRow, TSummaryRow>` - column object of the currently selected cell

###### `onScroll?: Maybe<(event: React.UIEvent<HTMLDivElement>) => void>`

Callback triggered when the grid is scrolled.

###### `onColumnResize?: Maybe<(column: CalculatedColumn<R, SR>, width: number) => void>`

Callback triggered when column is resized.

###### `onColumnsReorder?: Maybe<(sourceColumnKey: string, targetColumnKey: string) => void>`

Callback triggered when columns are reordered.

###### `enableVirtualization?: Maybe<boolean>`

**Default:** `true`

This prop can be used to disable virtualization.

###### `renderers?: Maybe<Renderers<R, SR>>`

Custom renderers for cells, rows, and other components.

```tsx
interface Renderers<TRow, TSummaryRow> {
  renderCell?: Maybe<(key: Key, props: CellRendererProps<TRow, TSummaryRow>) => ReactNode>;
  renderCheckbox?: Maybe<(props: RenderCheckboxProps) => ReactNode>;
  renderRow?: Maybe<(key: Key, props: RenderRowProps<TRow, TSummaryRow>) => ReactNode>;
  renderSortStatus?: Maybe<(props: RenderSortStatusProps) => ReactNode>;
  noRowsFallback?: Maybe<ReactNode>;
}
```

For example, the default `<Row />` component can be wrapped via the `renderRow` prop to add contexts or tweak props

```tsx
import { DataGrid, RenderRowProps, Row } from 'react-data-grid';

function myRowRenderer(key: React.Key, props: RenderRowProps<Row>) {
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

:warning: To prevent all rows from being unmounted on re-renders, make sure to pass a static or memoized render function to `renderRow`.

###### `rowClass?: Maybe<(row: R, rowIdx: number) => Maybe<string>>`

Function to apply custom class names to rows.

```tsx
import { DataGrid } from 'react-data-grid';

function MyGrid() {
  return <DataGrid columns={columns} rows={rows} rowClass={rowClass} />;
}

function rowClass(row: Row, rowIdx: number) {
  return rowIdx % 2 === 0 ? 'even' : 'odd';
}
```

###### `headerRowClass?: Maybe<string>>`

Custom class name for the header row.

###### `direction?: Maybe<'ltr' | 'rtl'>`

This property sets the text direction of the grid, it defaults to `'ltr'` (left-to-right). Setting `direction` to `'rtl'` has the following effects:

- Columns flow from right to left
- Frozen columns are pinned on the right
- Column resize cursor is shown on the left edge of the column
- Scrollbar is moved to the left

###### `className?: string | undefined`

Custom class name for the grid.

###### `style?: CSSProperties | undefined`

Custom styles for the grid.

###### `'aria-label'?: string | undefined`

The label of the grid. We recommend providing a label using `aria-label` or `aria-labelledby`

###### `'aria-labelledby'?: string | undefined`

The id of the element containing a label for the grid. We recommend providing a label using `aria-label` or `aria-labelledby`

###### `'aria-description'?: string | undefined`

###### `'aria-describedby'?: string | undefined`

If the grid has a caption or description, `aria-describedby` can be set on the grid element with a value referring to the element containing the description.

###### `'data-testid'?: Maybe<string>`

This prop can be used to add a testid for testing. We recommend querying the grid by by its `role` and `name`.

```tsx
function MyGrid() {
  return <DataGrid aria-label="my-grid" columns={columns} rows={rows} />;
}

test('grid', async () => {
  await render(<MyGrid />);
  const grid = screen.getByRole('grid', { name: 'my-grid' });
});
```

#### `<TreeDataGrid />`

`TreeDataGrid` is component built on top of `DataGrid` to add row grouping. This implements the [Treegrid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/). At the moment `TreeDataGrid` does not support `onFill` and `isRowSelectionDisabled` props

##### TreeDataGridProps

###### `groupBy?: Maybe<readonly string[]>`

###### `rowGrouper?: Maybe<(rows: readonly R[], columnKey: string) => Record<string, readonly R[]>>`

###### `expandedGroupIds?: Maybe<ReadonlySet<unknown>>`

###### `onExpandedGroupIdsChange?: Maybe<(expandedGroupIds: Set<unknown>) => void>`

###### `groupIdGetter?: Maybe<(groupKey: string, parentId?: string) => string>`

#### `<Row />`

The default row component. Can be wrapped via the `renderers.renderRow` prop.

##### Props

`RenderRowProps<TRow, TSummaryRow>` - See the Types section below.

The `ref` prop is supported.

#### `<Cell />`

The default cell component. Can be wrapped via the `renderers.renderCell` prop.

##### Props

`CellRendererProps<TRow, TSummaryRow>` - See the Types section below.

#### `<SelectCellFormatter />`

A formatter component for rendering row selection checkboxes.

##### Props

###### `value: boolean`

Whether the checkbox is checked.

###### `tabIndex: number`

The tab index for keyboard navigation.

###### `disabled?: boolean | undefined`

Whether the checkbox is disabled.

###### `onChange: (value: boolean, isShiftClick: boolean) => void`

Callback when the checkbox state changes.

###### `onClick?: MouseEventHandler<T> | undefined`

Optional click handler.

###### `'aria-label'?: string | undefined`

Accessible label for the checkbox.

###### `'aria-labelledby'?: string | undefined`

ID of the element that labels the checkbox.

### Hooks

#### `useHeaderRowSelection()`

Hook for managing header row selection state. Used within custom header cell renderers to implement custom "select all" functionality.

**Returns:**

- `isIndeterminate: boolean` - Whether some (but not all) rows are selected
- `isRowSelected: boolean` - Whether all rows are selected
- `onRowSelectionChange: (event: SelectHeaderRowEvent) => void` - Callback to change selection state

**Example:**

```tsx
function CustomHeaderCell() {
  const { isIndeterminate, isRowSelected, onRowSelectionChange } = useHeaderRowSelection();

  return (
    <input
      type="checkbox"
      checked={isRowSelected}
      indeterminate={isIndeterminate}
      onChange={(event) => onRowSelectionChange({ checked: event.target.checked })}
    />
  );
}
```

#### `useRowSelection()`

Hook for managing row selection state. Used within custom cell renderers to implement custom row selection.

**Returns:**

- `isRowSelectionDisabled: boolean` - Whether selection is disabled for this row
- `isRowSelected: boolean` - Whether this row is selected
- `onRowSelectionChange: (event: SelectRowEvent<R>) => void` - Callback to change selection state

**Example:**

```tsx
function CustomSelectCell({ row }: RenderCellProps<Row>) {
  const { isRowSelectionDisabled, isRowSelected, onRowSelectionChange } = useRowSelection();

  return (
    <input
      type="checkbox"
      disabled={isRowSelectionDisabled}
      checked={isRowSelected}
      onChange={(event) =>
        onRowSelectionChange({
          row,
          checked: event.target.checked,
          isShiftClick: event.nativeEvent.shiftKey
        })
      }
    />
  );
}
```

### Render Functions

#### `renderHeaderCell<R, SR>(props: RenderHeaderCellProps<R, SR>)`

The default header cell renderer. Renders sortable columns with sort indicators.

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

#### `textEditor<TRow, TSummaryRow>(props: RenderEditCellProps<TRow, TSummaryRow>)`

A basic text editor provided for convenience.

**Example:**

```tsx
import { textEditor, type Column } from 'react-data-grid';

const columns: readonly Column<Row>[] = [
  {
    key: 'title',
    name: 'Title',
    renderEditCell: textEditor
  }
];
```

#### `renderSortIcon(props: RenderSortIconProps)`

Renders the sort direction arrow icon.

**Props:**

- `sortDirection: SortDirection | undefined` - 'ASC', 'DESC', or undefined

#### `renderSortPriority(props: RenderSortPriorityProps)`

Renders the sort priority number for multi-column sorting.

**Props:**

- `priority: number | undefined` - The sort priority (1, 2, 3, etc.)

#### `renderCheckbox(props: RenderCheckboxProps)`

Renders a checkbox input with proper styling and accessibility.

**Props:**

- `checked: boolean` - Whether the checkbox is checked
- `indeterminate?: boolean` - Whether the checkbox is in indeterminate state
- `disabled?: boolean` - Whether the checkbox is disabled
- `onChange: (checked: boolean, shift: boolean) => void` - Change handler
- `tabIndex: number` - Tab index for keyboard navigation
- `aria-label?: string` - Accessible label
- `aria-labelledby?: string` - ID of labeling element

**Example:**

```tsx
import { DataGrid, renderCheckbox } from 'react-data-grid';

<DataGrid
  renderers={{
    renderCheckbox: (props) => renderCheckbox({ ...props, 'aria-label': 'Select row' })
  }}
/>;
```

#### `renderToggleGroup<R, SR>(props: RenderGroupCellProps<R, SR>)`

Renders the expand/collapse toggle for grouped rows.

##### Props

`RenderGroupCellProps<TRow, TSummaryRow>` - See the Types section below.

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

#### `renderValue<R, SR>(props: RenderCellProps<R, SR>)`

A simple cell renderer that displays the cell value as text.

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

#### `DataGridDefaultRenderersContext`

Context for providing default renderers to the DataGrid. Used internally but can be useful for deeply nested custom components that need access to default renderers.

**Example:**

```tsx
import { DataGridDefaultRenderersContext } from 'react-data-grid';
import { useContext } from 'react';

function CustomComponent() {
  const renderers = useContext(DataGridDefaultRenderersContext);
  return renderers?.renderCheckbox?.({ ... });
}
```

### Other

#### `SelectColumn: Column<any, any>`

A pre-configured column for row selection. Includes checkbox renderers for header, regular rows, and grouped rows.

**Example:**

```tsx
import { DataGrid, SelectColumn, type Column } from 'react-data-grid';

const columns: readonly Column<Row>[] = [SelectColumn, ...otherColumns];

function MyGrid() {
  return (
    <DataGrid
      columns={columns}
      rows={rows}
      rowKeyGetter={(row) => row.id}
      selectedRows={selectedRows}
      onSelectedRowsChange={setSelectedRows}
    />
  );
}
```

#### `SELECT_COLUMN_KEY = 'rdg-select-column'`

The key used for the `SelectColumn`. Useful for identifying or filtering the select column.

**Example:**

```tsx
import { SELECT_COLUMN_KEY } from 'react-data-grid';

const nonSelectColumns = columns.filter((col) => col.key !== SELECT_COLUMN_KEY);
```

### Types

#### `Column<TRow, TSummaryRow>`

Defines the configuration for a column in the grid.

##### `name: string | ReactElement`

The name of the column. Displayed in the header cell by default.

##### `key: string`

A unique key to distinguish each column

##### `width?: Maybe<number | string>`

**Default** `auto`

Width can be any valid css grid column value. If not specified, it will be determined automatically based on grid width and specified widths of other columns.

```tsx
width: 80, // pixels
width: '25%',
width: 'max-content',
width: 'minmax(100px, max-content)',
```

`max-content` can be used to expand the column to show all the content. Note that the grid is only able to calculate column width for visible rows.

##### `minWidth?: Maybe<number>`

**Default**: `50` pixels

Minimum column width in pixels.

##### `maxWidth?: Maybe<number>`

Maximum column width in pixels.

##### `cellClass?: Maybe<string | ((row: TRow) => Maybe<string>)>`

Class name(s) for the cell. Can be a string or a function that returns a class name based on the row.

##### `headerCellClass?: Maybe<string>`

Class name(s) for the header cell.

##### `summaryCellClass?: Maybe<string | ((row: TSummaryRow) => Maybe<string>)>`

Class name(s) for the summary cell. Can be a string or a function that returns a class name based on the summary row.

##### `renderCell?: Maybe<(props: RenderCellProps<TRow, TSummaryRow>) => ReactNode>`

Render function to render the content of cells.

##### `renderHeaderCell?: Maybe<(props: RenderHeaderCellProps<TRow, TSummaryRow>) => ReactNode>`

Render function to render the content of the header cell.

##### `renderSummaryCell?: Maybe<(props: RenderSummaryCellProps<TSummaryRow, TRow>) => ReactNode>`

Render function to render the content of summary cells

##### `renderGroupCell?: Maybe<(props: RenderGroupCellProps<TRow, TSummaryRow>) => ReactNode>`

Render function to render the content of group cells when using `TreeDataGrid`.

##### `renderEditCell?: Maybe<(props: RenderEditCellProps<TRow, TSummaryRow>) => ReactNode>`

Render function to render the content of edit cells. When set, the column is automatically set to be editable

##### `editable?: Maybe<boolean | ((row: TRow) => boolean)>`

Enables cell editing. If set and no editor property specified, then a text input will be used as the cell editor.

##### `colSpan?: Maybe<(args: ColSpanArgs<TRow, TSummaryrow>) => Maybe<number>>`

Function to determine how many columns this cell should span. Returns the number of columns to span, or `undefined` for no spanning. See the `ColSpanArgs` type in the Types section below.

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

##### `frozen?: Maybe<boolean>`

**Default**: `false`

Determines whether column is frozen. Frozen columns are pinned on the left. At the moment we do not support pinning columns on the right.

##### `resizable?: Maybe<boolean>`

**Default**: `false`

Enable resizing of the column

##### `sortable?: Maybe<boolean>`

**Default**: `false`

Enable sorting of the column

##### `draggable?: Maybe<boolean>`

**Default**: `false`

Enable dragging of the column

##### `sortDescendingFirst?: Maybe<boolean>`

**Default**: `false`

Sets the column sort order to be descending instead of ascending the first time the column is sorted

##### `editorOptions`

Options for cell editing.

###### `displayCellContent?: Maybe<boolean>`

**Default**: `false`

Render the cell content in addition to the edit cell. Enable this option when the editor is rendered outside the grid, like a modal for example.

###### `commitOnOutsideClick?: Maybe<boolean>`

**Default**: `true`

Commit changes when clicking outside the cell.

###### `closeOnExternalRowChange?: Maybe<boolean>`

**Default**: `true`

Close the editor when the row changes externally.

#### `CalculatedColumn<TRow, TSummaryRow>`

Extends `Column` with additional computed properties used internally by the grid. This is the type passed to render functions.

**Additional properties:**

- `idx: number` - The column index
- `level: number` - Nesting level when using column groups
- `parent: CalculatedColumnParent | undefined` - Parent column group if nested
- All optional Column properties become required with default values

#### `CalculatedColumnParent<TRow, TSummaryRow>`

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

#### `CalculatedColumnOrColumnGroup<TRow, TSummaryRow>`

Union type representing either a `CalculatedColumnParent` or a `CalculatedColumn`.

```tsx
type CalculatedColumnOrColumnGroup<R, SR> = CalculatedColumnParent<R, SR> | CalculatedColumn<R, SR>;
```

#### `ColumnGroup<TRow, TSummaryRow>`

Defines a group of columns that share a common header.

```tsx
interface ColumnGroup<R, SR = unknown> {
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

#### `ColumnOrColumnGroup<TRow, TSummaryRow>`

Union type representing either a `Column` or a `ColumnGroup`.

#### `RowHeightArgs<TRow>`

Arguments passed to the `rowHeight` function when it's a function.

```tsx
type RowHeightArgs<TRow> = { type: 'ROW'; row: TRow } | { type: 'GROUP'; row: GroupRow<TRow> };
```

**Example:**

```tsx
function getRowHeight(args: RowHeightArgs<Row>): number {
  if (args.type === 'GROUP') {
    return 40;
  }
  return args.row.isLarge ? 60 : 35;
}

<DataGrid rowHeight={getRowHeight} ... />
```

#### `RenderCellProps<TRow, TSummaryRow>`

Props passed to custom cell renderers.

```tsx
interface RenderCellProps<TRow, TSummaryRow = unknown> {
  column: CalculatedColumn<TRow, TSummaryRow>;
  row: TRow;
  rowIdx: number;
  isCellEditable: boolean;
  tabIndex: number;
  onRowChange: (row: TRow) => void;
}
```

**Example:**

```tsx
import type { RenderCellProps } from 'react-data-grid';

function CustomCell({ row, column, onRowChange }: RenderCellProps<MyRow>) {
  return (
    <div>
      {row[column.key]}
      <button onClick={() => onRowChange({ ...row, updated: true })}>Update</button>
    </div>
  );
}
```

#### `RenderHeaderCellProps<TRow, TSummaryRow>`

Props passed to custom header cell renderers.

```tsx
interface RenderHeaderCellProps<TRow, TSummaryRow = unknown> {
  column: CalculatedColumn<TRow, TSummaryRow>;
  sortDirection: SortDirection | undefined;
  priority: number | undefined;
  tabIndex: number;
}
```

#### `RenderEditCellProps<TRow, TSummaryRow>`

Props passed to custom edit cell renderers (editors).

```tsx
interface RenderEditCellProps<TRow, TSummaryRow = unknown> {
  column: CalculatedColumn<TRow, TSummaryRow>;
  row: TRow;
  rowIdx: number;
  onRowChange: (row: TRow, commitChanges?: boolean) => void;
  onClose: (commitChanges?: boolean, shouldFocusCell?: boolean) => void;
}
```

**Example:**

```tsx
import type { RenderEditCellProps } from 'react-data-grid';

function CustomEditor({ row, column, onRowChange, onClose }: RenderEditCellProps<MyRow>) {
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

#### `RenderSummaryCellProps<TSummaryRow, TRow>`

Props passed to summary cell renderers.

```tsx
interface RenderSummaryCellProps<TSummaryRow, TRow = unknown> {
  column: CalculatedColumn<TRow, TSummaryRow>;
  row: TSummaryRow;
  tabIndex: number;
}
```

#### `RenderGroupCellProps<TRow, TSummaryRow>`

Props passed to group cell renderers when using `TreeDataGrid`.

```tsx
interface RenderGroupCellProps<TRow, TSummaryRow = unknown> {
  groupKey: unknown;
  column: CalculatedColumn<TRow, TSummaryRow>;
  row: GroupRow<TRow>;
  childRows: readonly TRow[];
  isExpanded: boolean;
  tabIndex: number;
  toggleGroup: () => void;
}
```

#### `RenderRowProps<TRow, TSummaryRow>`

Props passed to custom row renderers.

```tsx
interface RenderRowProps<TRow, TSummaryRow = unknown> {
  row: TRow;
  viewportColumns: readonly CalculatedColumn<TRow, TSummaryRow>[];
  rowIdx: number;
  selectedCellIdx: number | undefined;
  isRowSelected: boolean;
  isRowSelectionDisabled: boolean;
  gridRowStart: number;
  lastFrozenColumnIndex: number;
  draggedOverCellIdx: number | undefined;
  selectedCellEditor: ReactElement<RenderEditCellProps<TRow>> | undefined;
  onRowChange: (column: CalculatedColumn<TRow, TSummaryRow>, rowIdx: number, newRow: TRow) => void;
  rowClass: Maybe<(row: TRow, rowIdx: number) => Maybe<string>>;
  // ... and event handlers
}
```

#### `CellRendererProps<TRow, TSummaryRow>`

Props passed to the cell renderer when using `renderers.renderCell`.

Extends `RenderRowProps` with cell-specific properties like `column`, `colSpan`, `isCellSelected`, etc.

#### `Renderers<TRow, TSummaryRow>`

Custom renderer configuration for the grid.

```tsx
interface Renderers<TRow, TSummaryRow> {
  renderCell?: Maybe<(key: Key, props: CellRendererProps<TRow, TSummaryRow>) => ReactNode>;
  renderCheckbox?: Maybe<(props: RenderCheckboxProps) => ReactNode>;
  renderRow?: Maybe<(key: Key, props: RenderRowProps<TRow, TSummaryRow>) => ReactNode>;
  renderSortStatus?: Maybe<(props: RenderSortStatusProps) => ReactNode>;
  noRowsFallback?: Maybe<ReactNode>;
}
```

#### `CellMouseArgs<TRow, TSummaryRow>`

Arguments passed to cell mouse event handlers.

```tsx
interface CellMouseArgs<TRow, TSummaryRow = unknown> {
  column: CalculatedColumn<TRow, TSummaryRow>;
  row: TRow;
  rowIdx: number;
  selectCell: (enableEditor?: boolean) => void;
}
```

##### `column: CalculatedColumn<TRow, TSummaryRow>`

The column object of the cell.

##### `row: TRow`

The row object of the cell.

##### `rowIdx: number`

The row index of the cell.

##### `selectCell: (enableEditor?: boolean) => void`

Function to manually select the cell. Pass `true` to immediately start editing.

**Example:**

```tsx
import type { CellMouseArgs, CellMouseEvent } from 'react-data-grid';

function onCellClick(args: CellMouseArgs<Row>, event: CellMouseEvent) {
  console.log('Clicked cell at row', args.rowIdx, 'column', args.column.key);
  args.selectCell(true); // Select and start editing
}
```

#### `CellMouseEvent`

Extends `React.MouseEvent<HTMLDivElement>` with grid-specific methods.

##### `event.preventGridDefault(): void`

Prevents the default grid behavior for this event.

##### `event.isGridDefaultPrevented(): boolean`

Returns whether `preventGridDefault` was called.

**Example:**

```tsx
import type { CellMouseArgs, CellMouseEvent } from 'react-data-grid';

function onCellClick(args: CellMouseArgs<Row>, event: CellMouseEvent) {
  if (args.column.key === 'actions') {
    event.preventGridDefault(); // Prevent cell selection
  }
}
```

#### `CellKeyboardEvent`

Extends `React.KeyboardEvent<HTMLDivElement>` with grid-specific methods.

##### `event.preventGridDefault(): void`

Prevents the default grid behavior for this keyboard event.

##### `event.isGridDefaultPrevented(): boolean`

Returns whether `preventGridDefault` was called.

#### `CellClipboardEvent`

Type alias for `React.ClipboardEvent<HTMLDivElement>`. Used for copy and paste events.

```tsx
type CellClipboardEvent = React.ClipboardEvent<HTMLDivElement>;
```

#### `CellKeyDownArgs<TRow, TSummaryRow>`

Arguments passed to the `onCellKeyDown` handler. The shape differs based on whether the cell is in SELECT or EDIT mode.

**SELECT mode:**

```tsx
interface SelectCellKeyDownArgs<TRow, TSummaryRow> {
  mode: 'SELECT';
  column: CalculatedColumn<TRow, TSummaryRow>;
  row: TRow;
  rowIdx: number;
  selectCell: (position: Position, options?: SelectCellOptions) => void;
}
```

**EDIT mode:**

```tsx
interface EditCellKeyDownArgs<TRow, TSummaryRow> {
  mode: 'EDIT';
  column: CalculatedColumn<TRow, TSummaryRow>;
  row: TRow;
  rowIdx: number;
  navigate: () => void;
  onClose: (commitChanges?: boolean, shouldFocusCell?: boolean) => void;
}
```

**Example:**

```tsx
import type { CellKeyDownArgs, CellKeyboardEvent } from 'react-data-grid';

function onCellKeyDown(args: CellKeyDownArgs<Row>, event: CellKeyboardEvent) {
  if (args.mode === 'EDIT' && event.key === 'Escape') {
    args.onClose(false); // Close without committing
    event.preventGridDefault();
  }
}
```

#### `CellSelectArgs<TRow, TSummaryRow>`

Arguments passed to `onSelectedCellChange`.

```tsx
interface CellSelectArgs<TRow, TSummaryRow = unknown> {
  rowIdx: number;
  row: TRow | undefined;
  column: CalculatedColumn<TRow, TSummaryRow>;
}
```

#### `CellCopyArgs<TRow, TSummaryRow>`

Arguments passed to `onCellCopy`.

```tsx
interface CellCopyArgs<TRow, TSummaryRow = unknown> {
  column: CalculatedColumn<TRow, TSummaryRow>;
  row: TRow;
}
```

#### `CellPasteArgs<TRow, TSummaryRow>`

Arguments passed to `onCellPaste`.

```tsx
interface CellPasteArgs<TRow, TSummaryRow = unknown> {
  column: CalculatedColumn<TRow, TSummaryRow>;
  row: TRow;
}
```

#### `ColSpanArgs<TRow, TSummaryRow>`

Arguments passed to the `colSpan` function.

```tsx
type ColSpanArgs<TRow, TSummaryRow> =
  | { type: 'HEADER' }
  | { type: 'ROW'; row: TRow }
  | { type: 'SUMMARY'; row: TSummaryRow };
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

#### `SortColumn`

Describes a sorted column.

```tsx
interface SortColumn {
  readonly columnKey: string;
  readonly direction: SortDirection;
}
```

#### `SortDirection`

```tsx
type SortDirection = 'ASC' | 'DESC';
```

#### `RowsChangeData<TRow, TSummaryRow>`

Data provided to `onRowsChange` callback.

```tsx
interface RowsChangeData<R, SR = unknown> {
  indexes: number[];
  column: CalculatedColumn<R, SR>;
}
```

- `indexes`: Array of row indexes that changed
- `column`: The column where changes occurred

#### `SelectRowEvent<TRow>`

Event object for row selection changes.

```tsx
interface SelectRowEvent<TRow> {
  row: TRow;
  checked: boolean;
  isShiftClick: boolean;
}
```

#### `SelectHeaderRowEvent`

Event object for header row selection changes.

```tsx
interface SelectHeaderRowEvent {
  checked: boolean;
}
```

#### `FillEvent<TRow>`

Event object for drag-fill operations.

```tsx
interface FillEvent<TRow> {
  columnKey: string;
  sourceRow: TRow;
  targetRow: TRow;
}
```

Used with the `onFill` prop to handle cell value dragging.

#### `GroupRow<TRow>`

Represents a grouped row in `TreeDataGrid`.

```tsx
interface GroupRow<TRow> {
  readonly childRows: readonly TRow[];
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

#### `ColumnWidths`

A map of column widths.

```tsx
type ColumnWidths = ReadonlyMap<string, ColumnWidth>;

interface ColumnWidth {
  readonly type: 'resized' | 'measured';
  readonly width: number;
}
```

Used with `columnWidths` and `onColumnWidthsChange` props to control column widths externally.

#### `Position`

Represents a cell position in the grid.

```tsx
interface Position {
  readonly idx: number; // Column index
  readonly rowIdx: number; // Row index
}
```

#### `SelectCellOptions`

Options for programmatically selecting a cell.

```tsx
interface SelectCellOptions {
  enableEditor?: Maybe<boolean>;
  shouldFocusCell?: Maybe<boolean>;
}
```

#### `RenderCheckboxProps`

Props for custom checkbox renderers.

```tsx
interface RenderCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange: (checked: boolean, shift: boolean) => void;
  tabIndex: number;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}
```

#### `RenderSortStatusProps`

Props for custom sort status renderers.

```tsx
interface RenderSortStatusProps {
  sortDirection: SortDirection | undefined;
  priority: number | undefined;
}
```

#### `RenderSortIconProps`

Props for custom sort icon renderers.

```tsx
interface RenderSortIconProps {
  sortDirection: SortDirection | undefined;
}
```

#### `RenderSortPriorityProps`

Props for custom sort priority renderers.

```tsx
interface RenderSortPriorityProps {
  priority: number | undefined;
}
```

#### `DataGridHandle`

Handle type returned by `useImperativeHandle` for programmatic grid control.

```tsx
interface DataGridHandle {
  element: HTMLDivElement | null;
  scrollToCell: (position: Partial<Position>) => void;
  selectCell: (position: Position, options?: SelectCellOptions) => void;
}
```

**Example:**

```tsx
import { useRef } from 'react';
import { DataGrid, DataGridHandle } from 'react-data-grid';

function MyGrid() {
  const gridRef = useRef<DataGridHandle>(null);

  function scrollToTop() {
    gridRef.current?.scrollToCell({ rowIdx: 0 });
  }

  return <DataGrid ref={gridRef} columns={columns} rows={rows} />;
}
```

#### `DefaultColumnOptions<TRow, TSummaryRow>`

Default options applied to all columns.

```tsx
type DefaultColumnOptions<TRow, TSummaryRow> = Pick<
  Column<TRow, TSummaryRow>,
  'minWidth' | 'maxWidth' | 'resizable' | 'sortable' | 'draggable'
>;
```

#### `Direction`

Text direction for the grid.

```tsx
type Direction = 'ltr' | 'rtl';
```

#### `Maybe<T>`

Utility type for optional values.

```tsx
type Maybe<T> = T | undefined | null;
```

### Generics

- `R`, `TRow`: Row type
- `SR`, `TSummaryRow`: Summary row type
- `K`: Row key type
