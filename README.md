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

const columns: Column<Row>[] = [
  { key: 'id', name: 'ID' },
  { key: 'title', name: 'Title' }
];

const rows: Row[] = [
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

See [`Column`](#column).

An array of column definitions. Each column should have a key and name.

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

See [`CellMouseArgs`](#cellmouseargs) and [`CellMouseEvent`](#cellmouseevent)

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

See [`CellMouseArgs`](#cellmouseargs) and [`CellMouseEvent`](#cellmouseevent)

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

See [`CellMouseArgs`](#cellmouseargs) and [`CellMouseEvent`](#cellmouseevent)

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

See [`CellMouseArgs`](#cellmouseargs) and [`CellMouseEvent`](#cellmouseevent)

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

test('grid', () => {
  render(<MyGrid />);
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

#### `<TextEditor />`

##### Props

See [`RenderEditCellProps`](#rendereditcellprops)

#### `<Row />`

See [`renderers`](#renderers-mayberenderersr-sr)

##### Props

See [`RenderRowProps`](#renderrowprops)

The `ref` prop is supported.

#### `<SortableHeaderCell />`

##### Props

###### `onSort: (ctrlClick: boolean) => void`

###### `sortDirection: SortDirection | undefined`

###### `priority: number | undefined`

###### `tabIndex: number`

###### `children: React.ReactNode`

#### `<ValueFormatter />`

##### Props

See [`RenderCellProps`](#rendercellprops)

#### `<SelectCellFormatter />`

##### Props

###### `value: boolean`

###### `tabIndex: number`

###### `disabled?: boolean | undefined`

###### `onChange: (value: boolean, isShiftClick: boolean) => void`

###### `onClick?: MouseEventHandler<T> | undefined`

###### `'aria-label'?: string | undefined`

###### `'aria-labelledby'?: string | undefined`

#### `<ToggleGroupFormatter />`

##### Props

See [`RenderGroupCellProps`](#rendergroupcellprops)

### Hooks

#### `useHeaderRowSelection<R>(): { isIndeterminate, isRowSelected, onRowSelectionChange }`

#### `useRowSelection<R>(): { isRowSelectionDisabled, isRowSelected, onRowSelectionChange }`

### Other

#### `SelectColumn: Column<any, any>`

#### `SELECT_COLUMN_KEY = 'rdg-select-column'`

### Types

#### `Column`

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

Class name(s) for the cell

##### `headerCellClass?: Maybe<string>`

Class name(s) for the header cell.

##### `summaryCellClass?: Maybe<string | ((row: TSummaryRow) => Maybe<string>)>`

Class name(s) for the summary cell.

##### `renderCell?: Maybe<(props: RenderCellProps<TRow, TSummaryRow>) => ReactNode>`

Render function to render the content of cells.

##### `renderHeaderCell?: Maybe<(props: RenderHeaderCellProps<TRow, TSummaryRow>) => ReactNode>`

Render function to render the content of the header cell.

##### `renderSummaryCell?: Maybe<(props: RenderSummaryCellProps<TSummaryRow, TRow>) => ReactNode>`

Render function to render the content of summary cells

##### `renderEditCell?: Maybe<(props: RenderEditCellProps<TRow, TSummaryRow>) => ReactNode>`

Render function to render the content of edit cells. When set, the column is automatically set to be editable

##### `editable?: Maybe<boolean | ((row: TRow) => boolean)>`

Enables cell editing. If set and no editor property specified, then a text input will be used as the cell editor.

##### `colSpan?: Maybe<(args: ColSpanArgs<TRow, TSummaryRow>) => Maybe<number>>`

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

#### `CellMouseArgs`

##### `rowIdx: number`

Row index of the currently selected cell

##### `row: TRow`

row object of the currently selected cell

##### `column: CalculatedColumn<TRow, TSummaryRow>`

column object of the currently selected cell

##### `selectCell: (enableEditor?: boolean) => void`

function to manually select the cell and optionally pass `true` to start editing

#### `CellMouseEvent`

Extends `React.MouseEvent<HTMLDivElement>`

##### `event.preventGridDefault: () => void`

##### `event.isGridDefaultPrevented: boolean`

#### `DataGridHandle`

#### `RenderEditCellProps`

#### `RenderRowProps`

#### `RenderCellProps`

#### `RenderGroupCellProps`

### Generics

- `R`, `TRow`: Row type
- `SR`, `TSummaryRow`: Summary row type
- `K`: Row key type
