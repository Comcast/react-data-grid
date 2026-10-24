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

The DataGrid accepts standard [`className`](#classname-string--undefined) and [`style`](#style-cssproperties--undefined) props:

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

Control row heights using the [`rowHeight`](#rowheight-maybenumber--row-r--number), [`headerRowHeight`](#headerrowheight-maybenumber), and [`summaryRowHeight`](#summaryrowheight-maybenumber) props. The `rowHeight` prop supports both fixed heights and dynamic heights per row.

#### Row Classes

Apply custom CSS classes to rows using the [`rowClass`](#rowclass-mayberow-r-rowidx-number--maybestring) prop, and to header rows using the [`headerRowClass`](#headerrowclass-maybestring) prop.

#### Cell Classes

Apply custom CSS classes to cells using the [`cellClass`](#cellclass-maybestring--row-trow--maybestring) property in column definitions. You can also use [`headerCellClass`](#headercellclass-maybestring) and [`summaryCellClass`](#summarycellclass-maybestring--row-tsummaryrow--maybestring) for header and summary cells, respectively.

#### Column Widths

Control column widths using the [`width`](#width-maybenumber--string), [`minWidth`](#minwidth-maybenumber), and [`maxWidth`](#maxwidth-maybenumber) properties in column definitions. Enable column resizing using the [`resizable`](#resizable-maybeboolean) property, or use [`defaultColumnOptions`](#defaultcolumnoptions-maybedefaultcolumnoptionsr-sr) to apply it to all columns.

### Custom Renderers

Replace default components with custom implementations using the [`renderers`](#renderers-mayberenderersr-sr) prop. Columns can also have custom renderers using the [`renderCell`](#rendercell-maybeprops-rendercellcontentpropstrow-tsummaryrow--reactnode), [`renderHeaderCell`](#renderheadercell-maybeprops-renderheadercellcontentpropstrow-tsummaryrow--reactnode), [`renderSummaryCell`](#rendersummarycell-maybeprops-rendersummarycellcontentpropstsummaryrow-trow--reactnode), [`renderGroupCell`](#rendergroupcell-maybeprops-rendergroupcellcontentpropstrow-tsummaryrow--reactnode), and [`renderEditCell`](#rendereditcell-maybeprops-rendereditcellcontentpropstrow-tsummaryrow--reactnode) properties.

## API Reference

### Components

#### `<DataGrid />`

##### DataGridProps

###### `columns: readonly ColumnOrColumnGroup<R, SR>[]`

An array of column definitions and/or column groups. See the [`ColumnOrColumnGroup`](#columnorcolumngrouptrow-tsummaryrow) type for all available options.

:warning: **Performance:** Passing a new `columns` array will trigger a re-render and recalculation for the entire grid. Always memoize this prop using `useMemo` or define it outside the component to avoid unnecessary re-renders.

###### `rows: readonly R[]`

An array of rows. The row data can be of any type.

:bulb: **Performance:** The grid is optimized for efficient rendering:

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

###### `ref?: Maybe<React.Ref<DataGridHandle>>`

Optional ref for imperative APIs like scrolling to or focusing a cell. See [`DataGridHandle`](#datagridhandle).

###### `topSummaryRows?: Maybe<readonly SR[]>`

Rows pinned at the top of the grid for summary purposes.

:warning: **Performance:** Memoize this array to prevent internal memoization invalidation.

###### `bottomSummaryRows?: Maybe<readonly SR[]>`

Rows pinned at the bottom of the grid for summary purposes.

:warning: **Performance:** Memoize this array to prevent internal memoization invalidation.

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

:bulb: While optional, setting this prop is recommended for optimal performance, as the returned value is used to set the `key` prop on the row elements.

:warning: **Performance:** Define this function outside your component or memoize it with `useCallback` to prevent unnecessary re-renders.

###### `onRowsChange?: Maybe<(rows: R[], data: RowsChangeData<R, SR>) => void>`

Callback triggered when rows are changed.

The first parameter is a new rows array with both the updated rows and the other untouched rows.
The second parameter is an object with an `indexes` array highlighting which rows have changed by their index, and the `column` where the change happened. See the [`RowsChangeData`](#rowschangedatatrow-tsummaryrow) type.

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

```tsx
// Fixed height for all rows
<DataGrid columns={columns} rows={rows} rowHeight={50} />;

// Dynamic height per row
function getRowHeight(row) {
  return row.isExpanded ? 100 : 35;
}

<DataGrid columns={columns} rows={rows} rowHeight={getRowHeight} />;
```

:warning: **Performance:** When using a function, the heights of all rows are processed upfront. For large datasets (1000+ rows), this can cause performance issues if the identity of the function changes and invalidates internal memoization. Consider using a static function when possible, or memoize the `rowHeight` function.

###### `headerRowHeight?: Maybe<number>`

**Default:** `rowHeight` when it is a number, otherwise `35` pixels

Height of the header row in pixels.

###### `summaryRowHeight?: Maybe<number>`

**Default:** `rowHeight` when it is a number, otherwise `35` pixels

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

###### `columnWidths?: Maybe<ColumnWidths>`

A map of column widths containing both measured and resized widths. If not provided, an internal state is used. See the [`ColumnWidths`](#columnwidths) type.

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

Callback triggered when column widths change. If not provided, an internal state is used. See the [`ColumnWidths`](#columnwidths) type.

###### `selectedRows?: Maybe<ReadonlySet<K>>`

A set of selected row keys. `rowKeyGetter` is required for row selection to work.

###### `isRowSelectionDisabled?: Maybe<(row: R) => boolean>`

Function to determine if row selection is disabled for a specific row.

###### `onSelectedRowsChange?: Maybe<(selectedRows: Set<K>) => void>`

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

###### `sortColumns?: Maybe<readonly SortColumn[]>`

An array of sorted columns. See the [`SortColumn`](#sortcolumn) type.

Sorting is controlled: the grid does not reorder `rows` for you. Apply the sorting to your `rows` state (or derived rows) based on `sortColumns`.

###### `onSortColumnsChange?: Maybe<(sortColumns: SortColumn[]) => void>`

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

###### `defaultColumnOptions?: Maybe<DefaultColumnOptions<R, SR>>`

Default options applied to all columns. See the [`DefaultColumnOptions`](#defaultcolumnoptionstrow-tsummaryrow) type.

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

###### `onCellMouseDown?: CellMouseEventHandler<R, SR>`

Callback triggered when a pointer becomes active in a cell. The default behavior is to focus the cell. Call `preventGridDefault` to prevent the default behavior. See the [`CellMouseArgs`](#cellmouseargstrow-tsummaryrow) and [`CellMouseEvent`](#cellmouseevent) types.

```tsx
function onCellMouseDown(args: CellMouseArgs<R, SR>, event: CellMouseEvent) {
  if (args.column.key === 'id') {
    event.preventGridDefault();
  }
}

<DataGrid rows={rows} columns={columns} onCellMouseDown={onCellMouseDown} />;
```

###### `onCellClick?: CellMouseEventHandler<R, SR>`

Callback triggered when a cell is clicked. See the [`CellMouseArgs`](#cellmouseargstrow-tsummaryrow) and [`CellMouseEvent`](#cellmouseevent) types.

This event can be used to open the cell editor on a single click:

```tsx
function onCellClick(args: CellMouseArgs<R, SR>, event: CellMouseEvent) {
  if (args.column.key === 'id') {
    args.setActivePosition(true);
  }
}

<DataGrid rows={rows} columns={columns} onCellClick={onCellClick} />;
```

###### `onCellDoubleClick?: CellMouseEventHandler<R, SR>`

Callback triggered when a cell is double-clicked. The default behavior is to open the editor if the cell is editable. Call `preventGridDefault` to prevent the default behavior. See the [`CellMouseArgs`](#cellmouseargstrow-tsummaryrow) and [`CellMouseEvent`](#cellmouseevent) types.

```tsx
function onCellDoubleClick(args: CellMouseArgs<R, SR>, event: CellMouseEvent) {
  if (args.column.key === 'id') {
    event.preventGridDefault();
  }
}

<DataGrid rows={rows} columns={columns} onCellDoubleClick={onCellDoubleClick} />;
```

###### `onCellContextMenu?: CellMouseEventHandler<R, SR>`

Callback triggered when a cell is right-clicked. See the [`CellMouseArgs`](#cellmouseargstrow-tsummaryrow) and [`CellMouseEvent`](#cellmouseevent) types.

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

Callback triggered when a key is pressed in a cell. This event can be used to customize cell navigation and editing behavior. See the [`CellKeyDownArgs`](#cellkeydownargstrow-tsummaryrow) and [`CellKeyboardEvent`](#cellkeyboardevent) types.

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

See [more examples](website/routes/CellNavigation.tsx).

###### `onCellCopy?: Maybe<(args: CellCopyArgs<R, SR>, event: CellClipboardEvent) => void>`

Callback triggered when a cell's content is copied. See the [`CellCopyArgs`](#cellcopyargstrow-tsummaryrow) type.

###### `onCellPaste?: Maybe<(args: CellPasteArgs<R, SR>, event: CellClipboardEvent) => R>`

Callback triggered when content is pasted into a cell. See the [`CellPasteArgs`](#cellpasteargstrow-tsummaryrow) type.

Return the updated row; the grid will call `onRowsChange` with it.

###### `onActivePositionChange?: Maybe<(args: PositionChangeArgs<R, SR>) => void>`

Callback triggered when the active position changes. See the [`PositionChangeArgs`](#positionchangeargstrow-tsummaryrow) type.

###### `onFill?: Maybe<(event: FillEvent<R>) => R>`

Callback triggered when the value of the active cell is dragged to fill other cells. When this prop is set, a drag handle is shown on the active cell if it is editable. Drag the handle up or down to fill the cells it passes over, or double-click it to fill all the cells below.

The grid calls `onFill` for each editable target cell. Return the updated target row; the grid will call `onRowsChange` with the updated rows. See the [`FillEvent`](#filleventtrow) type.

```tsx
function onFill({ columnKey, sourceRow, targetRow }: FillEvent<Row>): Row {
  return { ...targetRow, [columnKey]: sourceRow[columnKey as keyof Row] };
}

<DataGrid columns={columns} rows={rows} onRowsChange={setRows} onFill={onFill} />;
```

###### `onScroll?: React.UIEventHandler<HTMLDivElement> | undefined`

Native DOM `onScroll` prop.

###### `onColumnResize?: Maybe<(column: CalculatedColumn<R, SR>, width: number) => void>`

Callback triggered when a column is resized. The `column` parameter is the full [`CalculatedColumn`](#calculatedcolumntrow-tsummaryrow) object, and `width` is the new width in pixels.

###### `onColumnsReorder?: Maybe<(sourceColumnKey: string, targetColumnKey: string) => void>`

Callback triggered when columns are reordered. The parameters are the `key` values of the source and target columns.

###### `enableVirtualization?: Maybe<boolean>`

**Default:** `true`

This prop can be used to disable virtualization.

###### `renderers?: Maybe<Renderers<R, SR>>`

Custom renderers for cells, rows, and other components.

See the [`Renderers`](#rendererstrow-tsummaryrow) type for the full shape.

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

The default `<Row />` component can be wrapped via `renderers.renderRow` to add contexts or tweak props:

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

###### `rowClass?: Maybe<(row: R, rowIdx: number) => Maybe<string>>`

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

:warning: **Performance:** Define this function outside your component or memoize it with `useCallback` to avoid re-rendering all rows on every render.

###### `headerRowClass?: Maybe<string>`

Custom class name for the header row.

```tsx
<DataGrid columns={columns} rows={rows} headerRowClass="sticky-header" />
```

###### `direction?: Maybe<'ltr' | 'rtl'>`

This property sets the text direction of the grid. It defaults to `'ltr'` (left-to-right). See the [`Direction`](#direction) type.

Setting `direction` to `'rtl'` has the following effects:

- Columns flow from right to left
- Start-frozen columns are pinned on the right, and end-frozen columns are pinned on the left
- Column resize cursor is shown on the left edge of the column
- Scrollbar is moved to the left

###### `className?: string | undefined`

Custom class name for the grid.

###### `style?: CSSProperties | undefined`

Custom styles for the grid.

###### `role?: string | undefined`

ARIA role for the grid container. Defaults to `grid`.

###### `'aria-label'?: string | undefined`

The label of the grid. We recommend providing a label using `aria-label` or `aria-labelledby`.

###### `'aria-labelledby'?: string | undefined`

The id of the element containing a label for the grid. We recommend providing a label using `aria-label` or `aria-labelledby`.

###### `'aria-rowcount'?: number | undefined`

Total number of rows for assistive technologies.

###### `'aria-description'?: string | undefined`

A human-readable description of the grid.

###### `'aria-describedby'?: string | undefined`

If the grid has a caption or description, `aria-describedby` can be set on the grid element with a value referring to the element containing the description.

###### `'data-testid'?: Maybe<string>`

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

###### `'data-cy'?: Maybe<string>`

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

All [`DataGridProps`](#datagridprops) are supported except those listed above. The `columns` prop only supports `Column[]` (no column groups). When `rowHeight` is a function, it receives [`RowHeightArgs`](#rowheightargstrow) instead of just the row. Additional props are listed below:

###### `groupBy: readonly string[]`

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

:warning: **Performance:** Define this array outside your component or memoize it with `useMemo`, otherwise all the rows are grouped again on every render.

###### `expandedGroupIds: ReadonlySet<unknown>`

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

###### `onExpandedGroupIdsChange: (expandedGroupIds: Set<unknown>) => void`

**Required.** Callback triggered when groups are expanded or collapsed.

###### `getRowGroupKey?: Maybe<(row: R, columnKey: string) => string>`

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

:warning: **Performance:** Define this function outside your component or memoize it with `useCallback`, otherwise all the rows are grouped again on every render.

###### `getGroupId?: Maybe<(groupKey: string, parentId?: string) => string>`

Function to generate unique IDs for group rows. If not provided, a default implementation is used that concatenates parent and group keys with `__`.

:warning: **Performance:** Define this function outside your component or memoize it with `useCallback` to prevent unnecessary re-renders.

###### `rowHeight?: Maybe<number | ((args: RowHeightArgs<R>) => number)>`

**Note:** Unlike `DataGrid`, the `rowHeight` function receives [`RowHeightArgs<R>`](#rowheightargstrow), which includes a `type` property to distinguish between regular rows and group rows:

```tsx
function getRowHeight(args: RowHeightArgs<Row>): number {
  if (args.type === 'GROUP') {
    return 50; // Custom height for group rows
  }
  return 35; // Height for regular rows
}

<TreeDataGrid rowHeight={getRowHeight} ... />
```

#### `<Row />`

The default row component. Can be wrapped via the `renderers.renderRow` prop.

##### Props

[`RenderRowProps<TRow, TSummaryRow>`](#renderrowpropstrow-tsummaryrow)

#### `<Cell />`

The default cell component. Can be wrapped via the `renderers.renderCell` prop.

##### Props

[`RenderCellProps<TRow, TSummaryRow>`](#rendercellpropstrow-tsummaryrow)

#### `<SelectCheckbox />`

A component for rendering row selection checkboxes.

##### Props

The same props as [`RenderCheckboxProps`](#rendercheckboxprops), with `value: boolean` in place of `checked`.

#### `<ToggleGroup />`

Low-level component used by `renderToggleGroup` to render the expand/collapse control. Useful if you build a custom group cell renderer.

##### Props

[`RenderGroupCellContentProps<TRow, TSummaryRow>`](#rendergroupcellcontentpropstrow-tsummaryrow)

### Hooks

#### `useHeaderRowSelection()`

Hook for managing header row selection state. Used within custom header cell renderers to implement custom "select all" functionality.

**Returns:**

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

Hook for managing row selection state. Used within custom cell renderers to implement custom row selection.

**Returns:**

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

#### `renderHeaderCell<R, SR>(props: RenderHeaderCellContentProps<R, SR>)`

The default header cell content renderer. Renders sortable columns with sort indicators.

**Props:** [`RenderHeaderCellContentProps<TRow, TSummaryRow>`](#renderheadercellcontentpropstrow-tsummaryrow)

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

#### `renderTextEditor<TRow, TSummaryRow>(props: RenderEditCellContentProps<TRow, TSummaryRow>)`

A basic text editor provided for convenience.

**Props:** [`RenderEditCellContentProps<TRow, TSummaryRow>`](#rendereditcellcontentpropstrow-tsummaryrow)

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

#### `renderSortIcon(props: RenderSortIconProps)`

Renders the sort direction arrow icon.

**Props:** [`RenderSortIconProps`](#rendersorticonprops)

#### `renderSortPriority(props: RenderSortPriorityProps)`

Renders the sort priority number for multi-column sorting.

**Props:** [`RenderSortPriorityProps`](#rendersortpriorityprops)

#### `renderCheckbox(props: RenderCheckboxProps)`

Renders a checkbox input with proper styling and accessibility.

**Props:** [`RenderCheckboxProps`](#rendercheckboxprops)

**Example:**

```tsx
import { DataGrid, renderCheckbox } from 'react-data-grid';

<DataGrid
  renderers={{
    renderCheckbox: (props) => renderCheckbox({ ...props, 'aria-label': 'Select row' })
  }}
/>;
```

#### `renderToggleGroup<R, SR>(props: RenderGroupCellContentProps<R, SR>)`

The default group cell content renderer for the columns used for grouping (`groupBy` prop). This renders the expand/collapse toggle.

**Props:** [`RenderGroupCellContentProps<TRow, TSummaryRow>`](#rendergroupcellcontentpropstrow-tsummaryrow)

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

#### `renderValue<R, SR>(props: RenderCellContentProps<R, SR>)`

The default cell content renderer that renders the value of `row[column.key]`.

**Props:** [`RenderCellContentProps<TRow, TSummaryRow>`](#rendercellcontentpropstrow-tsummaryrow)

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

#### `SelectColumn: Column<any, any>`

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

#### `SELECT_COLUMN_KEY = 'rdg-select-column'`

The key used for the `SelectColumn`. Useful for identifying or filtering the select column.

**Example:**

```tsx
import { SELECT_COLUMN_KEY } from 'react-data-grid';

const nonSelectColumns = columns.filter((column) => column.key !== SELECT_COLUMN_KEY);
```

### Types

#### `Column<TRow, TSummaryRow>`

Defines the configuration for a column in the grid.

**See also:** [`columns`](#columns-readonly-columnorcolumngroupr-sr) prop on `<DataGrid />`

##### `name: string | ReactElement`

The name of the column. Displayed in the header cell by default.

##### `key: string`

A unique key to distinguish each column.

##### `width?: Maybe<number | string>`

**Default:** `auto`

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

##### `minWidth?: Maybe<number>`

**Default:** `50` pixels

Minimum column width in pixels.

##### `maxWidth?: Maybe<number>`

Maximum column width in pixels.

##### `cellClass?: Maybe<string | ((row: TRow) => Maybe<string>)>`

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

##### `headerCellClass?: Maybe<string>`

Class name(s) for the header cell.

##### `summaryCellClass?: Maybe<string | ((row: TSummaryRow) => Maybe<string>)>`

Class name(s) for summary cells. Can be a string or a function that returns a class name based on the summary row.

##### `renderCell?: Maybe<(props: RenderCellContentProps<TRow, TSummaryRow>) => ReactNode>`

Render function to render the content of cells.

##### `renderHeaderCell?: Maybe<(props: RenderHeaderCellContentProps<TRow, TSummaryRow>) => ReactNode>`

Render function to render the content of the header cell.

##### `renderSummaryCell?: Maybe<(props: RenderSummaryCellContentProps<TSummaryRow, TRow>) => ReactNode>`

Render function to render the content of summary cells.

##### `renderGroupCell?: Maybe<(props: RenderGroupCellContentProps<TRow, TSummaryRow>) => ReactNode>`

Render function to render the content of group cells when using `TreeDataGrid`.

##### `renderEditCell?: Maybe<(props: RenderEditCellContentProps<TRow, TSummaryRow>) => ReactNode>`

Render function to render the content of edit cells. When set, the column is automatically set to be editable.

##### `editable?: Maybe<boolean | ((row: TRow) => boolean)>`

Control whether cells can be edited with `renderEditCell`.

##### `colSpan?: Maybe<(args: ColSpanArgs<TRow, TSummaryRow>) => Maybe<number>>`

Function to determine how many columns this cell should span. Returns the number of columns to span, or `undefined` for no spanning. See the [`ColSpanArgs`](#colspanargstrow-tsummaryrow) type.

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

##### `frozen?: Maybe<boolean | 'start' | 'end'>`

**Default:** `false`

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

##### `resizable?: Maybe<boolean>`

**Default:** `false`

Enable resizing of the column.

##### `sortable?: Maybe<boolean>`

**Default:** `false`

Enable sorting of the column.

##### `draggable?: Maybe<boolean>`

**Default:** `false`

Enable dragging of the column.

##### `sortDescendingFirst?: Maybe<boolean>`

**Default:** `false`

Sets the column sort order to be descending instead of ascending the first time the column is sorted.

##### `editorOptions`

Options for cell editing.

###### `displayCellContent?: Maybe<boolean>`

**Default:** `false`

Render the cell content in addition to the edit cell content. Enable this option when the editor is rendered outside the grid, like a modal for example.

###### `commitOnOutsideClick?: Maybe<boolean>`

**Default:** `true`

Commit changes when clicking outside the cell.

###### `closeOnExternalRowChange?: Maybe<boolean>`

**Default:** `true`

Close the editor when the row value changes externally.

#### `ColumnGroup<TRow, TSummaryRow>`

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

**See also:** [`ColumnOrColumnGroup`](#columnorcolumngrouptrow-tsummaryrow)

#### `ColumnOrColumnGroup<TRow, TSummaryRow>`

Union type representing either a `Column` or a `ColumnGroup`.

**See also:** [`columns`](#columns-readonly-columnorcolumngroupr-sr) prop on `<DataGrid />`

#### `CalculatedColumn<TRow, TSummaryRow>`

Extends `Column` with additional computed properties used internally by the grid. This is the type passed to render functions. Every `Column` property is set: the ones with a default value, like `width` and `renderCell`, are resolved to their default value when not set, and the others are `undefined` when not set.

```tsx
interface CalculatedColumn<TRow, TSummaryRow = unknown> extends Column<TRow, TSummaryRow> {
  /** The column group that contains the column, or `undefined` if the column is not in a group */
  readonly parent: CalculatedColumnParent<TRow, TSummaryRow> | undefined;
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
  readonly renderCell: (props: RenderCellContentProps<TRow, TSummaryRow>) => ReactNode;
  readonly renderHeaderCell: (props: RenderHeaderCellContentProps<TRow, TSummaryRow>) => ReactNode;
  // Always set, `undefined` when not set on the column
  readonly cellClass: Column<TRow, TSummaryRow>['cellClass'];
  readonly headerCellClass: Column<TRow, TSummaryRow>['headerCellClass'];
  readonly summaryCellClass: Column<TRow, TSummaryRow>['summaryCellClass'];
  readonly renderSummaryCell: Column<TRow, TSummaryRow>['renderSummaryCell'];
  readonly renderGroupCell: Column<TRow, TSummaryRow>['renderGroupCell'];
  readonly renderEditCell: Column<TRow, TSummaryRow>['renderEditCell'];
  readonly editable: Column<TRow, TSummaryRow>['editable'];
  readonly colSpan: Column<TRow, TSummaryRow>['colSpan'];
  readonly sortDescendingFirst: Column<TRow, TSummaryRow>['sortDescendingFirst'];
  readonly editorOptions: Column<TRow, TSummaryRow>['editorOptions'];
}
```

**See also:** [`Column`](#columntrow-tsummaryrow), [`onColumnResize`](#oncolumnresize-maybecolumn-calculatedcolumnr-sr-width-number--void) prop on `<DataGrid />`

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

**See also:** [`CalculatedColumn`](#calculatedcolumntrow-tsummaryrow)

#### `CalculatedColumnOrColumnGroup<TRow, TSummaryRow>`

Union type representing either a `CalculatedColumnParent` or a `CalculatedColumn`.

```tsx
type CalculatedColumnOrColumnGroup<R, SR> = CalculatedColumnParent<R, SR> | CalculatedColumn<R, SR>;
```

**See also:** [`CalculatedColumn`](#calculatedcolumntrow-tsummaryrow), [`CalculatedColumnParent`](#calculatedcolumnparenttrow-tsummaryrow)

#### `DefaultColumnOptions<TRow, TSummaryRow>`

Default options applied to all columns.

```tsx
type DefaultColumnOptions<TRow, TSummaryRow> = Pick<
  Column<TRow, TSummaryRow>,
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

**See also:** [`defaultColumnOptions`](#defaultcolumnoptions-maybedefaultcolumnoptionsr-sr) prop on `<DataGrid />`

#### `ColumnFrozen`

Whether a column is frozen, and on which edge.

```tsx
type ColumnFrozen = boolean | 'start' | 'end';
```

**See also:** [`column.frozen`](#frozen-maybeboolean--start--end)

#### `RenderCellContentProps<TRow, TSummaryRow>`

Props passed to custom cell content renderers (`column.renderCell`).

```tsx
interface RenderCellContentProps<TRow, TSummaryRow = unknown> {
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

**See also:** [`column.renderCell`](#rendercell-maybeprops-rendercellcontentpropstrow-tsummaryrow--reactnode), [`renderValue`](#rendervaluer-srprops-rendercellcontentpropsr-sr) function

#### `RenderHeaderCellContentProps<TRow, TSummaryRow>`

Props passed to custom header cell content renderers (`column.renderHeaderCell`).

```tsx
interface RenderHeaderCellContentProps<TRow, TSummaryRow = unknown> {
  column: CalculatedColumn<TRow, TSummaryRow>;
  sortDirection: SortDirection | undefined;
  priority: number | undefined;
  tabIndex: number;
}
```

**See also:** [`column.renderHeaderCell`](#renderheadercell-maybeprops-renderheadercellcontentpropstrow-tsummaryrow--reactnode), [`renderHeaderCell`](#renderheadercellr-srprops-renderheadercellcontentpropsr-sr) function

#### `RenderEditCellContentProps<TRow, TSummaryRow>`

Props passed to custom editors (`column.renderEditCell`).

```tsx
interface RenderEditCellContentProps<TRow, TSummaryRow = unknown> {
  column: CalculatedColumn<TRow, TSummaryRow>;
  row: TRow;
  rowIdx: number;
  onRowChange: (row: TRow, commitChanges?: boolean) => void;
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

**See also:** [`column.renderEditCell`](#rendereditcell-maybeprops-rendereditcellcontentpropstrow-tsummaryrow--reactnode), [`renderTextEditor`](#rendertexteditortrow-tsummaryrowprops-rendereditcellcontentpropstrow-tsummaryrow) function

#### `RenderSummaryCellContentProps<TSummaryRow, TRow>`

Props passed to summary cell content renderers (`column.renderSummaryCell`).

```tsx
interface RenderSummaryCellContentProps<TSummaryRow, TRow = unknown> {
  column: CalculatedColumn<TRow, TSummaryRow>;
  row: TSummaryRow;
  tabIndex: number;
}
```

**See also:** [`column.renderSummaryCell`](#rendersummarycell-maybeprops-rendersummarycellcontentpropstsummaryrow-trow--reactnode)

#### `RenderGroupCellContentProps<TRow, TSummaryRow>`

Props passed to group cell content renderers (`column.renderGroupCell`) when using `TreeDataGrid`.

```tsx
interface RenderGroupCellContentProps<TRow, TSummaryRow = unknown> {
  groupKey: unknown;
  column: CalculatedColumn<TRow, TSummaryRow>;
  row: GroupRow<TRow>;
  childRows: readonly TRow[];
  isExpanded: boolean;
  tabIndex: number;
  toggleGroup: () => void;
}
```

**See also:** [`column.renderGroupCell`](#rendergroupcell-maybeprops-rendergroupcellcontentpropstrow-tsummaryrow--reactnode), [`renderToggleGroup`](#rendertogglegroupr-srprops-rendergroupcellcontentpropsr-sr) function, [`<ToggleGroup />`](#togglegroup-)

#### `RenderRowProps<TRow, TSummaryRow>`

Props passed to custom row renderers.

```tsx
interface RenderRowProps<TRow, TSummaryRow = unknown> {
  row: TRow;
  /**
   * Calls `callback` for each cell to render in the row, and returns the results.
   * `activeIdx` is the column index of the row's active cell, if any: that cell is rendered even when it is scrolled out of view.
   * If virtualization would leave out the active row, it is rendered with only its active cell, if any.
   * `colSpanArgs` is passed to `column.colSpan`, and the columns that a cell spans are skipped, even the active one.
   * The callback receives the cell's column, whether the cell is active, its `colSpan`, and its index in the results.
   */
  mapViewportColumns: MapViewportColumns<TRow, TSummaryRow>;
  rowIdx: number;
  activeCellIdx: number | undefined;
  isRowSelectionDisabled: boolean;
  isRowSelected: boolean;
  gridRowStart: number;
  draggedOverCellIdx: number | undefined;
  activeCellEditor: ReactElement<EditCellProps<TRow, TSummaryRow>> | undefined;
  onRowChange: (column: CalculatedColumn<TRow, TSummaryRow>, rowIdx: number, newRow: TRow) => void;
  rowClass: Maybe<(row: TRow, rowIdx: number) => Maybe<string>>;
  isTreeGrid: boolean;
  setActivePosition: (position: Position, options?: SetActivePositionOptions) => void;
  // ... and DOM props, cell event handlers (onCellMouseDown, onCellClick, onCellDoubleClick, onCellContextMenu)
}
```

**See also:** [`renderers.renderRow`](#renderers-mayberenderersr-sr), [`<Row />`](#row-), [`MapViewportColumns`](#mapviewportcolumnstrow-tsummaryrow-internal)

#### `MapViewportColumns<TRow, TSummaryRow>` (internal)

Type of `mapViewportColumns` in `RenderRowProps`. This helper type is not exported; the shape is shown for reference.

```tsx
type MapViewportColumns<TRow, TSummaryRow> = <T>(
  activeIdx: number | undefined,
  colSpanArgs: ColSpanArgs<TRow, TSummaryRow> | undefined,
  callback: (
    column: CalculatedColumn<TRow, TSummaryRow>,
    isCellActive: boolean,
    colSpan: number | undefined,
    index: number
  ) => T
) => T[];
```

**See also:** [`RenderRowProps`](#renderrowpropstrow-tsummaryrow), [`ColSpanArgs`](#colspanargstrow-tsummaryrow)

#### `RenderCellProps<TRow, TSummaryRow>`

Props passed to the cell renderer when using `renderers.renderCell`.

```tsx
interface RenderCellProps<TRow, TSummaryRow> {
  column: CalculatedColumn<TRow, TSummaryRow>;
  row: TRow;
  rowIdx: number;
  colSpan: number | undefined;
  isDraggedOver: boolean;
  isCellActive: boolean;
  onRowChange: (column: CalculatedColumn<TRow, TSummaryRow>, rowIdx: number, newRow: TRow) => void;
  setActivePosition: (position: Position, options?: SetActivePositionOptions) => void;
  // ... and DOM props, cell event handlers (onCellMouseDown, onCellClick, onCellDoubleClick, onCellContextMenu)
}
```

**See also:** [`renderers.renderCell`](#renderers-mayberenderersr-sr), [`<Cell />`](#cell-)

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

**See also:** [`renderCheckbox`](#rendercheckboxprops-rendercheckboxprops) function, [`renderers.renderCheckbox`](#renderers-mayberenderersr-sr), [`<SelectCheckbox />`](#selectcheckbox-)

#### `RenderSortStatusProps`

Props for custom sort status renderers.

```tsx
interface RenderSortStatusProps extends RenderSortIconProps, RenderSortPriorityProps {}
```

**See also:** [`renderers.renderSortStatus`](#renderers-mayberenderersr-sr)

#### `RenderSortIconProps`

Props for custom sort icon renderers.

```tsx
interface RenderSortIconProps {
  /** The sort direction of the column, or `undefined` if it is not sorted */
  sortDirection: SortDirection | undefined;
}
```

**See also:** [`renderSortIcon`](#rendersorticonprops-rendersorticonprops) function

#### `RenderSortPriorityProps`

Props for custom sort priority renderers.

```tsx
interface RenderSortPriorityProps {
  /** The column's position in `sortColumns`, starting at 1, when sorting by multiple columns, or `undefined` otherwise */
  priority: number | undefined;
}
```

**See also:** [`renderSortPriority`](#rendersortpriorityprops-rendersortpriorityprops) function

#### `Renderers<TRow, TSummaryRow>`

Custom renderer configuration for the grid.

```tsx
interface Renderers<TRow, TSummaryRow> {
  renderCell?: Maybe<(key: Key, props: RenderCellProps<TRow, TSummaryRow>) => ReactNode>;
  renderCheckbox?: Maybe<(props: RenderCheckboxProps) => ReactNode>;
  renderRow?: Maybe<(key: Key, props: RenderRowProps<TRow, TSummaryRow>) => ReactNode>;
  renderSortStatus?: Maybe<(props: RenderSortStatusProps) => ReactNode>;
  noRowsFallback?: Maybe<ReactNode>;
}
```

**See also:** [`renderers`](#renderers-mayberenderersr-sr) prop on `<DataGrid />`, [`DataGridRenderersContext`](#datagridrendererscontext)

#### `CellMouseArgs<TRow, TSummaryRow>`

Arguments passed to cell mouse event handlers.

```tsx
interface CellMouseArgs<TRow, TSummaryRow = unknown> {
  /** The column object of the cell. */
  column: CalculatedColumn<TRow, TSummaryRow>;
  /** The row object of the cell. */
  row: TRow;
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

**See also:** [`onCellMouseDown`](#oncellmousedown-cellmouseeventhandlerr-sr), [`onCellClick`](#oncellclick-cellmouseeventhandlerr-sr), [`onCellDoubleClick`](#oncelldoubleclick-cellmouseeventhandlerr-sr), and [`onCellContextMenu`](#oncellcontextmenu-cellmouseeventhandlerr-sr) props on `<DataGrid />`

#### `CellMouseEventHandler<TRow, TSummaryRow>` (internal)

Handler type used by `onCellMouseDown`, `onCellClick`, `onCellDoubleClick`, and `onCellContextMenu`. This helper type is not exported; the shape is shown for reference.

```tsx
type CellMouseEventHandler<TRow, TSummaryRow> = Maybe<
  (args: CellMouseArgs<TRow, TSummaryRow>, event: CellMouseEvent) => void
>;
```

#### `CellEvent<E>` (internal)

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

**See also:** [`onCellMouseDown`](#oncellmousedown-cellmouseeventhandlerr-sr), [`onCellClick`](#oncellclick-cellmouseeventhandlerr-sr), [`onCellDoubleClick`](#oncelldoubleclick-cellmouseeventhandlerr-sr), and [`onCellContextMenu`](#oncellcontextmenu-cellmouseeventhandlerr-sr) props on `<DataGrid />`

#### `CellKeyDownArgs<TRow, TSummaryRow>`

Arguments passed to the `onCellKeyDown` handler. The shape differs based on whether the cell is in ACTIVE or EDIT mode.

**ACTIVE mode:**

```tsx
interface ActiveCellKeyDownArgs<TRow, TSummaryRow = unknown> {
  mode: 'ACTIVE';
  /**
   * column object of the active position,
   * undefined if the active position is a row instead of a cell
   */
  column: CalculatedColumn<TRow, TSummaryRow> | undefined;
  row: TRow;
  rowIdx: number;
  setActivePosition: (position: Position, options?: SetActivePositionOptions) => void;
}
```

**EDIT mode:**

```tsx
interface EditCellKeyDownArgs<TRow, TSummaryRow = unknown> {
  mode: 'EDIT';
  column: CalculatedColumn<TRow, TSummaryRow>;
  row: TRow;
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

**See also:** [`onCellKeyDown`](#oncellkeydown-maybeargs-cellkeydownargsr-sr-event-cellkeyboardevent--void) prop on `<DataGrid />`

#### `CellKeyboardEvent`

Extends `React.KeyboardEvent<HTMLDivElement>` with grid-specific methods.

```tsx
type CellKeyboardEvent = CellEvent<React.KeyboardEvent<HTMLDivElement>>;
```

**See also:** [`onCellKeyDown`](#oncellkeydown-maybeargs-cellkeydownargsr-sr-event-cellkeyboardevent--void) prop on `<DataGrid />`

#### `CellClipboardEvent` (internal)

Type alias for `React.ClipboardEvent<HTMLDivElement>`. Used for copy and paste events. This helper type is not exported; the shape is shown for reference.

```tsx
type CellClipboardEvent = React.ClipboardEvent<HTMLDivElement>;
```

**See also:** [`onCellCopy`](#oncellcopy-maybeargs-cellcopyargsr-sr-event-cellclipboardevent--void) and [`onCellPaste`](#oncellpaste-maybeargs-cellpasteargsr-sr-event-cellclipboardevent--r) props on `<DataGrid />`

#### `CellCopyArgs<TRow, TSummaryRow>`

Arguments passed to `onCellCopy`.

```tsx
interface CellCopyArgs<TRow, TSummaryRow = unknown> {
  column: CalculatedColumn<TRow, TSummaryRow>;
  row: TRow;
}
```

**See also:** [`onCellCopy`](#oncellcopy-maybeargs-cellcopyargsr-sr-event-cellclipboardevent--void) prop on `<DataGrid />`

#### `CellPasteArgs<TRow, TSummaryRow>`

Arguments passed to `onCellPaste`.

```tsx
interface CellPasteArgs<TRow, TSummaryRow = unknown> {
  column: CalculatedColumn<TRow, TSummaryRow>;
  row: TRow;
}
```

**See also:** [`onCellPaste`](#oncellpaste-maybeargs-cellpasteargsr-sr-event-cellclipboardevent--r) prop on `<DataGrid />`

#### `PositionChangeArgs<TRow, TSummaryRow>`

Arguments passed to `onActivePositionChange`.

```tsx
interface PositionChangeArgs<TRow, TSummaryRow = unknown> {
  /** row index of the active position */
  rowIdx: number;
  /**
   * row object of the active position,
   * undefined if the active position is on a header or summary row
   */
  row: TRow | undefined;
  /**
   * column object of the active position,
   * undefined if the active position is a row instead of a cell
   */
  column: CalculatedColumn<TRow, TSummaryRow> | undefined;
}
```

**See also:** [`onActivePositionChange`](#onactivepositionchange-maybeargs-positionchangeargsr-sr--void) prop on `<DataGrid />`

#### `ColSpanArgs<TRow, TSummaryRow>`

Arguments passed to the `colSpan` function.

```tsx
type ColSpanArgs<TRow, TSummaryRow> =
  | { readonly type: 'HEADER' }
  | { readonly type: 'ROW'; readonly row: TRow }
  | { readonly type: 'SUMMARY'; readonly row: TSummaryRow };
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

**See also:** [`column.colSpan`](#colspan-maybeargs-colspanargstrow-tsummaryrow--maybenumber)

#### `RowHeightArgs<TRow>`

Arguments passed to `TreeDataGrid`'s `rowHeight` prop when it is a function.

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

<TreeDataGrid rowHeight={getRowHeight} ... />
```

**See also:** [`rowHeight`](#rowheight-maybenumber--args-rowheightargsr--number) prop on `<TreeDataGrid />`

#### `SortColumn`

Describes a sorted column.

```tsx
interface SortColumn {
  readonly columnKey: string;
  readonly direction: SortDirection;
}
```

**See also:** [`sortColumns`](#sortcolumns-maybereadonly-sortcolumn) and [`onSortColumnsChange`](#onsortcolumnschange-maybesortcolumns-sortcolumn--void) props on `<DataGrid />`

#### `SortDirection`

```tsx
type SortDirection = 'ASC' | 'DESC';
```

**See also:** [`SortColumn`](#sortcolumn)

#### `RowsChangeData<TRow, TSummaryRow>`

Data provided to the `onRowsChange` callback.

```tsx
interface RowsChangeData<R, SR = unknown> {
  /** Indexes of the rows that changed */
  indexes: number[];
  /** The column of the cells that changed */
  column: CalculatedColumn<R, SR>;
}
```

**See also:** [`onRowsChange`](#onrowschange-mayberows-r-data-rowschangedatar-sr--void) prop on `<DataGrid />`

#### `SelectRowEvent<TRow>`

Event object for row selection changes.

```tsx
interface SelectRowEvent<TRow> {
  row: TRow;
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

#### `FillEvent<TRow>`

Event object for drag-fill operations.

```tsx
interface FillEvent<TRow> {
  columnKey: string;
  sourceRow: TRow;
  targetRow: TRow;
}
```

**See also:** [`onFill`](#onfill-maybeevent-filleventr--r) prop on `<DataGrid />`

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

**See also:** [`ref`](#ref-maybereactrefdatagridhandle) prop on `<DataGrid />`

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

**See also:** [`DataGridHandle`](#datagridhandle), [`CellKeyDownArgs`](#cellkeydownargstrow-tsummaryrow)

#### `PartialPosition` (internal)

Position for scrolling to a cell. Both fields are optional: omit `idx` to scroll to a row, or omit `rowIdx` to scroll to a column. This helper type is not exported; the shape is shown for reference.

```tsx
interface PartialPosition {
  readonly idx?: Maybe<number>;
  readonly rowIdx?: Maybe<number>;
}
```

**See also:** [`DataGridHandle`](#datagridhandle)

#### `SetActivePositionOptions`

Options for programmatically updating the grid's active position.

```tsx
interface SetActivePositionOptions {
  enableEditor?: Maybe<boolean>;
  shouldFocus?: Maybe<boolean>;
}
```

**See also:** [`DataGridHandle`](#datagridhandle), [`CellKeyDownArgs`](#cellkeydownargstrow-tsummaryrow)

#### `ColumnWidths`

A map of column widths.

```tsx
type ColumnWidths = ReadonlyMap<string, ColumnWidth>;
```

**See also:** [`columnWidths`](#columnwidths-maybecolumnwidths) and [`onColumnWidthsChange`](#oncolumnwidthschange-maybecolumnwidths-columnwidths--void) props on `<DataGrid />`

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

**See also:** [`ColumnWidths`](#columnwidths)

#### `Direction`

Text direction of the grid.

```tsx
type Direction = 'ltr' | 'rtl';
```

**See also:** [`direction`](#direction-maybeltr--rtl) prop on `<DataGrid />`

#### `GroupRow<TRow>` (internal)

Represents a group row in `TreeDataGrid`. This helper type is not exported; the shape is shown for reference.

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

**See also:** [`RenderGroupCellContentProps`](#rendergroupcellcontentpropstrow-tsummaryrow), [`RowHeightArgs`](#rowheightargstrow), [`<TreeDataGrid />`](#treedatagrid-)

#### `Maybe<T>` (internal)

Utility type for optional values. This helper type is not exported; the shape is shown for reference.

```tsx
type Maybe<T> = T | undefined | null;
```

### Generics

- `R`, `TRow`: Row type
- `SR`, `TSummaryRow`: Summary row type
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
