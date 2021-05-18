/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ReactElement } from 'react';

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export interface Column<TRow, TSummaryRow = unknown, TFilterRow = unknown> {
  /** The name of the column. By default it will be displayed in the header cell */
  name: string | ReactElement;
  /** A unique key to distinguish each column */
  key: string;
  /** Column width. If not specified, it will be determined automatically based on grid width and specified widths of other columns */
  width?: number | string;
  /** Minimum column width in px. */
  minWidth?: number;
  /** Maximum column width in px. */
  maxWidth?: number;
  cellClass?: string | ((row: TRow) => string | undefined);
  headerCellClass?: string;
  summaryCellClass?: string | ((row: TSummaryRow) => string);
  /** Formatter to be used to render the cell content */
  formatter?: React.ComponentType<FormatterProps<TRow, TSummaryRow, TFilterRow>>;
  /** Formatter to be used to render the summary cell content */
  summaryFormatter?: React.ComponentType<SummaryFormatterProps<TSummaryRow, TRow, TFilterRow>>;
  /** Formatter to be used to render the group cell content */
  groupFormatter?: React.ComponentType<GroupFormatterProps<TRow, TSummaryRow, TFilterRow>>;
  /** Enables cell editing. If set and no editor property specified, then a textinput will be used as the cell editor */
  editable?: boolean | ((row: TRow) => boolean);
  colSpan?: (args: ColSpanArgs<TRow, TSummaryRow>) => number | undefined;
  /** Determines whether column is frozen or not */
  frozen?: boolean;
  /** Enable resizing of a column */
  resizable?: boolean;
  /** Enable sorting of a column */
  sortable?: boolean;
  /** Sets the column sort order to be descending instead of ascending the first time the column is sorted */
  sortDescendingFirst?: boolean;
  /** Editor to be rendered when cell of column is being edited. If set, then the column is automatically set to be editable */
  editor?: React.ComponentType<EditorProps<TRow, TSummaryRow, TFilterRow>>;
  editorOptions?: {
    /** @default false */
    createPortal?: boolean;
    /** @default false */
    editOnClick?: boolean;
    /** Prevent default to cancel editing */
    onCellKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
    /** Control the default cell navigation behavior while the editor is open */
    onNavigation?: (event: React.KeyboardEvent<HTMLDivElement>) => boolean;
    // TODO: Do we need these options
    // editOnDoubleClick?: boolean;
    /** @default false */
    // commitOnScroll?: boolean;
  };
  /** Header renderer for each header cell */
  headerRenderer?: React.ComponentType<HeaderRendererProps<TRow, TSummaryRow, TFilterRow>>;
  /** Component to be used to filter the data of the column */
  filterRenderer?: React.ComponentType<FilterRendererProps<TRow, TSummaryRow, TFilterRow>>;
}

export interface CalculatedColumn<TRow, TSummaryRow = unknown, TFilterRow = unknown>
  extends Column<TRow, TSummaryRow, TFilterRow> {
  idx: number;
  resizable: boolean;
  sortable: boolean;
  frozen: boolean;
  isLastFrozenColumn: boolean;
  rowGroup: boolean;
  formatter: React.ComponentType<FormatterProps<TRow, TSummaryRow, TFilterRow>>;
}

export interface ColumnMetric {
  width: number;
  left: number;
}

export interface Position {
  idx: number;
  rowIdx: number;
}

export interface FormatterProps<TRow = unknown, TSummaryRow = unknown, TFilterRow = unknown> {
  rowIdx: number;
  column: CalculatedColumn<TRow, TSummaryRow, TFilterRow>;
  row: TRow;
  isCellSelected: boolean;
  onRowChange: (row: Readonly<TRow>) => void;
}

export interface SummaryFormatterProps<TSummaryRow, TRow, TFilterRow> {
  column: CalculatedColumn<TRow, TSummaryRow, TFilterRow>;
  row: TSummaryRow;
}

export interface GroupFormatterProps<TRow, TSummaryRow, TFilterRow> {
  rowIdx: number;
  groupKey: unknown;
  column: CalculatedColumn<TRow, TSummaryRow, TFilterRow>;
  childRows: readonly TRow[];
  isExpanded: boolean;
  isCellSelected: boolean;
  toggleGroup: () => void;
}

export interface SharedEditorProps<TRow> {
  row: Readonly<TRow>;
  rowHeight: number;
  editorPortalTarget: Element;
  onRowChange: (row: Readonly<TRow>, commitChanges?: boolean) => void;
  onClose: (commitChanges?: boolean) => void;
}

export interface EditorProps<TRow, TSummaryRow = unknown, TFilterRow = unknown>
  extends SharedEditorProps<TRow> {
  rowIdx: number;
  column: Readonly<CalculatedColumn<TRow, TSummaryRow, TFilterRow>>;
  top: number;
  left: number;
}

export interface HeaderRendererProps<TRow, TSummaryRow = unknown, TFilterRow = unknown> {
  column: CalculatedColumn<TRow, TSummaryRow, TFilterRow>;
  sortColumn: string | undefined | null;
  sortDirection: SortDirection | undefined | null;
  onSort: ((columnKey: string, direction: SortDirection) => void) | undefined | null;
  allRowsSelected: boolean;
  onAllRowsSelectionChange: (checked: boolean) => void;
}

interface SelectedCellPropsBase {
  idx: number;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}

export interface EditCellProps<TRow> extends SelectedCellPropsBase {
  mode: 'EDIT';
  editorProps: SharedEditorProps<TRow>;
}

export interface SelectedCellProps extends SelectedCellPropsBase {
  mode: 'SELECT';
  onFocus: () => void;
  dragHandleProps:
    | Pick<React.HTMLAttributes<HTMLDivElement>, 'onMouseDown' | 'onDoubleClick'>
    | undefined;
}

export interface CellRendererProps<TRow, TSummaryRow, TFilterRow>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style' | 'children'> {
  rowIdx: number;
  column: CalculatedColumn<TRow, TSummaryRow, TFilterRow>;
  colSpan: number | undefined;
  row: TRow;
  isCopied: boolean;
  isDraggedOver: boolean;
  isCellSelected: boolean;
  dragHandleProps:
    | Pick<React.HTMLAttributes<HTMLDivElement>, 'onMouseDown' | 'onDoubleClick'>
    | undefined;
  onRowChange: (rowIdx: number, newRow: TRow) => void;
  onRowClick:
    | ((rowIdx: number, row: TRow, column: CalculatedColumn<TRow, TSummaryRow, TFilterRow>) => void)
    | undefined
    | null;
  selectCell: (position: Position, enableEditor?: boolean) => void;
}

export interface RowRendererProps<TRow, TSummaryRow = unknown, TFilterRow = unknown>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style' | 'children'> {
  viewportColumns: readonly CalculatedColumn<TRow, TSummaryRow, TFilterRow>[];
  row: TRow;
  cellRenderer?: React.ComponentType<CellRendererProps<TRow, TSummaryRow, TFilterRow>>;
  rowIdx: number;
  copiedCellIdx: number | undefined;
  draggedOverCellIdx: number | undefined;
  lastFrozenColumnIndex: number;
  isRowSelected: boolean;
  top: number;
  height: number;
  selectedCellProps: EditCellProps<TRow> | SelectedCellProps | undefined;
  onRowChange: (rowIdx: number, row: TRow) => void;
  onRowClick:
    | ((rowIdx: number, row: TRow, column: CalculatedColumn<TRow, TSummaryRow, TFilterRow>) => void)
    | undefined
    | null;
  rowClass: ((row: TRow) => string | undefined | null) | undefined | null;
  setDraggedOverRowIdx: ((overRowIdx: number) => void) | undefined;
  selectCell: (position: Position, enableEditor?: boolean) => void;
}

export interface FilterRendererProps<TRow, TSummaryRow, TFilterRow> {
  column: CalculatedColumn<TRow, TSummaryRow, TFilterRow>;
  filterRow: TFilterRow;
  onFilterRowChange: (filterRow: TFilterRow) => void;
}

export interface RowsChangeData<R, SR, FR> {
  indexes: number[];
  column: CalculatedColumn<R, SR, FR>;
}

export interface SelectRowEvent {
  rowIdx: number;
  checked: boolean;
  isShiftClick: boolean;
}

export interface FillEvent<TRow> {
  columnKey: string;
  sourceRow: TRow;
  targetRows: TRow[];
}

export interface PasteEvent<TRow> {
  sourceColumnKey: string;
  sourceRow: TRow;
  targetColumnKey: string;
  targetRow: TRow;
}

export type GroupByDictionary<TRow> = Record<
  string,
  {
    childRows: readonly TRow[];
    childGroups: readonly TRow[] | GroupByDictionary<TRow>;
    startRowIndex: number;
  }
>;

export interface GroupRow<TRow> {
  childRows: readonly TRow[];
  id: string;
  parentId: unknown;
  groupKey: unknown;
  isExpanded: boolean;
  level: number;
  posInSet: number;
  setSize: number;
  startRowIndex: number;
}

export type CellNavigationMode = 'NONE' | 'CHANGE_ROW' | 'LOOP_OVER_ROW';
export type SortDirection = 'ASC' | 'DESC' | 'NONE';

export type ColSpanArgs<R, SR> =
  | { type: 'HEADER' | 'FILTER' }
  | { type: 'ROW'; row: R }
  | { type: 'SUMMARY'; row: SR };

export type RowHeightArgs<R> = { type: 'ROW'; row: R } | { type: 'GROUP'; row: GroupRow<R> };
