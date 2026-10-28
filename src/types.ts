import type { Key, ReactElement, ReactNode } from 'react';

import type { DataGridProps } from './DataGrid';

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
 * Utility type for optional values. This helper type is not exported; the shape is shown for reference.
 */
export type Maybe<T> = T | undefined | null;

export type StateSetter<S> = React.Dispatch<React.SetStateAction<S>>;

/**
 * Defines the configuration for a column in the grid.
 *
 * @see {@linkcode DataGridProps.columns | columns} prop on `<DataGrid />`
 */
export interface Column<R, SR = unknown> {
  /** The name of the column. Displayed in the header cell by default. */
  readonly name: string | ReactElement;
  /** A unique key to distinguish each column. */
  readonly key: string;
  /**
   * Width can be any valid CSS grid column value. If not specified, it will be determined automatically based on grid width and specified widths of other columns.
   *
   * ```tsx
   * const columns: Column<Row>[] = [
   *   {
   *     key: 'id',
   *     name: 'ID',
   *     width: 80, // Fixed width in pixels
   *     resizable: false
   *   },
   *   {
   *     key: 'name',
   *     name: 'Name',
   *     width: '30%', // Percentage width
   *     minWidth: 100,
   *     maxWidth: 400
   *   },
   *   {
   *     key: 'description',
   *     name: 'Description'
   *     // No width specified - automatically sized
   *   }
   * ];
   * ```
   *
   * Other examples:
   *
   * ```tsx
   * width: 80, // pixels
   * width: '25%',
   * width: 'max-content',
   * width: 'minmax(100px, max-content)',
   * ```
   *
   * `max-content` can be used to expand the column to show all the content. Note that the grid is only able to calculate column width for visible rows.
   *
   * @defaultValue `auto`
   */
  readonly width?: Maybe<number | string>;
  /**
   * Minimum column width in pixels.
   *
   * @defaultValue `50` pixels
   */
  readonly minWidth?: Maybe<number>;
  /** Maximum column width in pixels. */
  readonly maxWidth?: Maybe<number>;
  /**
   * Class name(s) for cells. Can be a string or a function that returns a class name based on the row.
   *
   * ```tsx
   * const columns: Column<Row>[] = [
   *   {
   *     key: 'status',
   *     name: 'Status',
   *     cellClass: (row) => `status-${row.status}`
   *   },
   *   {
   *     key: 'price',
   *     name: 'Price',
   *     cellClass: 'text-right' // Static class
   *   }
   * ];
   * ```
   *
   * ```css
   * .status-active {
   *   color: green;
   *   font-weight: bold;
   * }
   *
   * .status-inactive {
   *   color: gray;
   * }
   *
   * .text-right {
   *   text-align: right;
   * }
   * ```
   */
  readonly cellClass?: Maybe<string | ((row: R) => Maybe<string>)>;
  /** Class name(s) for the header cell. */
  readonly headerCellClass?: Maybe<string>;
  /** Class name(s) for summary cells. Can be a string or a function that returns a class name based on the summary row. */
  readonly summaryCellClass?: Maybe<string | ((row: SR) => Maybe<string>)>;
  /** Render function to render the content of cells. */
  readonly renderCell?: Maybe<(props: RenderCellContentProps<R, SR>) => ReactNode>;
  /** Render function to render the content of the header cell. */
  readonly renderHeaderCell?: Maybe<(props: RenderHeaderCellContentProps<R, SR>) => ReactNode>;
  /** Render function to render the content of summary cells. */
  readonly renderSummaryCell?: Maybe<(props: RenderSummaryCellContentProps<SR, R>) => ReactNode>;
  /** Render function to render the content of group cells when using `TreeDataGrid`. */
  readonly renderGroupCell?: Maybe<(props: RenderGroupCellContentProps<R, SR>) => ReactNode>;
  /**
   * Render function to render the content of edit cells. When set, the column is automatically set to be editable.
   *
   * Editors can render a [`:modal`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:modal) element, like a `<dialog>` opened with `showModal()`, either in the cell or in a portal. Keydown events triggered in the modal are left to the editor: `onCellKeyDown` is not called, and the grid does not close the editor on `Escape`/`Enter` or navigate on `Tab`, so the editor must call `onClose` itself, for example in the dialog's `onClose` handler.
   */
  readonly renderEditCell?: Maybe<(props: RenderEditCellContentProps<R, SR>) => ReactNode>;
  /** Control whether cells can be edited with `renderEditCell`. */
  readonly editable?: Maybe<boolean | ((row: R) => boolean)>;
  /**
   * Function to determine how many columns this cell should span. Returns the number of columns to span, or `undefined` for no spanning. The span is clamped to the start-frozen, unfrozen, or end-frozen columns, whichever the column is part of. See the {@linkcode ColSpanArgs} type.
   *
   * @example
   * ```tsx
   * import type { Column } from 'react-data-grid';
   *
   * const columns: readonly Column<Row>[] = [
   *   {
   *     key: 'title',
   *     name: 'Title',
   *     colSpan(args) {
   *       if (args.type === 'ROW' && args.row.isFullWidth) {
   *         return 5; // Span 5 columns for full-width rows
   *       }
   *       return undefined;
   *     }
   *   }
   * ];
   * ```
   */
  readonly colSpan?: Maybe<(args: ColSpanArgs<R, SR>) => Maybe<number>>;
  /**
   * Determines whether the column is frozen, and on which edge. Frozen columns stay in place when the grid is scrolled horizontally. See the {@linkcode ColumnFrozen} type.
   *
   * - `'start'` (or `true` for backward compatibility) — pins the column to the start edge (left in LTR, right in RTL).
   * - `'end'` — pins the column to the end edge (right in LTR, left in RTL).
   * - `false` (default) — the column scrolls with the rest of the grid.
   *
   * ```tsx
   * const columns: readonly Column<Row>[] = [
   *   { key: 'id', name: 'ID', frozen: 'start' },
   *   { key: 'name', name: 'Name' },
   *   { key: 'actions', name: 'Actions', frozen: 'end' }
   * ];
   * ```
   *
   * @defaultValue `false`
   */
  readonly frozen?: Maybe<ColumnFrozen | true>;
  /**
   * Enable resizing of the column.
   *
   * @defaultValue `false`
   */
  readonly resizable?: Maybe<boolean>;
  /**
   * Enable sorting of the column.
   *
   * @defaultValue `false`
   */
  readonly sortable?: Maybe<boolean>;
  /**
   * Enable dragging of the column.
   *
   * @defaultValue `false`
   */
  readonly draggable?: Maybe<boolean>;
  /**
   * Sets the column sort order to be descending instead of ascending the first time the column is sorted.
   *
   * @defaultValue `false`
   */
  readonly sortDescendingFirst?: Maybe<boolean>;
  /** Options for cell editing. */
  readonly editorOptions?: Maybe<{
    /**
     * Render the cell content in addition to the edit cell content. Enable this option when the editor is rendered outside the grid, like a modal for example.
     * By default, the cell content is not rendered when the edit cell is open.
     *
     * @defaultValue `false`
     */
    readonly displayCellContent?: Maybe<boolean>;
    /**
     * Commit changes when clicking outside the cell.
     *
     * @defaultValue `true`
     */
    readonly commitOnOutsideClick?: Maybe<boolean>;
    /**
     * Close the editor when the row value changes externally.
     *
     * @defaultValue `true`
     */
    readonly closeOnExternalRowChange?: Maybe<boolean>;
  }>;
}

/**
 * Extends `Column` with additional computed properties used internally by the grid. This is the type passed to render functions. Every `Column` property is set: the ones with a default value, like `width` and `renderCell`, are resolved to their default value when not set, and the others are `undefined` when not set.
 *
 * @see {@linkcode Column}, {@linkcode DataGridProps.onColumnResize | onColumnResize} prop on `<DataGrid />`
 */
export interface CalculatedColumn<R, SR = unknown> extends Column<R, SR> {
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
  // Always set, `undefined` when not set on the column
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

/**
 * Defines a group of columns that share a common header.
 *
 * @example
 * ```tsx
 * import type { ColumnOrColumnGroup } from 'react-data-grid';
 *
 * const columns: readonly ColumnOrColumnGroup<Row>[] = [
 *   {
 *     name: 'Personal Info',
 *     children: [
 *       { key: 'firstName', name: 'First Name' },
 *       { key: 'lastName', name: 'Last Name' }
 *     ]
 *   }
 * ];
 * ```
 *
 * @see {@linkcode ColumnOrColumnGroup}
 */
export interface ColumnGroup<R, SR = unknown> {
  /** The name of the column group. It will be displayed in the header cell */
  readonly name: string | ReactElement;
  readonly headerCellClass?: Maybe<string>;
  readonly children: readonly ColumnOrColumnGroup<R, SR>[];
}

/**
 * Represents a parent column group in the calculated column structure.
 *
 * @see {@linkcode CalculatedColumn}
 */
export interface CalculatedColumnParent<R, SR> {
  readonly name: string | ReactElement;
  readonly parent: CalculatedColumnParent<R, SR> | undefined;
  readonly idx: number;
  readonly colSpan: number;
  readonly level: number;
  readonly headerCellClass?: Maybe<string>;
}

/**
 * Union type representing either a `Column` or a `ColumnGroup`.
 *
 * @see {@linkcode DataGridProps.columns | columns} prop on `<DataGrid />`
 */
export type ColumnOrColumnGroup<R, SR = unknown> = Column<R, SR> | ColumnGroup<R, SR>;

/**
 * Union type representing either a `CalculatedColumnParent` or a `CalculatedColumn`.
 *
 * @see {@linkcode CalculatedColumn}, {@linkcode CalculatedColumnParent}
 */
export type CalculatedColumnOrColumnGroup<R, SR> =
  | CalculatedColumnParent<R, SR>
  | CalculatedColumn<R, SR>;

/**
 * Represents a cell position in the grid. This helper type is not exported; the shape is shown for reference.
 *
 * @see {@linkcode DataGridHandle}, {@linkcode CellKeyDownArgs}
 */
export interface Position {
  /** Column index, or `-1` for the whole row in `TreeDataGrid` */
  readonly idx: number;
  /** Row index: `0` is the first row, header rows and top summary rows have negative indexes, and bottom summary rows come after the last row */
  readonly rowIdx: number;
}

/**
 * Props passed to custom cell content renderers ({@linkcode Column.renderCell | column.renderCell}).
 *
 * @example
 * ```tsx
 * import type { RenderCellContentProps } from 'react-data-grid';
 *
 * function renderCell({ row, column, onRowChange }: RenderCellContentProps<MyRow>) {
 *   return (
 *     <div>
 *       {row[column.key]}
 *       <button onClick={() => onRowChange({ ...row, updated: true })}>Update</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @see {@linkcode Column.renderCell | column.renderCell}, {@linkcode renderValue} function
 */
export interface RenderCellContentProps<R, SR = unknown> {
  column: CalculatedColumn<R, SR>;
  row: R;
  rowIdx: number;
  isCellEditable: boolean;
  tabIndex: number;
  onRowChange: (row: R) => void;
}

/**
 * Props passed to summary cell content renderers ({@linkcode Column.renderSummaryCell | column.renderSummaryCell}).
 *
 * @see {@linkcode Column.renderSummaryCell | column.renderSummaryCell}
 */
export interface RenderSummaryCellContentProps<SR, R = unknown> {
  column: CalculatedColumn<R, SR>;
  row: SR;
  tabIndex: number;
}

/**
 * Props passed to group cell content renderers ({@linkcode Column.renderGroupCell | column.renderGroupCell}) when using `TreeDataGrid`.
 *
 * @see {@linkcode Column.renderGroupCell | column.renderGroupCell}, {@linkcode renderToggleGroup} function, {@linkcode ToggleGroup | <ToggleGroup />}
 */
export interface RenderGroupCellContentProps<R, SR = unknown> {
  groupKey: unknown;
  column: CalculatedColumn<R, SR>;
  row: GroupRow<R>;
  childRows: readonly R[];
  isExpanded: boolean;
  tabIndex: number;
  toggleGroup: () => void;
}

/**
 * Props passed to custom editors ({@linkcode Column.renderEditCell | column.renderEditCell}).
 *
 * @example
 * ```tsx
 * import type { RenderEditCellContentProps } from 'react-data-grid';
 *
 * function renderEditor({ row, column, onRowChange, onClose }: RenderEditCellContentProps<MyRow>) {
 *   return (
 *     <input
 *       autoFocus
 *       value={row[column.key]}
 *       onChange={(event) => onRowChange({ ...row, [column.key]: event.target.value })}
 *       onBlur={() => onClose(true)}
 *     />
 *   );
 * }
 * ```
 *
 * @see {@linkcode Column.renderEditCell | column.renderEditCell}, {@linkcode renderTextEditor} function
 */
export interface RenderEditCellContentProps<R, SR = unknown> {
  column: CalculatedColumn<R, SR>;
  row: R;
  rowIdx: number;
  onRowChange: (row: R, commitChanges?: boolean) => void;
  onClose: (commitChanges?: boolean, shouldFocus?: boolean) => void;
}

/**
 * Props passed to custom header cell content renderers ({@linkcode Column.renderHeaderCell | column.renderHeaderCell}).
 *
 * @see {@linkcode Column.renderHeaderCell | column.renderHeaderCell}, {@linkcode renderHeaderCell} function
 */
export interface RenderHeaderCellContentProps<R, SR = unknown> {
  column: CalculatedColumn<R, SR>;
  sortDirection: SortDirection | undefined;
  priority: number | undefined;
  tabIndex: number;
}

interface BaseRenderCellProps<R, SR = unknown>
  extends
    Omit<React.ComponentProps<'div'>, 'children'>,
    Pick<
      DataGridProps<R, SR>,
      'onCellMouseDown' | 'onCellClick' | 'onCellDoubleClick' | 'onCellContextMenu'
    > {
  rowIdx: number;
  setActivePosition: (position: Position, options?: SetActivePositionOptions) => void;
}

/**
 * Props passed to the cell renderer when using {@linkcode Renderers.renderCell | renderers.renderCell}.
 *
 * @see {@linkcode DataGridProps.renderers | renderers.renderCell}, {@linkcode Cell | <Cell />}
 */
export interface RenderCellProps<R, SR> extends BaseRenderCellProps<R, SR> {
  column: CalculatedColumn<R, SR>;
  row: R;
  colSpan: number;
  isDraggedOver: boolean;
  isCellActive: boolean;
  onRowChange: (column: CalculatedColumn<R, SR>, rowIdx: number, newRow: R) => void;
}

export interface EditCellProps<R, SR> extends Pick<
  RenderCellProps<R, SR>,
  'column' | 'row' | 'rowIdx'
> {
  onRowChange: (row: R, commitChanges: boolean, shouldFocus: boolean) => void;
  closeEditor: (shouldFocus: boolean) => void;
  navigate: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onKeyDown: Maybe<(args: EditCellKeyDownArgs<R, SR>, event: CellKeyboardEvent) => void>;
}

/**
 * Adds grid-specific methods to a React event. This helper type is not exported; the shape is shown for reference.
 *
 * @see {@linkcode CellMouseEvent}, {@linkcode CellKeyboardEvent}
 */
export type CellEvent<E extends React.SyntheticEvent<HTMLDivElement>> = E & {
  /** Prevents the default grid behavior for this event */
  preventGridDefault: () => void;
  /** Returns whether `preventGridDefault` was called */
  isGridDefaultPrevented: () => boolean;
};

/**
 * Extends `React.MouseEvent<HTMLDivElement>` with grid-specific methods.
 *
 * @example
 * ```tsx
 * import type { CellMouseArgs, CellMouseEvent } from 'react-data-grid';
 *
 * function onCellMouseDown(args: CellMouseArgs<Row>, event: CellMouseEvent) {
 *   if (args.column.key === 'actions') {
 *     event.preventGridDefault(); // Prevent cell focus
 *   }
 * }
 * ```
 *
 * @see {@linkcode DataGridProps.onCellMouseDown | onCellMouseDown}, {@linkcode DataGridProps.onCellClick | onCellClick}, {@linkcode DataGridProps.onCellDoubleClick | onCellDoubleClick}, and {@linkcode DataGridProps.onCellContextMenu | onCellContextMenu} props on `<DataGrid />`
 */
export type CellMouseEvent = CellEvent<React.MouseEvent<HTMLDivElement>>;

/**
 * Extends `React.KeyboardEvent<HTMLDivElement>` with grid-specific methods.
 *
 * @see {@linkcode DataGridProps.onCellKeyDown | onCellKeyDown} prop on `<DataGrid />`
 */
export type CellKeyboardEvent = CellEvent<React.KeyboardEvent<HTMLDivElement>>;

/**
 * Type alias for `React.ClipboardEvent<HTMLDivElement>`. Used for copy and paste events. This helper type is not exported; the shape is shown for reference.
 *
 * @see {@linkcode DataGridProps.onCellCopy | onCellCopy} and {@linkcode DataGridProps.onCellPaste | onCellPaste} props on `<DataGrid />`
 */
export type CellClipboardEvent = React.ClipboardEvent<HTMLDivElement>;

/**
 * Arguments passed to cell mouse event handlers.
 *
 * @example
 * ```tsx
 * import type { CellMouseArgs, CellMouseEvent } from 'react-data-grid';
 *
 * function onCellClick(args: CellMouseArgs<Row>, event: CellMouseEvent) {
 *   console.log('Clicked cell at row', args.rowIdx, 'column', args.column.key);
 *   args.setActivePosition(true); // Focus and start editing
 * }
 * ```
 *
 * @see {@linkcode DataGridProps.onCellMouseDown | onCellMouseDown}, {@linkcode DataGridProps.onCellClick | onCellClick}, {@linkcode DataGridProps.onCellDoubleClick | onCellDoubleClick}, and {@linkcode DataGridProps.onCellContextMenu | onCellContextMenu} props on `<DataGrid />`
 */
export interface CellMouseArgs<R, SR = unknown> {
  /** The column object of the cell. */
  column: CalculatedColumn<R, SR>;
  /** The row object of the cell. */
  row: R;
  /** The row index of the cell. */
  rowIdx: number;
  /** Function to manually focus the cell. Pass `true` to immediately start editing. */
  setActivePosition: (enableEditor?: boolean) => void;
}

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

/**
 * Arguments passed to the `onCellKeyDown` handler. The shape differs based on whether the cell is in ACTIVE or EDIT mode.
 *
 * @example
 * ```tsx
 * import type { CellKeyboardEvent, CellKeyDownArgs } from 'react-data-grid';
 *
 * function onCellKeyDown(args: CellKeyDownArgs<Row>, event: CellKeyboardEvent) {
 *   if (args.mode === 'EDIT' && event.key === 'Escape') {
 *     args.onClose(false); // Close without committing
 *     event.preventGridDefault();
 *   }
 * }
 * ```
 *
 * @see {@linkcode DataGridProps.onCellKeyDown | onCellKeyDown} prop on `<DataGrid />`
 */
export type CellKeyDownArgs<R, SR = unknown> =
  | ActiveCellKeyDownArgs<R, SR>
  | EditCellKeyDownArgs<R, SR>;

/**
 * Arguments passed to `onActivePositionChange`.
 *
 * @see {@linkcode DataGridProps.onActivePositionChange | onActivePositionChange} prop on `<DataGrid />`
 */
export interface PositionChangeArgs<R, SR = unknown> {
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

/**
 * Handler type used by `onCellMouseDown`, `onCellClick`, `onCellDoubleClick`, and `onCellContextMenu`. This helper type is not exported; the shape is shown for reference.
 */
export type CellMouseEventHandler<R, SR> = Maybe<
  (args: CellMouseArgs<NoInfer<R>, NoInfer<SR>>, event: CellMouseEvent) => void
>;

/**
 * Type of `mapViewportColumns` in `RenderRowProps`. This helper type is not exported; the shape is shown for reference.
 *
 * @see {@linkcode RenderRowProps}, {@linkcode ColSpanArgs}
 */
export type MapViewportColumns<R, SR> = <T>(
  activeIdx: number | undefined,
  colSpanArgs: ColSpanArgs<R, SR> | undefined,
  callback: (
    column: CalculatedColumn<R, SR>,
    isCellActive: boolean,
    colSpan: number,
    index: number
  ) => T
) => T[];

export interface BaseRenderRowProps<R, SR = unknown> extends BaseRenderCellProps<R, SR> {
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
}

/**
 * Props passed to custom row renderers.
 *
 * @see {@linkcode DataGridProps.renderers | renderers.renderRow}, {@linkcode Row | <Row />}, {@linkcode MapViewportColumns}
 */
export interface RenderRowProps<R, SR = unknown> extends BaseRenderRowProps<R, SR> {
  row: R;
  draggedOverCellIdx: number | undefined;
  activeCellEditor: ReactElement<EditCellProps<R, SR>> | undefined;
  onRowChange: (column: CalculatedColumn<R, SR>, rowIdx: number, newRow: R) => void;
  rowClass: Maybe<(row: R, rowIdx: number) => Maybe<string>>;
  isTreeGrid: boolean;
}

/**
 * Data provided to the `onRowsChange` callback.
 *
 * @see {@linkcode DataGridProps.onRowsChange | onRowsChange} prop on `<DataGrid />`
 */
export interface RowsChangeData<R, SR = unknown> {
  /** Indexes of the rows that changed */
  indexes: number[];
  /** The column of the cells that changed */
  column: CalculatedColumn<R, SR>;
}

/**
 * Event object for row selection changes.
 *
 * @see {@linkcode useRowSelection} hook
 */
export interface SelectRowEvent<R> {
  row: R;
  checked: boolean;
  isShiftClick: boolean;
}

/**
 * Event object for header row selection changes.
 *
 * @see {@linkcode useHeaderRowSelection} hook
 */
export interface SelectHeaderRowEvent {
  checked: boolean;
}

/**
 * Event object for drag-fill operations.
 *
 * @see {@linkcode DataGridProps.onFill | onFill} prop on `<DataGrid />`
 */
export interface FillEvent<R> {
  columnKey: string;
  sourceRow: R;
  targetRow: R;
}

interface CellCopyPasteArgs<R, SR = unknown> {
  column: CalculatedColumn<R, SR>;
  row: R;
}

/**
 * Arguments passed to `onCellCopy`.
 *
 * @see {@linkcode DataGridProps.onCellCopy | onCellCopy} prop on `<DataGrid />`
 */
export type CellCopyArgs<R, SR = unknown> = CellCopyPasteArgs<R, SR>;
/**
 * Arguments passed to `onCellPaste`.
 *
 * @see {@linkcode DataGridProps.onCellPaste | onCellPaste} prop on `<DataGrid />`
 */
export type CellPasteArgs<R, SR = unknown> = CellCopyPasteArgs<R, SR>;

/**
 * Represents a group row in `TreeDataGrid`. This helper type is not exported; the shape is shown for reference.
 *
 * @see {@linkcode RenderGroupCellContentProps}, {@linkcode RowHeightArgs}, {@linkcode TreeDataGrid | <TreeDataGrid />}
 */
export interface GroupRow<R> {
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

/**
 * Describes a sorted column.
 *
 * @see {@linkcode DataGridProps.sortColumns | sortColumns} and {@linkcode DataGridProps.onSortColumnsChange | onSortColumnsChange} props on `<DataGrid />`
 */
export interface SortColumn {
  readonly columnKey: string;
  readonly direction: SortDirection;
}

export type CellNavigationMode = 'NONE' | 'CHANGE_ROW';
/**
 * Whether a column is frozen, and on which edge.
 *
 * @see {@linkcode Column.frozen | column.frozen}
 */
export type ColumnFrozen = false | 'start' | 'end';
/**
 * @see {@linkcode SortColumn}
 */
export type SortDirection = 'ASC' | 'DESC';

/**
 * Arguments passed to the `colSpan` function.
 *
 * @example
 * ```tsx
 * import type { Column } from 'react-data-grid';
 *
 * const columns: readonly Column<Row>[] = [
 *   {
 *     key: 'title',
 *     name: 'Title',
 *     colSpan(args) {
 *       if (args.type === 'ROW' && args.row.isFullWidth) {
 *         return 3; // Span 3 columns
 *       }
 *       return undefined;
 *     }
 *   }
 * ];
 * ```
 *
 * @see {@linkcode Column.colSpan | column.colSpan}
 */
export type ColSpanArgs<R, SR> =
  | { readonly type: 'HEADER' }
  | { readonly type: 'ROW'; readonly row: R }
  | { readonly type: 'SUMMARY'; readonly row: SR };

/**
 * Arguments passed to `TreeDataGrid`'s `rowHeight` prop when it is a function.
 *
 * @example
 * ```tsx
 * function getRowHeight(args: RowHeightArgs<Row>): number {
 *   if (args.type === 'GROUP') {
 *     return 40;
 *   }
 *   return args.row.isLarge ? 60 : 35;
 * }
 *
 * <TreeDataGrid rowHeight={getRowHeight} ... />
 * ```
 *
 * @see {@linkcode TreeDataGridProps.rowHeight | rowHeight} prop on `<TreeDataGrid />`
 */
export type RowHeightArgs<R> = { type: 'ROW'; row: R } | { type: 'GROUP'; row: GroupRow<R> };

/**
 * Props for custom sort icon renderers.
 *
 * @see {@linkcode renderSortIcon} function
 */
export interface RenderSortIconProps {
  /** The sort direction of the column, or `undefined` if it is not sorted */
  sortDirection: SortDirection | undefined;
}

/**
 * Props for custom sort priority renderers.
 *
 * @see {@linkcode renderSortPriority} function
 */
export interface RenderSortPriorityProps {
  /** The column's position in `sortColumns`, starting at 1, when sorting by multiple columns, or `undefined` otherwise */
  priority: number | undefined;
}

/**
 * Props for custom sort status renderers.
 *
 * @see {@linkcode DataGridProps.renderers | renderers.renderSortStatus}
 */
export interface RenderSortStatusProps extends RenderSortIconProps, RenderSortPriorityProps {}

/**
 * Props for custom checkbox renderers.
 *
 * @see {@linkcode renderCheckbox} function, {@linkcode DataGridProps.renderers | renderers.renderCheckbox}, {@linkcode SelectCheckbox | <SelectCheckbox />}
 */
export interface RenderCheckboxProps {
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

/**
 * Custom renderer configuration for the grid.
 *
 * @see {@linkcode DataGridProps.renderers | renderers} prop on `<DataGrid />`, {@linkcode DataGridRenderersContext}
 */
export interface Renderers<R, SR> {
  readonly renderCell?: Maybe<(key: Key, props: RenderCellProps<R, SR>) => ReactNode>;
  readonly renderCheckbox?: Maybe<(props: RenderCheckboxProps) => ReactNode>;
  readonly renderRow?: Maybe<(key: Key, props: RenderRowProps<R, SR>) => ReactNode>;
  readonly renderSortStatus?: Maybe<(props: RenderSortStatusProps) => ReactNode>;
  readonly noRowsFallback?: Maybe<ReactNode>;
}

/**
 * Options for programmatically updating the grid's active position.
 *
 * @see {@linkcode DataGridHandle}, {@linkcode CellKeyDownArgs}
 */
export interface SetActivePositionOptions {
  enableEditor?: Maybe<boolean>;
  shouldFocus?: Maybe<boolean>;
}

/**
 * Represents a single column's width.
 *
 * @see {@linkcode ColumnWidths}
 */
export interface ColumnWidth {
  /** `'resized'` if the user resized the column, or `'measured'` if the grid measured it */
  readonly type: 'resized' | 'measured';
  /** The width in pixels */
  readonly width: number;
}

/**
 * A map of column widths.
 *
 * @see {@linkcode DataGridProps.columnWidths | columnWidths} and {@linkcode DataGridProps.onColumnWidthsChange | onColumnWidthsChange} props on `<DataGrid />`
 */
export type ColumnWidths = ReadonlyMap<string, ColumnWidth>;

/**
 * Text direction of the grid.
 *
 * @see {@linkcode DataGridProps.direction | direction} prop on `<DataGrid />`
 */
export type Direction = 'ltr' | 'rtl';

export type ResizedWidth = number | 'max-content';
