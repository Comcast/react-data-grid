import { useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { Key, KeyboardEvent } from 'react';
import { flushSync } from 'react-dom';

import {
  HeaderRowSelectionChangeContext,
  HeaderRowSelectionContext,
  RowSelectionChangeContext,
  useActivePosition,
  useCalculatedColumns,
  useColumnWidths,
  useGridDimensions,
  useLatestFunc,
  useScrollState,
  useScrollToPosition,
  useViewportColumns,
  useViewportRows,
  type ActivePosition,
  type HeaderRowSelectionContextValue,
  type PartialPosition
} from './hooks';
import {
  assertIsValidKeyGetter,
  canExitGrid,
  classnames,
  createCellEvent,
  focusCell,
  getCellStyle,
  getCellToScroll,
  getLeftRightKey,
  getNextActivePosition,
  isCellEditableUtil,
  isCtrlKeyHeldDown,
  isDefaultCellInput,
  isElement,
  renderMeasuringCells,
  scrollIntoView
} from './utils';
import type {
  CalculatedColumn,
  CellClipboardEvent,
  CellCopyArgs,
  CellKeyboardEvent,
  CellKeyDownArgs,
  CellMouseEventHandler,
  CellNavigationMode,
  CellPasteArgs,
  PositionChangeArgs,
  Column,
  ColumnOrColumnGroup,
  ColumnWidths,
  Direction,
  FillEvent,
  Maybe,
  Position,
  Renderers,
  RowsChangeData,
  SetActivePositionOptions,
  SelectHeaderRowEvent,
  SelectRowEvent,
  SortColumn
} from './types';
import { defaultRenderCell } from './Cell';
import { renderCheckbox as defaultRenderCheckbox } from './cellRenderers';
import { DataGridRenderersContext, useRenderers } from './DataGridRenderersContext';
import EditCell from './EditCell';
import GroupedColumnHeaderRow from './GroupedColumnHeaderRow';
import HeaderRow from './HeaderRow';
import { defaultRenderRow } from './Row';
import { default as defaultRenderSortStatus } from './sortStatus';
import { cellDragHandleClassname, cellDragHandleFrozenClassname } from './style/cell';
import {
  rootClassname,
  frozenColumnShadowEndClassname,
  frozenColumnShadowEndTopClassname,
  frozenColumnShadowStartClassname,
  frozenColumnShadowStartTopClassname,
  viewportDraggingClassname
} from './style/core';
import SummaryRow from './SummaryRow';

/**
 * Default options applied to all columns.
 *
 * @see {@linkcode DataGridProps.defaultColumnOptions | defaultColumnOptions} prop on `<DataGrid />`
 */
export type DefaultColumnOptions<R, SR> = Pick<
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

/**
 * Handle type assigned to a grid's `ref` for programmatic grid control.
 *
 * @example
 * ```tsx
 * import { useRef } from 'react';
 * import { DataGrid, type DataGridHandle } from 'react-data-grid';
 *
 * function MyGrid() {
 *   const gridRef = useRef<DataGridHandle>(null);
 *
 *   function scrollToTop() {
 *     gridRef.current?.scrollToCell({ rowIdx: 0 });
 *   }
 *
 *   return <DataGrid ref={gridRef} columns={columns} rows={rows} />;
 * }
 * ```
 *
 * @see {@linkcode DataGridProps.ref | ref} prop on `<DataGrid />`
 */
export interface DataGridHandle {
  element: HTMLDivElement | null;
  scrollToCell: (position: PartialPosition) => void;
  setActivePosition: (position: Position, options?: SetActivePositionOptions) => void;
}

/**
 * @typeParam R - Row type
 * @typeParam SR - Summary row type
 * @typeParam K - Row key type
 */
export interface DataGridProps<R, SR = unknown, K extends Key = Key> {
  /**
   * Optional ref for imperative APIs like scrolling to or focusing a cell. See {@linkcode DataGridHandle}.
   */
  ref?: Maybe<React.Ref<DataGridHandle>>;
  /**
   * Grid and data props
   */
  /**
   * An array of column definitions and/or column groups. See the {@linkcode ColumnOrColumnGroup} type for all available options.
   *
   * ⚠️ **Performance:** Passing a new `columns` array will trigger a re-render and recalculation for the entire grid. Always memoize this prop using `useMemo` or define it outside the component to avoid unnecessary re-renders.
   */
  columns: readonly ColumnOrColumnGroup<NoInfer<R>, NoInfer<SR>>[];
  /**
   * An array of rows. The row data can be of any type.
   *
   * 💡 **Performance:** The grid is optimized for efficient rendering:
   *
   * - **Virtualization**: Only visible rows are rendered in the DOM
   * - **Individual row updates**: Row components are memoized, so updating a single row object will only re-render that specific row, not all rows
   * - **Array reference matters**: Changing the array reference itself (e.g., `setRows([...rows])`) triggers viewport and layout recalculations, even if the row objects are unchanged
   * - **Best practice**: When updating rows, create a new array but reuse unchanged row objects. For example:
   *
   *   ```tsx
   *   // ✅ Good: Only the changed row is re-rendered
   *   setRows(rows.map((row, idx) => (idx === targetIdx ? { ...row, updated: true } : row)));
   *
   *   // ❌ Avoid: Creates new references for all rows, causing all visible rows to re-render
   *   setRows(rows.map((row) => ({ ...row })));
   *   ```
   */
  rows: readonly R[];
  /**
   * Rows pinned at the top of the grid for summary purposes.
   *
   * ⚠️ **Performance:** Memoize this array to prevent internal memoization invalidation.
   */
  topSummaryRows?: Maybe<readonly SR[]>;
  /**
   * Rows pinned at the bottom of the grid for summary purposes.
   *
   * ⚠️ **Performance:** Memoize this array to prevent internal memoization invalidation.
   */
  bottomSummaryRows?: Maybe<readonly SR[]>;
  /**
   * Function to return a unique key/identifier for each row. `rowKeyGetter` is required for row selection to work.
   *
   * ```tsx
   * import { DataGrid } from 'react-data-grid';
   *
   * interface Row {
   *   id: number;
   *   name: string;
   * }
   *
   * function rowKeyGetter(row: Row) {
   *   return row.id;
   * }
   *
   * function MyGrid() {
   *   return <DataGrid columns={columns} rows={rows} rowKeyGetter={rowKeyGetter} />;
   * }
   * ```
   *
   * 💡 While optional, setting this prop is recommended for optimal performance, as the returned value is used to set the `key` prop on the row elements.
   *
   * ⚠️ **Performance:** Define this function outside your component or memoize it with `useCallback` to prevent unnecessary re-renders.
   */
  rowKeyGetter?: Maybe<(row: NoInfer<R>) => K>;
  /**
   * Callback triggered when rows are changed.
   *
   * The first parameter is a new rows array with both the updated rows and the other untouched rows.
   * The second parameter is an object with an `indexes` array highlighting which rows have changed by their index, and the `column` where the change happened. See the {@linkcode RowsChangeData} type.
   *
   * ```tsx
   * import { useState } from 'react';
   * import { DataGrid } from 'react-data-grid';
   *
   * function MyGrid() {
   *   const [rows, setRows] = useState(initialRows);
   *
   *   return <DataGrid columns={columns} rows={rows} onRowsChange={setRows} />;
   * }
   * ```
   */
  onRowsChange?: Maybe<(rows: NoInfer<R>[], data: RowsChangeData<NoInfer<R>, NoInfer<SR>>) => void>;

  /**
   * Dimensions props
   */
  /**
   * Height of each row in pixels. A function can be used to set different row heights.
   *
   * ```tsx
   * // Fixed height for all rows
   * <DataGrid columns={columns} rows={rows} rowHeight={50} />;
   *
   * // Dynamic height per row
   * function getRowHeight(row) {
   *   return row.isExpanded ? 100 : 35;
   * }
   *
   * <DataGrid columns={columns} rows={rows} rowHeight={getRowHeight} />;
   * ```
   *
   * ⚠️ **Performance:** When using a function, the heights of all rows are processed upfront. For large datasets (1000+ rows), this can cause performance issues if the identity of the function changes and invalidates internal memoization. Consider using a static function when possible, or memoize the `rowHeight` function.
   *
   * @defaultValue `35` pixels
   */
  rowHeight?: Maybe<number | ((row: NoInfer<R>) => number)>;
  /**
   * Height of the header row in pixels.
   *
   * @defaultValue `rowHeight` when it is a number, otherwise `35` pixels
   */
  headerRowHeight?: Maybe<number>;
  /**
   * Height of each summary row in pixels.
   *
   * ```tsx
   * <DataGrid
   *   columns={columns}
   *   rows={rows}
   *   rowHeight={35}
   *   headerRowHeight={45}
   *   summaryRowHeight={40}
   *   topSummaryRows={topSummaryRows}
   * />
   * ```
   *
   * @defaultValue `rowHeight` when it is a number, otherwise `35` pixels
   */
  summaryRowHeight?: Maybe<number>;
  /**
   * A map of column widths containing both measured and resized widths. If not provided, an internal state is used. See the {@linkcode ColumnWidths} type.
   *
   * ```tsx
   * const [columnWidths, setColumnWidths] = useState((): ColumnWidths => new Map());
   *
   * function addNewRow() {
   *   setRows(...);
   *   // reset column widths after adding a new row
   *   setColumnWidths(new Map());
   * }
   *
   * return <DataGrid columnWidths={columnWidths} onColumnWidthsChange={setColumnWidths} ... />
   * ```
   */
  columnWidths?: Maybe<ColumnWidths>;
  /**
   * Callback triggered when column widths change. If not provided, an internal state is used. See the {@linkcode ColumnWidths} type.
   */
  onColumnWidthsChange?: Maybe<(columnWidths: ColumnWidths) => void>;

  /**
   * Feature props
   */
  /**
   * A set of selected row keys. `rowKeyGetter` is required for row selection to work.
   */
  selectedRows?: Maybe<ReadonlySet<K>>;
  /**
   * Function to determine if row selection is disabled for a specific row.
   */
  isRowSelectionDisabled?: Maybe<(row: NoInfer<R>) => boolean>;
  /**
   * Callback triggered when the selection changes.
   *
   * ```tsx
   * import { useState } from 'react';
   * import { DataGrid, SelectColumn, type Column } from 'react-data-grid';
   *
   * const rows: readonly Row[] = [...];
   *
   * const columns: readonly Column<Row>[] = [
   *   SelectColumn,
   *   // other columns
   * ];
   *
   * function rowKeyGetter(row: Row) {
   *   return row.id;
   * }
   *
   * function isRowSelectionDisabled(row: Row) {
   *   return !row.isActive;
   * }
   *
   * function MyGrid() {
   *   const [selectedRows, setSelectedRows] = useState((): ReadonlySet<number> => new Set());
   *
   *   return (
   *     <DataGrid
   *       rowKeyGetter={rowKeyGetter}
   *       columns={columns}
   *       rows={rows}
   *       selectedRows={selectedRows}
   *       isRowSelectionDisabled={isRowSelectionDisabled}
   *       onSelectedRowsChange={setSelectedRows}
   *     />
   *   );
   * }
   * ```
   */
  onSelectedRowsChange?: Maybe<(selectedRows: Set<NoInfer<K>>) => void>;
  /**
   * An array of sorted columns. See the {@linkcode SortColumn} type.
   *
   * Sorting is controlled: the grid does not reorder `rows` for you. Apply the sorting to your `rows` state (or derived rows) based on `sortColumns`.
   */
  sortColumns?: Maybe<readonly SortColumn[]>;
  /**
   * Callback triggered when sorting changes.
   *
   * ```tsx
   * import { useState } from 'react';
   * import { DataGrid, type Column, type SortColumn } from 'react-data-grid';
   *
   * const rows: readonly Row[] = [...];
   *
   * const columns: readonly Column<Row>[] = [
   *   {
   *     key: 'name',
   *     name: 'Name',
   *     sortable: true
   *   },
   *   // other columns
   * ];
   *
   * function MyGrid() {
   *   const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);
   *
   *   return (
   *     <DataGrid
   *       columns={columns}
   *       rows={rows}
   *       sortColumns={sortColumns}
   *       onSortColumnsChange={setSortColumns}
   *     />
   *   );
   * }
   * ```
   *
   * More than one column can be sorted via Ctrl+Click (Cmd+Click on macOS). To disable multi-column sorting, change the `onSortColumnsChange` function to:
   *
   * ```tsx
   * function onSortColumnsChange(sortColumns: SortColumn[]) {
   *   setSortColumns(sortColumns.slice(-1));
   * }
   * ```
   */
  onSortColumnsChange?: Maybe<(sortColumns: SortColumn[]) => void>;
  /**
   * Default options applied to all columns. See the {@linkcode DefaultColumnOptions} type.
   *
   * ```tsx
   * function MyGrid() {
   *   return (
   *     <DataGrid
   *       columns={columns}
   *       rows={rows}
   *       defaultColumnOptions={{
   *         minWidth: 100,
   *         resizable: true,
   *         sortable: true,
   *         draggable: true
   *       }}
   *     />
   *   );
   * }
   * ```
   */
  defaultColumnOptions?: Maybe<DefaultColumnOptions<NoInfer<R>, NoInfer<SR>>>;

  /**
   * Event props
   */
  /**
   * Callback triggered when a pointer becomes active in a cell. The default behavior is to focus the cell. Call `preventGridDefault` to prevent the default behavior. See the {@linkcode CellMouseArgs} and {@linkcode CellMouseEvent} types.
   *
   * ```tsx
   * function onCellMouseDown(args: CellMouseArgs<R, SR>, event: CellMouseEvent) {
   *   if (args.column.key === 'id') {
   *     event.preventGridDefault();
   *   }
   * }
   *
   * <DataGrid rows={rows} columns={columns} onCellMouseDown={onCellMouseDown} />;
   * ```
   */
  onCellMouseDown?: CellMouseEventHandler<R, SR>;
  /**
   * Callback triggered when a cell is clicked. See the {@linkcode CellMouseArgs} and {@linkcode CellMouseEvent} types.
   *
   * This event can be used to open the cell editor on a single click:
   *
   * ```tsx
   * function onCellClick(args: CellMouseArgs<R, SR>, event: CellMouseEvent) {
   *   if (args.column.key === 'id') {
   *     args.setActivePosition(true);
   *   }
   * }
   *
   * <DataGrid rows={rows} columns={columns} onCellClick={onCellClick} />;
   * ```
   */
  onCellClick?: CellMouseEventHandler<R, SR>;
  /**
   * Callback triggered when a cell is double-clicked. The default behavior is to open the editor if the cell is editable. Call `preventGridDefault` to prevent the default behavior. See the {@linkcode CellMouseArgs} and {@linkcode CellMouseEvent} types.
   *
   * ```tsx
   * function onCellDoubleClick(args: CellMouseArgs<R, SR>, event: CellMouseEvent) {
   *   if (args.column.key === 'id') {
   *     event.preventGridDefault();
   *   }
   * }
   *
   * <DataGrid rows={rows} columns={columns} onCellDoubleClick={onCellDoubleClick} />;
   * ```
   */
  onCellDoubleClick?: CellMouseEventHandler<R, SR>;
  /**
   * Callback triggered when a cell is right-clicked. See the {@linkcode CellMouseArgs} and {@linkcode CellMouseEvent} types.
   *
   * ```tsx
   * function onCellContextMenu(args: CellMouseArgs<R, SR>, event: CellMouseEvent) {
   *   if (args.column.key === 'id') {
   *     event.preventDefault();
   *     // open custom context menu
   *   }
   * }
   *
   * <DataGrid rows={rows} columns={columns} onCellContextMenu={onCellContextMenu} />;
   * ```
   */
  onCellContextMenu?: CellMouseEventHandler<R, SR>;
  /**
   * Callback triggered when a key is pressed in a cell. This event can be used to customize cell navigation and editing behavior. See the {@linkcode CellKeyDownArgs} and {@linkcode CellKeyboardEvent} types.
   *
   * It is not called for keydown events triggered in a [`:modal`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:modal) editor, see {@linkcode Column.renderEditCell | renderEditCell}.
   *
   * **Examples**
   *
   * - Prevent editing on `Enter`
   *
   * ```tsx
   * function onCellKeyDown(args: CellKeyDownArgs<R, SR>, event: CellKeyboardEvent) {
   *   if (args.mode === 'ACTIVE' && event.key === 'Enter') {
   *     event.preventGridDefault();
   *   }
   * }
   * ```
   *
   * - Prevent navigation on `Tab`
   *
   * ```tsx
   * function onCellKeyDown(args: CellKeyDownArgs<R, SR>, event: CellKeyboardEvent) {
   *   if (args.mode === 'ACTIVE' && event.key === 'Tab') {
   *     event.preventGridDefault();
   *   }
   * }
   * ```
   *
   * See [more examples](https://github.com/Comcast/react-data-grid/blob/main/website/routes/CellNavigation.tsx).
   */
  onCellKeyDown?: Maybe<
    (args: CellKeyDownArgs<NoInfer<R>, NoInfer<SR>>, event: CellKeyboardEvent) => void
  >;
  /**
   * Callback triggered when a cell's content is copied. See the {@linkcode CellCopyArgs} type.
   */
  onCellCopy?: Maybe<
    (args: CellCopyArgs<NoInfer<R>, NoInfer<SR>>, event: CellClipboardEvent) => void
  >;
  /**
   * Callback triggered when content is pasted into a cell. See the {@linkcode CellPasteArgs} type.
   *
   * Return the updated row; the grid will call `onRowsChange` with it.
   */
  onCellPaste?: Maybe<
    (args: CellPasteArgs<NoInfer<R>, NoInfer<SR>>, event: CellClipboardEvent) => NoInfer<R>
  >;
  /**
   * Callback triggered when the active position changes. See the {@linkcode PositionChangeArgs} type.
   */
  onActivePositionChange?: Maybe<(args: PositionChangeArgs<NoInfer<R>, NoInfer<SR>>) => void>;
  /**
   * Callback triggered when a column is resized. The `column` parameter is the full {@linkcode CalculatedColumn} object, and `width` is the new width in pixels.
   */
  onColumnResize?: Maybe<(column: CalculatedColumn<R, SR>, width: number) => void>;
  /**
   * Callback triggered when columns are reordered. The parameters are the `key` values of the source and target columns.
   */
  onColumnsReorder?: Maybe<(sourceColumnKey: string, targetColumnKey: string) => void>;
  /**
   * Callback triggered when the value of the active cell is dragged to fill other cells. When this prop is set, a drag handle is shown on the active cell if it is editable. Drag the handle up or down to fill the cells it passes over, or double-click it to fill all the cells below.
   *
   * The grid calls `onFill` for each editable target cell. Return the updated target row; the grid will call `onRowsChange` with the updated rows. See the {@linkcode FillEvent} type.
   *
   * ```tsx
   * function onFill({ columnKey, sourceRow, targetRow }: FillEvent<Row>): Row {
   *   return { ...targetRow, [columnKey]: sourceRow[columnKey as keyof Row] };
   * }
   *
   * <DataGrid columns={columns} rows={rows} onRowsChange={setRows} onFill={onFill} />;
   * ```
   */
  onFill?: Maybe<(event: FillEvent<NoInfer<R>>) => NoInfer<R>>;
  /**
   * Native DOM `onScroll` prop.
   */
  onScroll?: React.UIEventHandler<HTMLDivElement> | undefined;

  /**
   * Toggles and modes
   */
  /**
   * This prop can be used to disable virtualization.
   *
   * @defaultValue `true`
   */
  enableVirtualization?: Maybe<boolean>;

  /**
   * Miscellaneous
   */
  /**
   * Custom renderers for cells, rows, and other components.
   *
   * See the {@linkcode Renderers} type for the full shape.
   *
   * Example of replacing default components:
   *
   * ```tsx
   * import { DataGrid, type Renderers } from 'react-data-grid';
   *
   * const customRenderers: Renderers<Row, SummaryRow> = {
   *   // Custom row render function
   *   renderRow(key, props) {
   *     return <CustomRow key={key} {...props} />;
   *   },
   *
   *   // Custom cell render function
   *   renderCell(key, props) {
   *     return <CustomCell key={key} {...props} />;
   *   },
   *
   *   // Custom checkbox render function
   *   renderCheckbox(props) {
   *     return <CustomCheckbox {...props} />;
   *   },
   *
   *   // Custom sort status indicator
   *   renderSortStatus(props) {
   *     return <CustomSortIcon {...props} />;
   *   },
   *
   *   // Custom empty state
   *   noRowsFallback: <div>No data available</div>
   * };
   *
   * <DataGrid columns={columns} rows={rows} renderers={customRenderers} />;
   * ```
   *
   * The default `<Row />` component can be wrapped via `renderers.renderRow` to add contexts or tweak props:
   *
   * ```tsx
   * import { DataGrid, Row, type RenderRowProps } from 'react-data-grid';
   *
   * interface MyRow {
   *   id: number;
   * }
   *
   * function myRowRenderer(key: React.Key, props: RenderRowProps<MyRow>) {
   *   return (
   *     <MyContext key={key} value={123}>
   *       <Row {...props} />
   *     </MyContext>
   *   );
   * }
   *
   * function MyGrid() {
   *   return <DataGrid columns={columns} rows={rows} renderers={{ renderRow: myRowRenderer }} />;
   * }
   * ```
   */
  renderers?: Maybe<Renderers<NoInfer<R>, NoInfer<SR>>>;
  /**
   * Function to apply custom class names to rows.
   *
   * ```tsx
   * import { DataGrid } from 'react-data-grid';
   *
   * function rowClass(row: Row, rowIdx: number) {
   *   return rowIdx % 2 === 0 ? 'even' : 'odd';
   * }
   *
   * function MyGrid() {
   *   return <DataGrid columns={columns} rows={rows} rowClass={rowClass} />;
   * }
   * ```
   *
   * ⚠️ **Performance:** Define this function outside your component or memoize it with `useCallback` to avoid re-rendering all rows on every render.
   */
  rowClass?: Maybe<(row: NoInfer<R>, rowIdx: number) => Maybe<string>>;
  /**
   * Custom class name for the header row.
   *
   * ```tsx
   * <DataGrid columns={columns} rows={rows} headerRowClass="sticky-header" />
   * ```
   */
  headerRowClass?: Maybe<string>;
  /**
   * This property sets the text direction of the grid. It defaults to `'ltr'` (left-to-right). See the {@linkcode Direction} type.
   *
   * Setting `direction` to `'rtl'` has the following effects:
   *
   * - Columns flow from right to left
   * - Start-frozen columns are pinned on the right, and end-frozen columns are pinned on the left
   * - Column resize cursor is shown on the left edge of the column
   * - Scrollbar is moved to the left
   *
   * @defaultValue `'ltr'`
   */
  direction?: Maybe<Direction>;
  /**
   * Custom class name for the grid.
   */
  className?: string | undefined;
  /**
   * Custom styles for the grid.
   */
  style?: React.CSSProperties | undefined;
  /**
   * ARIA role for the grid container. Defaults to `grid`.
   */
  role?: React.AriaRole | undefined;
  /**
   * The label of the grid. We recommend providing a label using `aria-label` or `aria-labelledby`.
   */
  'aria-label'?: string | undefined;
  /**
   * The id of the element containing a label for the grid. We recommend providing a label using `aria-label` or `aria-labelledby`.
   */
  'aria-labelledby'?: string | undefined;
  /**
   * Total number of rows for assistive technologies.
   */
  'aria-rowcount'?: number | undefined;
  /**
   * A human-readable description of the grid.
   */
  'aria-description'?: string | undefined;
  /**
   * If the grid has a caption or description, `aria-describedby` can be set on the grid element with a value referring to the element containing the description.
   */
  'aria-describedby'?: string | undefined;
  /**
   * This prop can be used to add a test ID for testing. We recommend querying the grid by its `role` and `name`.
   *
   * ```tsx
   * function MyGrid() {
   *   return <DataGrid aria-label="my-grid" columns={columns} rows={rows} />;
   * }
   *
   * test('grid', async () => {
   *   await page.render(<MyGrid />);
   *   const grid = page.getByRole('grid', { name: 'my-grid' });
   * });
   * ```
   */
  'data-testid'?: Maybe<string>;
  /**
   * Optional attribute to help with Cypress (or similar) selectors.
   */
  'data-cy'?: Maybe<string>;
}

/**
 * Main API component to render a data grid of rows and columns
 *
 * @example
 * ```tsx
 * <DataGrid columns={columns} rows={rows} />
 * ```
 *
 * @typeParam R - Row type
 * @typeParam SR - Summary row type
 * @typeParam K - Row key type
 */
export function DataGrid<R, SR = unknown, K extends Key = Key>(props: DataGridProps<R, SR, K>) {
  const {
    ref,
    // Grid and data props
    columns: rawColumns,
    rows,
    topSummaryRows,
    bottomSummaryRows,
    rowKeyGetter,
    onRowsChange,
    // Dimensions props
    rowHeight: rawRowHeight,
    headerRowHeight: rawHeaderRowHeight,
    summaryRowHeight: rawSummaryRowHeight,
    columnWidths: columnWidthsRaw,
    onColumnWidthsChange: onColumnWidthsChangeRaw,
    // Feature props
    selectedRows,
    isRowSelectionDisabled,
    onSelectedRowsChange,
    sortColumns,
    onSortColumnsChange,
    defaultColumnOptions,
    // Event props
    onCellMouseDown,
    onCellClick,
    onCellDoubleClick,
    onCellContextMenu,
    onCellKeyDown,
    onActivePositionChange,
    onScroll,
    onColumnResize,
    onColumnsReorder,
    onFill,
    onCellCopy,
    onCellPaste,
    // Toggles and modes
    enableVirtualization: rawEnableVirtualization,
    // Miscellaneous
    renderers,
    className,
    style,
    rowClass,
    headerRowClass,
    direction: rawDirection,
    // ARIA
    role: rawRole,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-description': ariaDescription,
    'aria-describedby': ariaDescribedBy,
    'aria-rowcount': rawAriaRowCount,
    'data-testid': testId,
    'data-cy': dataCy
  } = props;

  /**
   * defaults
   */
  const contextRenderers = useRenderers<R, SR>();
  const role = rawRole ?? 'grid';
  const rowHeight = rawRowHeight ?? 35;
  const headerRowHeight = rawHeaderRowHeight ?? (typeof rowHeight === 'number' ? rowHeight : 35);
  const summaryRowHeight = rawSummaryRowHeight ?? (typeof rowHeight === 'number' ? rowHeight : 35);
  const renderRow = renderers?.renderRow ?? contextRenderers?.renderRow ?? defaultRenderRow;
  const renderCell = renderers?.renderCell ?? contextRenderers?.renderCell ?? defaultRenderCell;
  const renderSortStatus =
    renderers?.renderSortStatus ?? contextRenderers?.renderSortStatus ?? defaultRenderSortStatus;
  const renderCheckbox =
    renderers?.renderCheckbox ?? contextRenderers?.renderCheckbox ?? defaultRenderCheckbox;
  const noRowsFallback = renderers?.noRowsFallback ?? contextRenderers?.noRowsFallback;
  const enableVirtualization = rawEnableVirtualization ?? true;
  const direction = rawDirection ?? 'ltr';

  /**
   * ref
   */
  const gridRef = useRef<HTMLDivElement>(null);

  /**
   * states
   */
  const { scrollTop, scrollLeft } = useScrollState(gridRef);
  const [gridWidth, gridHeight] = useGridDimensions(gridRef);
  const [columnWidthsInternal, setColumnWidthsInternal] = useState(
    (): ColumnWidths => columnWidthsRaw ?? new Map()
  );
  const [isColumnResizing, setIsColumnResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedOverRowIdx, setDraggedOverRowIdx] = useState<number | undefined>();
  const [previousRowIdx, setPreviousRowIdx] = useState(-1);

  const isColumnWidthsControlled =
    columnWidthsRaw != null && onColumnWidthsChangeRaw != null && !isColumnResizing;
  const columnWidths = isColumnWidthsControlled ? columnWidthsRaw : columnWidthsInternal;
  const onColumnWidthsChange = isColumnWidthsControlled
    ? (columnWidths: ColumnWidths) => {
        // we keep the internal state in sync with the prop but this prevents an extra render
        setColumnWidthsInternal(columnWidths);
        onColumnWidthsChangeRaw(columnWidths);
      }
    : setColumnWidthsInternal;

  const getColumnWidth = useCallback(
    (column: CalculatedColumn<R, SR>) => {
      return columnWidths.get(column.key)?.width ?? column.width;
    },
    [columnWidths]
  );

  const {
    columns,
    colSpanColumns,
    lastStartFrozenColumnIndex,
    firstEndFrozenColumnIndex,
    headerRowsCount,
    colOverscanStartIdx,
    colOverscanEndIdx,
    templateColumns,
    layoutCssVars,
    totalStartFrozenColumnWidth,
    totalEndFrozenColumnWidth
  } = useCalculatedColumns({
    rawColumns,
    defaultColumnOptions,
    getColumnWidth,
    scrollLeft,
    viewportWidth: gridWidth,
    enableVirtualization
  });

  /**
   * computed values
   */
  const isTreeGrid = role === 'treegrid';
  const topSummaryRowsCount = topSummaryRows?.length ?? 0;
  const bottomSummaryRowsCount = bottomSummaryRows?.length ?? 0;
  const summaryRowsCount = topSummaryRowsCount + bottomSummaryRowsCount;
  const headerAndTopSummaryRowsCount = headerRowsCount + topSummaryRowsCount;
  const groupedColumnHeaderRowsCount = headerRowsCount - 1;
  const minRowIdx = -headerAndTopSummaryRowsCount;
  const maxRowIdx = rows.length + bottomSummaryRowsCount - 1;
  const mainHeaderRowIdx = minRowIdx + groupedColumnHeaderRowsCount;
  const maxColIdx = columns.length - 1;
  const headerRowsHeight = headerRowsCount * headerRowHeight;
  const summaryRowsHeight = summaryRowsCount * summaryRowHeight;
  const clientHeight = gridHeight - headerRowsHeight - summaryRowsHeight;
  const isSelectable = selectedRows != null && onSelectedRowsChange != null;
  const { leftKey, rightKey } = getLeftRightKey(direction);
  const ariaRowCount = rawAriaRowCount ?? headerRowsCount + rows.length + summaryRowsCount;
  const frozenStartShadowStyles: React.CSSProperties = {
    gridColumnStart: lastStartFrozenColumnIndex + 2,
    insetInlineStart: totalStartFrozenColumnWidth
  };
  const frozenEndShadowStyles: React.CSSProperties = {
    gridColumnStart: firstEndFrozenColumnIndex + 1,
    gridColumnEnd: -1,
    insetInlineEnd: totalEndFrozenColumnWidth
  };

  const {
    activePosition,
    setActivePosition,
    setPositionToFocus,
    activePositionIsInActiveBounds,
    activePositionIsInViewport,
    activePositionIsRow,
    activePositionIsCellInViewport,
    validatePosition,
    queryActiveColumn,
    getActiveColumn,
    getActiveRow
  } = useActivePosition<R, SR>({
    gridRef,
    columns,
    rows,
    isTreeGrid,
    maxColIdx,
    minRowIdx,
    maxRowIdx,
    setDraggedOverRowIdx
  });
  const { setScrollToPosition, scrollToPositionElement } = useScrollToPosition({ gridRef });

  const defaultGridComponents = useMemo(
    (): Renderers<R, SR> => ({
      renderCheckbox,
      renderSortStatus,
      renderCell
    }),
    [renderCheckbox, renderSortStatus, renderCell]
  );

  // no rows to select = explicitly unchecked
  let hasSelectedRow = false;
  let hasUnselectedRow = false;

  // keep this loop out of `useMemo`: React Compiler memoizes it here, but not in the callback
  if (rowKeyGetter != null && selectedRows != null && selectedRows.size > 0) {
    for (const row of rows) {
      if (selectedRows.has(rowKeyGetter(row))) {
        hasSelectedRow = true;
      } else {
        hasUnselectedRow = true;
      }

      if (hasSelectedRow && hasUnselectedRow) break;
    }
  }

  const headerSelectionValue = useMemo(
    (): HeaderRowSelectionContextValue => ({
      isRowSelected: hasSelectedRow && !hasUnselectedRow,
      isIndeterminate: hasSelectedRow && hasUnselectedRow
    }),
    [hasSelectedRow, hasUnselectedRow]
  );

  const {
    rowOverscanStartIdx,
    rowOverscanEndIdx,
    totalRowHeight,
    gridTemplateRows,
    getRowTop,
    getRowHeight,
    findRowIdx
  } = useViewportRows({
    rows,
    rowHeight,
    clientHeight,
    scrollTop,
    enableVirtualization
  });

  const { viewportColumns, mapViewportColumns, mapViewportColumnsOutsideOfViewport } =
    useViewportColumns({
      columns,
      colSpanColumns,
      colOverscanStartIdx,
      colOverscanEndIdx,
      lastStartFrozenColumnIndex,
      firstEndFrozenColumnIndex,
      rowOverscanStartIdx,
      rowOverscanEndIdx,
      rows,
      topSummaryRows,
      bottomSummaryRows
    });

  const { gridTemplateColumns, handleColumnResize } = useColumnWidths(
    columns,
    viewportColumns,
    templateColumns,
    gridRef,
    gridWidth,
    columnWidths,
    onColumnWidthsChange,
    onColumnResize,
    setIsColumnResizing
  );

  /**
   * The identity of the wrapper function is stable, so it won't break memoization
   */
  const handleColumnResizeLatest = useLatestFunc(handleColumnResize);
  const handleColumnResizeEndLatest = useLatestFunc(handleColumnResizeEnd);
  const onColumnsReorderLatest = useLatestFunc(onColumnsReorder);
  const onSortColumnsChangeLatest = useLatestFunc(onSortColumnsChange);
  const onCellMouseDownLatest = useLatestFunc(onCellMouseDown);
  const onCellClickLatest = useLatestFunc(onCellClick);
  const onCellDoubleClickLatest = useLatestFunc(onCellDoubleClick);
  const onCellContextMenuLatest = useLatestFunc(onCellContextMenu);
  const selectHeaderRowLatest = useLatestFunc(selectHeaderRow);
  const selectRowLatest = useLatestFunc(selectRow);
  const updateRowLatest = useLatestFunc(updateRow);
  const setPositionLatest = useLatestFunc(setPosition);
  const selectHeaderCellLatest = useLatestFunc(selectHeaderCell);

  /**
   * Misc hooks
   */
  useImperativeHandle(ref, (): DataGridHandle => ({
    element: gridRef.current,
    scrollToCell({ idx, rowIdx }) {
      // frozen columns are always visible — scrolling to them is a no-op
      const scrollToIdx =
        idx != null &&
        idx > lastStartFrozenColumnIndex &&
        (firstEndFrozenColumnIndex === -1 || idx < firstEndFrozenColumnIndex) &&
        idx < columns.length
          ? idx
          : undefined;
      const scrollToRowIdx =
        rowIdx != null && validatePosition({ idx: 0, rowIdx }).isPositionInViewport
          ? rowIdx + headerAndTopSummaryRowsCount
          : undefined;

      if (scrollToIdx != null || scrollToRowIdx != null) {
        setScrollToPosition({ idx: scrollToIdx, rowIdx: scrollToRowIdx });
      }
    },
    setActivePosition: setPositionLatest
  }));

  /**
   * event handlers
   */
  function selectHeaderRow(args: SelectHeaderRowEvent) {
    if (!onSelectedRowsChange) return;

    assertIsValidKeyGetter<R, K>(rowKeyGetter);

    const newSelectedRows = new Set(selectedRows);
    for (const row of rows) {
      if (isRowSelectionDisabled?.(row) === true) continue;
      const rowKey = rowKeyGetter(row);
      if (args.checked) {
        newSelectedRows.add(rowKey);
      } else {
        newSelectedRows.delete(rowKey);
      }
    }
    onSelectedRowsChange(newSelectedRows);
  }

  function selectRow(args: SelectRowEvent<R>) {
    if (!onSelectedRowsChange) return;

    assertIsValidKeyGetter<R, K>(rowKeyGetter);
    const { row, checked, isShiftClick } = args;
    if (isRowSelectionDisabled?.(row) === true) return;
    const newSelectedRows = new Set(selectedRows);
    const rowKey = rowKeyGetter(row);
    const rowIdx = rows.indexOf(row);
    setPreviousRowIdx(rowIdx);

    if (checked) {
      newSelectedRows.add(rowKey);
    } else {
      newSelectedRows.delete(rowKey);
    }

    if (
      isShiftClick &&
      previousRowIdx !== -1 &&
      previousRowIdx !== rowIdx &&
      previousRowIdx < rows.length
    ) {
      const [min, max] =
        previousRowIdx < rowIdx ? [previousRowIdx, rowIdx] : [rowIdx, previousRowIdx];

      for (let i = min + 1; i < max; i++) {
        const row = rows[i];
        if (isRowSelectionDisabled?.(row) === true) continue;
        if (checked) {
          newSelectedRows.add(rowKeyGetter(row));
        } else {
          newSelectedRows.delete(rowKeyGetter(row));
        }
      }
    }

    onSelectedRowsChange(newSelectedRows);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const { idx, rowIdx, mode } = activePosition;
    if (mode === 'EDIT') return;

    if (onCellKeyDown && activePositionIsInViewport) {
      const cellEvent = createCellEvent(event);
      onCellKeyDown(
        {
          mode: 'ACTIVE',
          row: rows[rowIdx],
          column: columns[idx],
          rowIdx,
          setActivePosition: setPosition
        },
        cellEvent
      );
      if (cellEvent.isGridDefaultPrevented()) return;
    }

    const { target } = event;

    if (!isElement(target)) return;

    const cell = target.closest('.rdg-cell');
    const isCellEvent = cell !== null;
    const isRowEvent = isTreeGrid && target.role === 'row';

    if (!isCellEvent && !isRowEvent) return;

    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'Tab':
      case 'Home':
      case 'End':
      case 'PageUp':
      case 'PageDown':
        navigate(event);
        break;
      default:
        handleCellInput(event, cell);
        break;
    }
  }

  function updateRow(column: CalculatedColumn<R, SR>, rowIdx: number, row: R) {
    if (typeof onRowsChange !== 'function') return;
    if (row === rows[rowIdx]) return;
    const updatedRows = rows.with(rowIdx, row);
    onRowsChange(updatedRows, {
      indexes: [rowIdx],
      column
    });
  }

  function commitEditorChanges() {
    if (activePosition.mode !== 'EDIT') return;
    updateRow(getActiveColumn(), activePosition.rowIdx, activePosition.row);
  }

  function handleCellCopy(event: CellClipboardEvent) {
    if (!activePositionIsCellInViewport) return;
    onCellCopy?.({ row: getActiveRow(), column: getActiveColumn() }, event);
  }

  function handleCellPaste(event: CellClipboardEvent) {
    if (
      typeof onCellPaste !== 'function' ||
      typeof onRowsChange !== 'function' ||
      !isCellEditable(activePosition)
    ) {
      return;
    }

    const column = getActiveColumn();
    const row = getActiveRow();
    const updatedRow = onCellPaste({ row, column }, event);
    updateRow(column, activePosition.rowIdx, updatedRow);
  }

  function handleCellInput(event: KeyboardEvent<HTMLDivElement>, cell: Element | null) {
    if (!activePositionIsCellInViewport) return;
    const row = getActiveRow();
    const { key, shiftKey } = event;

    // Select the row on Shift + Space
    if (isSelectable && shiftKey && key === ' ') {
      assertIsValidKeyGetter<R, K>(rowKeyGetter);
      const rowKey = rowKeyGetter(row);
      selectRow({ row, checked: !selectedRows.has(rowKey), isShiftClick: false });
      // prevent scrolling
      event.preventDefault();
      return;
    }

    if (isCellEditable(activePosition) && isDefaultCellInput(event, onCellPaste != null)) {
      // ensure cell is fully visible
      scrollIntoView(cell);

      // ensure we render the editor quickly enough,
      // otherwise the user input might be lost in Firefox
      flushSync(() => {
        setActivePosition(({ idx, rowIdx }) => ({
          idx,
          rowIdx,
          mode: 'EDIT',
          row,
          originalRow: row
        }));
      });
    }
  }

  function handleColumnResizeEnd() {
    // This check is needed as double-clicking the resize handle triggers onLostPointerCapture without resizing the column
    if (isColumnResizing) {
      onColumnWidthsChangeRaw?.(columnWidths);
      setIsColumnResizing(false);
    }
  }

  function handleDragHandlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    // keep the focus on the cell
    event.preventDefault();
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleDragHandlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    // find the dragged-over row using the pointer position
    const gridEl = gridRef.current!;
    const headerAndTopSummaryRowsHeight = headerRowsHeight + topSummaryRowsCount * summaryRowHeight;
    const offset =
      scrollTop -
      headerAndTopSummaryRowsHeight +
      event.clientY -
      gridEl.getBoundingClientRect().top;
    const overRowIdx = findRowIdx(offset);
    setDraggedOverRowIdx(overRowIdx);
    const ariaRowIndex = headerAndTopSummaryRowsCount + overRowIdx + 1;
    const el = gridEl.querySelector(
      `& > [aria-rowindex="${ariaRowIndex}"] > [aria-colindex="${activePosition.idx + 1}"]`
    );
    scrollIntoView(el);
  }

  function handleDragHandleLostPointerCapture() {
    setIsDragging(false);
    if (draggedOverRowIdx === undefined) return;

    const { rowIdx } = activePosition;
    const [startRowIndex, endRowIndex] =
      rowIdx < draggedOverRowIdx
        ? [rowIdx + 1, draggedOverRowIdx + 1]
        : [draggedOverRowIdx, rowIdx];
    updateRows(startRowIndex, endRowIndex);
    setDraggedOverRowIdx(undefined);
  }

  function handleDragHandleClick() {
    // keep the focus on the cell but do not scroll
    focusCell(gridRef.current!, false);
  }

  function handleDragHandleDoubleClick(event: React.MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
    updateRows(activePosition.rowIdx + 1, rows.length);
  }

  function updateRows(startRowIdx: number, endRowIdx: number) {
    if (onRowsChange == null) return;

    const { idx } = activePosition;
    const column = getActiveColumn();
    const sourceRow = getActiveRow();
    const updatedRows = [...rows];
    const indexes: number[] = [];
    for (let i = startRowIdx; i < endRowIdx; i++) {
      if (isCellEditable({ idx, rowIdx: i })) {
        const updatedRow = onFill!({ columnKey: column.key, sourceRow, targetRow: rows[i] });
        if (updatedRow !== rows[i]) {
          updatedRows[i] = updatedRow;
          indexes.push(i);
        }
      }
    }

    if (indexes.length > 0) {
      onRowsChange(updatedRows, { indexes, column });
    }
  }

  function isCellEditable(position: Position): boolean {
    return (
      validatePosition(position).isCellInViewport &&
      isCellEditableUtil(columns[position.idx], rows[position.rowIdx])
    );
  }

  function setPosition(position: Position, options?: SetActivePositionOptions): void {
    const { isPositionInActiveBounds } = validatePosition(position);
    if (!isPositionInActiveBounds) return;
    commitEditorChanges();

    // Copy the coordinates instead of spreading `position`,
    // so the shape of the active position doesn't depend on the object passed in
    const { idx, rowIdx } = position;
    const samePosition = isSamePosition(activePosition, position);

    if (options?.enableEditor && isCellEditable(position)) {
      // avoid selecting text in the editor, for example
      // after double-clicking and displayCellContent is enabled
      gridRef.current?.ownerDocument.getSelection()?.removeAllRanges();

      const row = rows[rowIdx];
      setActivePosition({ idx, rowIdx, mode: 'EDIT', row, originalRow: row });
    } else if (samePosition) {
      // Avoid re-renders if the active position is the same
      scrollIntoView(getCellToScroll(gridRef.current!));
    } else {
      const newPosition: ActivePosition = { idx, rowIdx, mode: 'ACTIVE' };
      setActivePosition(newPosition);
      if (options?.shouldFocus) {
        setPositionToFocus(newPosition);
      }
    }

    if (onActivePositionChange && !samePosition) {
      onActivePositionChange({
        rowIdx,
        row: rows[rowIdx],
        column: columns[idx]
      });
    }
  }

  function selectHeaderCell({ idx, rowIdx }: Position): void {
    setPosition({ idx, rowIdx: minRowIdx + rowIdx - 1 });
  }

  function getNextPosition(key: string, ctrlKey: boolean, shiftKey: boolean): Position {
    const { idx, rowIdx } = activePosition;

    switch (key) {
      case 'ArrowUp': {
        const nextRowIdx = rowIdx - 1;
        return {
          // avoid focusing header rows
          idx: idx === -1 && nextRowIdx < -topSummaryRowsCount ? 0 : idx,
          rowIdx: nextRowIdx
        };
      }
      case 'ArrowDown':
        return { idx, rowIdx: rowIdx + 1 };
      case leftKey: {
        const nextIdx = idx - 1;
        return {
          // avoid focusing header rows
          idx: rowIdx < -topSummaryRowsCount && nextIdx < 0 ? 0 : nextIdx,
          rowIdx
        };
      }
      case rightKey:
        return { idx: idx + 1, rowIdx };
      case 'Tab':
        return { idx: idx + (shiftKey ? -1 : 1), rowIdx };
      case 'Home':
        // If the active position is a row, move focus to the first header row's cell.
        if (activePositionIsRow || ctrlKey) return { idx: 0, rowIdx: minRowIdx };
        return { idx: 0, rowIdx };
      case 'End':
        // If the active position is a row, move focus to the last row.
        if (activePositionIsRow) return { idx, rowIdx: maxRowIdx };
        return { idx: maxColIdx, rowIdx: ctrlKey ? maxRowIdx : rowIdx };
      case 'PageUp': {
        // Header and top summary rows are above the rows, so there's nothing to page up to.
        if (rowIdx < 0) return activePosition;
        const nextRowY = getRowTop(rowIdx) + getRowHeight(rowIdx) - clientHeight;
        return { idx, rowIdx: nextRowY > 0 ? findRowIdx(nextRowY) : 0 };
      }
      case 'PageDown': {
        if (rowIdx >= rows.length) return activePosition;
        const nextRowY = getRowTop(rowIdx) + clientHeight;
        return { idx, rowIdx: nextRowY < totalRowHeight ? findRowIdx(nextRowY) : rows.length - 1 };
      }
      default:
        return activePosition;
    }
  }

  function navigate(event: KeyboardEvent<HTMLDivElement>) {
    const { key, shiftKey } = event;
    let cellNavigationMode: CellNavigationMode = 'NONE';
    if (key === 'Tab') {
      if (
        canExitGrid({
          shiftKey,
          maxColIdx,
          minRowIdx,
          maxRowIdx,
          activePosition
        })
      ) {
        commitEditorChanges();
        // Allow focus to leave the grid so the next control in the tab order can be focused
        return;
      }

      cellNavigationMode = 'CHANGE_ROW';
    }

    // prevent scrolling and do not allow focus to leave
    event.preventDefault();

    const ctrlKey = isCtrlKeyHeldDown(event);
    const nextPosition = getNextPosition(key, ctrlKey, shiftKey);
    if (isSamePosition(activePosition, nextPosition)) return;

    const nextActivePosition = getNextActivePosition({
      moveUp: key === 'ArrowUp',
      moveNext: key === rightKey || (key === 'Tab' && !shiftKey),
      columns,
      colSpanColumns,
      rows,
      topSummaryRows,
      bottomSummaryRows,
      minRowIdx,
      mainHeaderRowIdx,
      maxRowIdx,
      cellNavigationMode,
      activePosition,
      nextPosition,
      nextPositionIsCellInActiveBounds: validatePosition(nextPosition).isCellInActiveBounds
    });

    setPosition(nextActivePosition, { shouldFocus: true });
  }

  function getDraggedOverCellIdx(currentRowIdx: number): number | undefined {
    if (draggedOverRowIdx === undefined) return;
    const { rowIdx } = activePosition;

    const isDraggedOver =
      rowIdx < draggedOverRowIdx
        ? rowIdx < currentRowIdx && currentRowIdx <= draggedOverRowIdx
        : rowIdx > currentRowIdx && currentRowIdx >= draggedOverRowIdx;

    return isDraggedOver ? activePosition.idx : undefined;
  }

  function getDragHandle() {
    if (onFill == null || activePosition.mode !== 'ACTIVE' || !activePositionIsCellInViewport) {
      return;
    }

    const { rowIdx } = activePosition;
    const column = getActiveColumn();
    if (column.renderEditCell == null || column.editable === false) {
      return;
    }

    const isLastRow = rowIdx === maxRowIdx;
    const colSpan = column.getColSpan({
      type: 'ROW',
      row: getActiveRow()
    });
    const style = getCellStyle(column, colSpan);
    // the drag handle is at the end of the last column that the cell spans,
    // where it sticks when the column is start-frozen
    const lastColumn = columns[column.idx + colSpan - 1];
    const columnWidth = getColumnWidth(lastColumn);
    const { insetInlineStart } = getCellStyle(lastColumn, 1);
    const marginEnd = 'calc(var(--rdg-drag-handle-size) * -0.5 + 1px)';
    const isLastColumn = lastColumn.idx === maxColIdx;
    const dragHandleStyle: React.CSSProperties = {
      ...style,
      gridRowStart: headerAndTopSummaryRowsCount + rowIdx + 1,
      marginInlineEnd: isLastColumn ? undefined : marginEnd,
      marginBlockEnd: isLastRow ? undefined : marginEnd,
      insetInlineStart: insetInlineStart
        ? `calc(${insetInlineStart} + ${columnWidth}px + var(--rdg-drag-handle-size) * -0.5 - 1px)`
        : undefined
    };

    return (
      <div
        style={dragHandleStyle}
        className={classnames(
          cellDragHandleClassname,
          column.frozen && cellDragHandleFrozenClassname
        )}
        onPointerDown={handleDragHandlePointerDown}
        onPointerMove={isDragging ? handleDragHandlePointerMove : undefined}
        onLostPointerCapture={isDragging ? handleDragHandleLostPointerCapture : undefined}
        onClick={handleDragHandleClick}
        onDoubleClick={handleDragHandleDoubleClick}
      />
    );
  }

  function renderFrozenShadow(
    shadowStyles: React.CSSProperties,
    bodyClassname: string,
    topClassname: string
  ) {
    return (
      <>
        <div
          className={topClassname}
          style={{
            ...shadowStyles,
            gridRowStart: 1,
            gridRowEnd: headerRowsCount + 1 + topSummaryRowsCount,
            insetBlockStart: 0
          }}
        />

        {rows.length > 0 && (
          <div
            className={bodyClassname}
            style={{
              ...shadowStyles,
              gridRowStart: headerAndTopSummaryRowsCount + rowOverscanStartIdx + 1,
              gridRowEnd: headerAndTopSummaryRowsCount + rowOverscanEndIdx + 2
            }}
          />
        )}

        {bottomSummaryRowsCount > 0 && (
          <div
            className={topClassname}
            style={{
              ...shadowStyles,
              gridRowStart: headerAndTopSummaryRowsCount + rows.length + 1,
              gridRowEnd: headerAndTopSummaryRowsCount + rows.length + 1 + bottomSummaryRowsCount,
              insetBlockStart:
                clientHeight > totalRowHeight
                  ? gridHeight - summaryRowHeight * bottomSummaryRowsCount
                  : undefined,
              insetBlockEnd: clientHeight > totalRowHeight ? undefined : 0
            }}
          />
        )}
      </>
    );
  }

  function getCellEditor(rowIdx: number) {
    if (
      !activePositionIsCellInViewport ||
      activePosition.rowIdx !== rowIdx ||
      activePosition.mode !== 'EDIT'
    ) {
      return;
    }

    const { row } = activePosition;
    const column = getActiveColumn();

    function closeEditor(shouldFocus: boolean) {
      const newPosition: ActivePosition = { idx: activePosition.idx, rowIdx, mode: 'ACTIVE' };
      setActivePosition(newPosition);
      if (shouldFocus) {
        setPositionToFocus(newPosition);
      }
    }

    function onRowChange(row: R, commitChanges: boolean, shouldFocus: boolean) {
      if (commitChanges) {
        // Prevents an issue when the editor is closed by clicking on a different cell:
        // otherwise, commitEditorChanges may be called before the cell state is changed to
        // ACTIVE, which results in onRowChange getting called twice.
        flushSync(() => {
          updateRow(column, activePosition.rowIdx, row);
          closeEditor(shouldFocus);
        });
      } else {
        setActivePosition((position) => ({ ...position, row }));
      }
    }

    return (
      <EditCell
        key={column.key}
        column={column}
        row={row}
        rowIdx={rowIdx}
        onRowChange={onRowChange}
        closeEditor={closeEditor}
        onKeyDown={onCellKeyDown}
        navigate={navigate}
      />
    );
  }

  function getViewportRows() {
    const activeRowIdx = activePosition.rowIdx;
    const viewportRows: React.ReactNode[] = [];

    if (activePositionIsInViewport && activeRowIdx < rowOverscanStartIdx) {
      viewportRows.push(renderViewportRow(activeRowIdx));
    }
    for (let rowIdx = rowOverscanStartIdx; rowIdx <= rowOverscanEndIdx; rowIdx++) {
      viewportRows.push(renderViewportRow(rowIdx));
    }
    if (activePositionIsInViewport && activeRowIdx > rowOverscanEndIdx) {
      viewportRows.push(renderViewportRow(activeRowIdx));
    }

    return viewportRows;
  }

  function renderViewportRow(rowIdx: number) {
    const { idx: activeIdx, rowIdx: activeRowIdx } = activePosition;
    const isActiveRow = rowIdx === activeRowIdx;

    // if the row is outside the viewport then only render its active column, if any
    const mapColumns =
      isActiveRow && (rowIdx < rowOverscanStartIdx || rowIdx > rowOverscanEndIdx)
        ? mapViewportColumnsOutsideOfViewport
        : mapViewportColumns;

    const row = rows[rowIdx];
    const gridRowStart = headerAndTopSummaryRowsCount + rowIdx + 1;
    let key: K | number = rowIdx;
    let isRowSelected = false;
    if (typeof rowKeyGetter === 'function') {
      key = rowKeyGetter(row);
      isRowSelected = selectedRows?.has(key) ?? false;
    }

    return renderRow(key, {
      // aria-rowindex is 1-based
      'aria-rowindex': headerAndTopSummaryRowsCount + rowIdx + 1,
      'aria-selected': isSelectable ? isRowSelected : undefined,
      rowIdx,
      row,
      mapViewportColumns: mapColumns,
      isRowSelectionDisabled: isRowSelectionDisabled?.(row) ?? false,
      isRowSelected,
      onCellMouseDown: onCellMouseDownLatest,
      onCellClick: onCellClickLatest,
      onCellDoubleClick: onCellDoubleClickLatest,
      onCellContextMenu: onCellContextMenuLatest,
      rowClass,
      gridRowStart,
      activeCellIdx: isActiveRow ? activeIdx : undefined,
      draggedOverCellIdx: getDraggedOverCellIdx(rowIdx),
      onRowChange: updateRowLatest,
      setActivePosition: setPositionLatest,
      activeCellEditor: getCellEditor(rowIdx),
      isTreeGrid
    });
  }

  // Keep the state and prop in sync
  if (isColumnWidthsControlled && columnWidthsInternal !== columnWidthsRaw) {
    setColumnWidthsInternal(columnWidthsRaw);
  }

  let templateRows = `repeat(${headerRowsCount}, ${headerRowHeight}px)`;
  if (topSummaryRowsCount > 0) {
    templateRows += ` repeat(${topSummaryRowsCount}, ${summaryRowHeight}px)`;
  }
  if (rows.length > 0) {
    templateRows += gridTemplateRows;
  }
  if (bottomSummaryRowsCount > 0) {
    templateRows += ` repeat(${bottomSummaryRowsCount}, ${summaryRowHeight}px)`;
  }

  // Frozen cells, header rows, and summary rows are sticky, so they are already visible on their sticky axis.
  // A sticky cell inside the scroll padding would be scrolled out of it when it's focused or scrolled into view,
  // so the padding only applies when the active cell is a non-sticky cell on that axis, or when scrolling to a position.
  const isScrollingToPosition = scrollToPositionElement !== null;
  const hasInlineScrollPadding = isScrollingToPosition || queryActiveColumn()?.frozen === false;
  const hasBlockScrollPadding = isScrollingToPosition || activePositionIsInViewport;

  return (
    <div
      ref={gridRef}
      role={role}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-description={ariaDescription}
      aria-describedby={ariaDescribedBy}
      aria-multiselectable={isSelectable ? true : undefined}
      aria-colcount={columns.length}
      aria-rowcount={ariaRowCount}
      // Scrollable containers without tabIndex are keyboard focusable in Chrome only if there is no focusable element inside,
      // whereas they are always focusable in Firefox. We need to set tabIndex to have consistent behavior across browsers.
      tabIndex={-1}
      className={classnames(rootClassname, isDragging && viewportDraggingClassname, className)}
      style={{
        ...style,
        // set scrollPadding to correctly scroll to non-sticky cells/rows
        scrollPaddingInlineStart: hasInlineScrollPadding ? totalStartFrozenColumnWidth : undefined,
        scrollPaddingInlineEnd: hasInlineScrollPadding ? totalEndFrozenColumnWidth : undefined,
        scrollPaddingBlockStart: hasBlockScrollPadding
          ? headerRowsHeight + topSummaryRowsCount * summaryRowHeight
          : undefined,
        scrollPaddingBlockEnd: hasBlockScrollPadding
          ? bottomSummaryRowsCount * summaryRowHeight
          : undefined,
        gridTemplateColumns,
        gridTemplateRows: templateRows,
        '--rdg-header-row-height': `${headerRowHeight}px`,
        ...layoutCssVars
      }}
      dir={direction}
      onScroll={onScroll}
      onKeyDown={handleKeyDown}
      onCopy={handleCellCopy}
      onPaste={handleCellPaste}
      data-testid={testId}
      data-cy={dataCy}
    >
      <DataGridRenderersContext value={defaultGridComponents}>
        <HeaderRowSelectionChangeContext value={selectHeaderRowLatest}>
          <HeaderRowSelectionContext value={headerSelectionValue}>
            {Array.from({ length: groupedColumnHeaderRowsCount }, (_, index) => (
              <GroupedColumnHeaderRow
                key={index}
                rowIdx={index + 1}
                level={-groupedColumnHeaderRowsCount + index}
                mapViewportColumns={mapViewportColumns}
                activeCellIdx={
                  activePosition.rowIdx === minRowIdx + index ? activePosition.idx : undefined
                }
                setPosition={selectHeaderCellLatest}
              />
            ))}
            <HeaderRow
              headerRowClass={headerRowClass}
              rowIdx={headerRowsCount}
              mapViewportColumns={mapViewportColumns}
              onColumnResize={handleColumnResizeLatest}
              onColumnResizeEnd={handleColumnResizeEndLatest}
              onColumnsReorder={onColumnsReorderLatest}
              sortColumns={sortColumns}
              onSortColumnsChange={onSortColumnsChangeLatest}
              activeCellIdx={
                activePosition.rowIdx === mainHeaderRowIdx ? activePosition.idx : undefined
              }
              setPosition={selectHeaderCellLatest}
              shouldFocusGrid={!activePositionIsInActiveBounds}
              direction={direction}
            />
          </HeaderRowSelectionContext>
        </HeaderRowSelectionChangeContext>
        {rows.length === 0 && noRowsFallback ? (
          noRowsFallback
        ) : (
          <>
            {topSummaryRows?.map((row, rowIdx) => {
              const gridRowStart = headerRowsCount + 1 + rowIdx;
              const summaryRowIdx = mainHeaderRowIdx + 1 + rowIdx;
              const isSummaryRowActive = activePosition.rowIdx === summaryRowIdx;
              const top = headerRowsHeight + summaryRowHeight * rowIdx;

              return (
                <SummaryRow
                  key={rowIdx}
                  aria-rowindex={gridRowStart}
                  rowIdx={summaryRowIdx}
                  gridRowStart={gridRowStart}
                  row={row}
                  top={top}
                  bottom={undefined}
                  mapViewportColumns={mapViewportColumns}
                  activeCellIdx={isSummaryRowActive ? activePosition.idx : undefined}
                  isTop
                  setActivePosition={setPositionLatest}
                  isTreeGrid={isTreeGrid}
                />
              );
            })}
            <RowSelectionChangeContext value={selectRowLatest}>
              {getViewportRows()}
            </RowSelectionChangeContext>
            {bottomSummaryRows?.map((row, rowIdx) => {
              const gridRowStart = headerAndTopSummaryRowsCount + rows.length + rowIdx + 1;
              const summaryRowIdx = rows.length + rowIdx;
              const isSummaryRowActive = activePosition.rowIdx === summaryRowIdx;
              const top =
                clientHeight > totalRowHeight
                  ? gridHeight - summaryRowHeight * (bottomSummaryRowsCount - rowIdx)
                  : undefined;
              const bottom =
                top === undefined
                  ? summaryRowHeight * (bottomSummaryRowsCount - 1 - rowIdx)
                  : undefined;

              return (
                <SummaryRow
                  aria-rowindex={ariaRowCount - bottomSummaryRowsCount + rowIdx + 1}
                  key={rowIdx}
                  rowIdx={summaryRowIdx}
                  gridRowStart={gridRowStart}
                  row={row}
                  top={top}
                  bottom={bottom}
                  mapViewportColumns={mapViewportColumns}
                  activeCellIdx={isSummaryRowActive ? activePosition.idx : undefined}
                  isTop={false}
                  setActivePosition={setPositionLatest}
                  isTreeGrid={isTreeGrid}
                />
              );
            })}
          </>
        )}
      </DataGridRenderersContext>

      {lastStartFrozenColumnIndex > -1 &&
        renderFrozenShadow(
          frozenStartShadowStyles,
          frozenColumnShadowStartClassname,
          frozenColumnShadowStartTopClassname
        )}

      {firstEndFrozenColumnIndex > -1 &&
        renderFrozenShadow(
          frozenEndShadowStyles,
          frozenColumnShadowEndClassname,
          frozenColumnShadowEndTopClassname
        )}

      {getDragHandle()}

      {/* render empty cells that span only 1 column so we can safely measure column widths, regardless of colSpan */}
      {renderMeasuringCells(viewportColumns)}

      {scrollToPositionElement}
    </div>
  );
}

function isSamePosition(p1: Position, p2: Position) {
  return p1.idx === p2.idx && p1.rowIdx === p2.rowIdx;
}
