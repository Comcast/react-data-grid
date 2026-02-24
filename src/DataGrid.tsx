import { useCallback, useImperativeHandle, useLayoutEffect, useMemo, useState } from 'react';
import type { Key, KeyboardEvent } from 'react';
import { flushSync } from 'react-dom';

import {
  HeaderRowSelectionChangeContext,
  HeaderRowSelectionContext,
  RowSelectionChangeContext,
  useCalculatedColumns,
  useColumnWidths,
  useGridDimensions,
  useLatestFunc,
  useViewportColumns,
  useViewportRows,
  type HeaderRowSelectionContextValue
} from './hooks';
import {
  abs,
  assertIsValidKeyGetter,
  canExitGrid,
  classnames,
  createCellEvent,
  getCellStyle,
  getColSpan,
  getLeftRightKey,
  getNextActivePosition,
  isCellEditableUtil,
  isCtrlKeyHeldDown,
  isDefaultCellInput,
  renderMeasuringCells,
  scrollIntoView,
  sign
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
  SetPositionOptions,
  SelectHeaderRowEvent,
  SelectRowEvent,
  SortColumn
} from './types';
import { defaultRenderCell } from './Cell';
import { renderCheckbox as defaultRenderCheckbox } from './cellRenderers';
import {
  DataGridDefaultRenderersContext,
  useDefaultRenderers
} from './DataGridDefaultRenderersContext';
import EditCell from './EditCell';
import GroupedColumnHeaderRow from './GroupedColumnHeaderRow';
import HeaderRow from './HeaderRow';
import { defaultRenderRow } from './Row';
import type { PartialPosition } from './ScrollToCell';
import ScrollToCell from './ScrollToCell';
import { default as defaultRenderSortStatus } from './sortStatus';
import { cellDragHandleClassname, cellDragHandleFrozenClassname } from './style/cell';
import { rootClassname, viewportDraggingClassname } from './style/core';
import SummaryRow from './SummaryRow';

export interface ActiveCellState extends Position {
  readonly mode: 'ACTIVE';
}

interface EditCellState<R> extends Position {
  readonly mode: 'EDIT';
  readonly row: R;
  readonly originalRow: R;
}

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

export interface DataGridHandle {
  element: HTMLDivElement | null;
  scrollToCell: (position: PartialPosition) => void;
  setPosition: (position: Position, options?: SetPositionOptions) => void;
}

type SharedDivProps = Pick<
  React.ComponentProps<'div'>,
  | 'role'
  | 'aria-label'
  | 'aria-labelledby'
  | 'aria-description'
  | 'aria-describedby'
  | 'aria-rowcount'
  | 'className'
  | 'style'
>;

export interface DataGridProps<R, SR = unknown, K extends Key = Key> extends SharedDivProps {
  ref?: Maybe<React.Ref<DataGridHandle>>;
  /**
   * Grid and data Props
   */
  /** An array of column definitions */
  columns: readonly ColumnOrColumnGroup<NoInfer<R>, NoInfer<SR>>[];
  /** A function called for each rendered row that should return a plain key/value pair object */
  rows: readonly R[];
  /** Rows pinned at the top of the grid for summary purposes */
  topSummaryRows?: Maybe<readonly SR[]>;
  /** Rows pinned at the bottom of the grid for summary purposes */
  bottomSummaryRows?: Maybe<readonly SR[]>;
  /** Function to return a unique key/identifier for each row */
  rowKeyGetter?: Maybe<(row: NoInfer<R>) => K>;
  /** Callback triggered when rows are changed */
  onRowsChange?: Maybe<(rows: NoInfer<R>[], data: RowsChangeData<NoInfer<R>, NoInfer<SR>>) => void>;

  /**
   * Dimensions props
   */
  /**
   * Height of each row in pixels
   * @default 35
   */
  rowHeight?: Maybe<number | ((row: NoInfer<R>) => number)>;
  /**
   * Height of the header row in pixels
   * @default 35
   */
  headerRowHeight?: Maybe<number>;
  /**
   * Height of each summary row in pixels
   * @default 35
   */
  summaryRowHeight?: Maybe<number>;
  /** A map of column widths */
  columnWidths?: Maybe<ColumnWidths>;
  /** Callback triggered when column widths change */
  onColumnWidthsChange?: Maybe<(columnWidths: ColumnWidths) => void>;

  /**
   * Feature props
   */
  /** A set of selected row keys */
  selectedRows?: Maybe<ReadonlySet<K>>;
  /** Function to determine if row selection is disabled for a specific row */
  isRowSelectionDisabled?: Maybe<(row: NoInfer<R>) => boolean>;
  /** Callback triggered when the selection changes */
  onSelectedRowsChange?: Maybe<(selectedRows: Set<NoInfer<K>>) => void>;
  /** An array of sorted columns */
  sortColumns?: Maybe<readonly SortColumn[]>;
  /** Callback triggered when sorting changes */
  onSortColumnsChange?: Maybe<(sortColumns: SortColumn[]) => void>;
  /** Default options applied to all columns */
  defaultColumnOptions?: Maybe<DefaultColumnOptions<NoInfer<R>, NoInfer<SR>>>;

  /**
   * Event props
   */
  /** Callback triggered when a pointer becomes active in a cell */
  onCellMouseDown?: CellMouseEventHandler<R, SR>;
  /** Callback triggered when a cell is clicked */
  onCellClick?: CellMouseEventHandler<R, SR>;
  /** Callback triggered when a cell is double-clicked */
  onCellDoubleClick?: CellMouseEventHandler<R, SR>;
  /** Callback triggered when a cell is right-clicked */
  onCellContextMenu?: CellMouseEventHandler<R, SR>;
  /** Callback triggered when a key is pressed in a cell */
  onCellKeyDown?: Maybe<
    (args: CellKeyDownArgs<NoInfer<R>, NoInfer<SR>>, event: CellKeyboardEvent) => void
  >;
  /** Callback triggered when a cell's content is copied */
  onCellCopy?: Maybe<
    (args: CellCopyArgs<NoInfer<R>, NoInfer<SR>>, event: CellClipboardEvent) => void
  >;
  /** Callback triggered when content is pasted into a cell */
  onCellPaste?: Maybe<
    (args: CellPasteArgs<NoInfer<R>, NoInfer<SR>>, event: CellClipboardEvent) => NoInfer<R>
  >;
  /** Function called whenever the active position is changed */
  onActivePositionChange?: Maybe<(args: PositionChangeArgs<NoInfer<R>, NoInfer<SR>>) => void>;
  /** Callback triggered when the grid is scrolled */
  onScroll?: Maybe<(event: React.UIEvent<HTMLDivElement>) => void>;
  /** Callback triggered when column is resized */
  onColumnResize?: Maybe<(column: CalculatedColumn<R, SR>, width: number) => void>;
  /** Callback triggered when columns are reordered */
  onColumnsReorder?: Maybe<(sourceColumnKey: string, targetColumnKey: string) => void>;
  onFill?: Maybe<(event: FillEvent<NoInfer<R>>) => NoInfer<R>>;

  /**
   * Toggles and modes
   */
  /** @default true */
  enableVirtualization?: Maybe<boolean>;

  /**
   * Miscellaneous
   */
  /** Custom renderers for cells, rows, and other components */
  renderers?: Maybe<Renderers<NoInfer<R>, NoInfer<SR>>>;
  /** Function to apply custom class names to rows */
  rowClass?: Maybe<(row: NoInfer<R>, rowIdx: number) => Maybe<string>>;
  /** Custom class name for the header row */
  headerRowClass?: Maybe<string>;
  /**
   * Text direction of the grid ('ltr' or 'rtl')
   * @default 'ltr'
   */
  direction?: Maybe<Direction>;
  'data-testid'?: Maybe<string>;
  'data-cy'?: Maybe<string>;
}

/**
 * Main API Component to render a data grid of rows and columns
 *
 * @example
 *
 * <DataGrid columns={columns} rows={rows} />
 */
export function DataGrid<R, SR = unknown, K extends Key = Key>(props: DataGridProps<R, SR, K>) {
  const {
    ref,
    // Grid and data Props
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
  const defaultRenderers = useDefaultRenderers<R, SR>();
  const role = rawRole ?? 'grid';
  const rowHeight = rawRowHeight ?? 35;
  const headerRowHeight = rawHeaderRowHeight ?? (typeof rowHeight === 'number' ? rowHeight : 35);
  const summaryRowHeight = rawSummaryRowHeight ?? (typeof rowHeight === 'number' ? rowHeight : 35);
  const renderRow = renderers?.renderRow ?? defaultRenderers?.renderRow ?? defaultRenderRow;
  const renderCell = renderers?.renderCell ?? defaultRenderers?.renderCell ?? defaultRenderCell;
  const renderSortStatus =
    renderers?.renderSortStatus ?? defaultRenderers?.renderSortStatus ?? defaultRenderSortStatus;
  const renderCheckbox =
    renderers?.renderCheckbox ?? defaultRenderers?.renderCheckbox ?? defaultRenderCheckbox;
  const noRowsFallback = renderers?.noRowsFallback ?? defaultRenderers?.noRowsFallback;
  const enableVirtualization = rawEnableVirtualization ?? true;
  const direction = rawDirection ?? 'ltr';

  /**
   * states
   */
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [columnWidthsInternal, setColumnWidthsInternal] = useState(
    (): ColumnWidths => columnWidthsRaw ?? new Map()
  );
  const [isColumnResizing, setIsColumnResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedOverRowIdx, setDraggedOverRowIdx] = useState<number | undefined>(undefined);
  const [scrollToPosition, setScrollToPosition] = useState<PartialPosition | null>(null);
  const [shouldFocusPosition, setShouldFocusPosition] = useState(false);
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

  const [gridRef, gridWidth, gridHeight, horizontalScrollbarHeight] = useGridDimensions();
  const {
    columns,
    colSpanColumns,
    lastFrozenColumnIndex,
    headerRowsCount,
    colOverscanStartIdx,
    colOverscanEndIdx,
    templateColumns,
    layoutCssVars,
    totalFrozenColumnWidth
  } = useCalculatedColumns({
    rawColumns,
    defaultColumnOptions,
    getColumnWidth,
    scrollLeft,
    viewportWidth: gridWidth,
    enableVirtualization
  });

  const topSummaryRowsCount = topSummaryRows?.length ?? 0;
  const bottomSummaryRowsCount = bottomSummaryRows?.length ?? 0;
  const summaryRowsCount = topSummaryRowsCount + bottomSummaryRowsCount;
  const headerAndTopSummaryRowsCount = headerRowsCount + topSummaryRowsCount;
  const groupedColumnHeaderRowsCount = headerRowsCount - 1;
  const minRowIdx = -headerAndTopSummaryRowsCount;
  const mainHeaderRowIdx = minRowIdx + groupedColumnHeaderRowsCount;
  const maxRowIdx = rows.length + bottomSummaryRowsCount - 1;

  const [activePosition, setActivePosition] = useState<ActiveCellState | EditCellState<R>>(
    getInitialActivePosition
  );

  /**
   * computed values
   */
  const isTreeGrid = role === 'treegrid';
  const headerRowsHeight = headerRowsCount * headerRowHeight;
  const summaryRowsHeight = summaryRowsCount * summaryRowHeight;
  const clientHeight = gridHeight - headerRowsHeight - summaryRowsHeight;
  const isSelectable = selectedRows != null && onSelectedRowsChange != null;
  const { leftKey, rightKey } = getLeftRightKey(direction);
  const ariaRowCount = rawAriaRowCount ?? headerRowsCount + rows.length + summaryRowsCount;

  const defaultGridComponents = useMemo(
    () => ({
      renderCheckbox,
      renderSortStatus,
      renderCell
    }),
    [renderCheckbox, renderSortStatus, renderCell]
  );

  const headerSelectionValue = useMemo((): HeaderRowSelectionContextValue => {
    // no rows to select = explicitely unchecked
    let hasSelectedRow = false;
    let hasUnselectedRow = false;

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

    return {
      isRowSelected: hasSelectedRow && !hasUnselectedRow,
      isIndeterminate: hasSelectedRow && hasUnselectedRow
    };
  }, [rows, selectedRows, rowKeyGetter]);

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

  const maxColIdx = columns.length - 1;
  const {
    isPositionInActiveBounds: activePositionIsInActiveBounds,
    isPositionInViewport: activePositionIsInViewport,
    isRowInActiveBounds: activePositionIsRow,
    isCellInViewport: activePositionIsCellInViewport
  } = validatePosition(activePosition);
  const scrollHeight =
    headerRowHeight + totalRowHeight + summaryRowsHeight + horizontalScrollbarHeight;

  const {
    viewportColumns,
    iterateOverViewportColumnsForRow,
    iterateOverViewportColumnsForRowOutsideOfViewport
  } = useViewportColumns({
    columns,
    colSpanColumns,
    colOverscanStartIdx,
    colOverscanEndIdx,
    lastFrozenColumnIndex,
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
   * The identity of the wrapper function is stable so it won't break memoization
   */
  const handleColumnResizeLatest = useLatestFunc(handleColumnResize);
  const handleColumnResizeEndLatest = useLatestFunc(handleColumnResizeEnd);
  const onColumnsReorderLastest = useLatestFunc(onColumnsReorder);
  const onSortColumnsChangeLatest = useLatestFunc(onSortColumnsChange);
  const onCellMouseDownLatest = useLatestFunc(onCellMouseDown);
  const onCellClickLatest = useLatestFunc(onCellClick);
  const onCellDoubleClickLatest = useLatestFunc(onCellDoubleClick);
  const onCellContextMenuLatest = useLatestFunc(onCellContextMenu);
  const selectHeaderRowLatest = useLatestFunc(selectHeaderRow);
  const selectRowLatest = useLatestFunc(selectRow);
  const handleFormatterRowChangeLatest = useLatestFunc(updateRow);
  const setPositionLatest = useLatestFunc(setPosition);
  const selectHeaderCellLatest = useLatestFunc(selectHeaderCell);

  /**
   * effects
   */
  useLayoutEffect(() => {
    if (shouldFocusPosition) {
      if (activePositionIsRow) {
        focusRow(gridRef.current!);
      } else {
        focusCell(gridRef.current!);
      }
      setShouldFocusPosition(false);
    }
  }, [shouldFocusPosition, activePositionIsRow, gridRef]);

  useImperativeHandle(
    ref,
    (): DataGridHandle => ({
      element: gridRef.current,
      scrollToCell({ idx, rowIdx }) {
        const scrollToIdx =
          idx !== undefined && idx > lastFrozenColumnIndex && idx < columns.length
            ? idx
            : undefined;
        const scrollToRowIdx =
          rowIdx !== undefined && validatePosition({ idx: 0, rowIdx }).isPositionInViewport
            ? rowIdx + headerAndTopSummaryRowsCount
            : undefined;

        if (scrollToIdx !== undefined || scrollToRowIdx !== undefined) {
          setScrollToPosition({ idx: scrollToIdx, rowIdx: scrollToRowIdx });
        }
      },
      setPosition
    })
  );

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
      const step = sign(rowIdx - previousRowIdx);
      for (let i = previousRowIdx + step; i < rowIdx; i += step) {
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
          setPosition
        },
        cellEvent
      );
      if (cellEvent.isGridDefaultPrevented()) return;
    }

    const { target } = event;

    if (!(target instanceof Element)) return;

    const isCellEvent = target.closest('.rdg-cell') !== null;
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
        handleCellInput(event);
        break;
    }
  }

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const { scrollTop, scrollLeft } = event.currentTarget;
    flushSync(() => {
      setScrollTop(scrollTop);
      // scrollLeft is nagative when direction is rtl
      setScrollLeft(abs(scrollLeft));
    });
    onScroll?.(event);
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
    updateRow(columns[activePosition.idx], activePosition.rowIdx, activePosition.row);
  }

  function handleCellCopy(event: CellClipboardEvent) {
    if (!activePositionIsCellInViewport) return;
    const { idx, rowIdx } = activePosition;
    onCellCopy?.({ row: rows[rowIdx], column: columns[idx] }, event);
  }

  function handleCellPaste(event: CellClipboardEvent) {
    if (!onCellPaste || !onRowsChange || !isCellEditable(activePosition)) {
      return;
    }

    const { idx, rowIdx } = activePosition;
    const column = columns[idx];
    const updatedRow = onCellPaste({ row: rows[rowIdx], column }, event);
    updateRow(column, rowIdx, updatedRow);
  }

  function handleCellInput(event: KeyboardEvent<HTMLDivElement>) {
    if (!activePositionIsCellInViewport) return;
    const row = rows[activePosition.rowIdx];
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
      setActivePosition(({ idx, rowIdx }) => ({
        idx,
        rowIdx,
        mode: 'EDIT',
        row,
        originalRow: row
      }));
    }
  }

  function handleColumnResizeEnd() {
    // This check is needed as double click on the resize handle triggers onPointerMove
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
    // find dragged over row using the pointer position
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
      `:scope > [aria-rowindex="${ariaRowIndex}"] > [aria-colindex="${activePosition.idx + 1}"]`
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

    const { rowIdx, idx } = activePosition;
    const column = columns[idx];
    const sourceRow = rows[rowIdx];
    const updatedRows = [...rows];
    const indexes: number[] = [];
    for (let i = startRowIdx; i < endRowIdx; i++) {
      if (isCellEditable({ rowIdx: i, idx })) {
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

  /**
   * utils
   */
  function getInitialActivePosition(): ActiveCellState {
    return { idx: -1, rowIdx: minRowIdx - 1, mode: 'ACTIVE' };
  }

  /**
   * Returns whether the given position represents a valid cell or row position in the grid.
   * Active bounds: any valid position in the grid
   * Viewport: any valid position in the grid outside of header rows and summary rows
   * Row selection is only allowed in TreeDataGrid
   */
  function validatePosition({ idx, rowIdx }: Position) {
    // check column position
    const isColumnPositionAllColumns = isTreeGrid && idx === -1;
    const isColumnPositionInActiveBounds = idx >= 0 && idx <= maxColIdx;

    // check row position
    const isRowPositionInActiveBounds = rowIdx >= minRowIdx && rowIdx <= maxRowIdx;
    const isRowPositionInViewport = rowIdx >= 0 && rowIdx < rows.length;

    // row status
    const isRowInActiveBounds = isRowPositionInActiveBounds && isColumnPositionAllColumns;
    const isRowInViewport = isRowPositionInViewport && isColumnPositionAllColumns;

    // cell status
    const isCellInActiveBounds = isColumnPositionInActiveBounds && isRowPositionInActiveBounds;
    const isCellInViewport = isColumnPositionInActiveBounds && isRowPositionInViewport;

    // position status
    const isPositionInActiveBounds = isRowInActiveBounds || isCellInActiveBounds;
    const isPositionInViewport = isRowInViewport || isCellInViewport;

    return {
      isPositionInActiveBounds,
      isPositionInViewport,
      isRowInActiveBounds,
      isRowInViewport,
      isCellInActiveBounds,
      isCellInViewport
    };
  }

  function isCellEditable(position: Position): boolean {
    return (
      validatePosition(position).isCellInViewport &&
      isCellEditableUtil(columns[position.idx], rows[position.rowIdx])
    );
  }

  function setPosition(position: Position, options?: SetPositionOptions): void {
    const { isPositionInActiveBounds } = validatePosition(position);
    if (!isPositionInActiveBounds) return;
    commitEditorChanges();

    const samePosition = isSamePosition(activePosition, position);

    if (options?.enableEditor && isCellEditable(position)) {
      const row = rows[position.rowIdx];
      setActivePosition({ ...position, mode: 'EDIT', row, originalRow: row });
    } else if (samePosition) {
      // Avoid re-renders if the selected cell state is the same
      scrollIntoView(getCellToScroll(gridRef.current!));
    } else {
      setShouldFocusPosition(options?.shouldFocus === true);
      setActivePosition({ ...position, mode: 'ACTIVE' });
    }

    if (onActivePositionChange && !samePosition) {
      onActivePositionChange({
        rowIdx: position.rowIdx,
        row: rows[position.rowIdx],
        column: columns[position.idx]
      });
    }
  }

  function selectHeaderCell({ idx, rowIdx }: Position): void {
    setPosition({ rowIdx: minRowIdx + rowIdx - 1, idx });
  }

  function getNextPosition(key: string, ctrlKey: boolean, shiftKey: boolean): Position {
    const { idx, rowIdx } = activePosition;

    switch (key) {
      case 'ArrowUp': {
        const nextRowIdx = rowIdx - 1;
        return {
          // avoid selecting header rows
          idx: idx === -1 && nextRowIdx < -topSummaryRowsCount ? 0 : idx,
          rowIdx: nextRowIdx
        };
      }
      case 'ArrowDown':
        return { idx, rowIdx: rowIdx + 1 };
      case leftKey: {
        const nextIdx = idx - 1;
        return {
          // avoid selecting header rows
          idx: rowIdx < -topSummaryRowsCount && nextIdx < 0 ? 0 : nextIdx,
          rowIdx
        };
      }
      case rightKey:
        return { idx: idx + 1, rowIdx };
      case 'Tab':
        return { idx: idx + (shiftKey ? -1 : 1), rowIdx };
      case 'Home':
        // If row is selected then move focus to the first header row's cell.
        if (activePositionIsRow || ctrlKey) return { idx: 0, rowIdx: minRowIdx };
        return { idx: 0, rowIdx };
      case 'End':
        // If row is selected then move focus to the last row.
        if (activePositionIsRow) return { idx, rowIdx: maxRowIdx };
        return { idx: maxColIdx, rowIdx: ctrlKey ? maxRowIdx : rowIdx };
      case 'PageUp': {
        if (activePosition.rowIdx === minRowIdx) return activePosition;
        const nextRowY = getRowTop(rowIdx) + getRowHeight(rowIdx) - clientHeight;
        return { idx, rowIdx: nextRowY > 0 ? findRowIdx(nextRowY) : 0 };
      }
      case 'PageDown': {
        if (activePosition.rowIdx >= rows.length) return activePosition;
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
      lastFrozenColumnIndex,
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
    if (onFill == null || activePosition.mode === 'EDIT' || !activePositionIsCellInViewport) {
      return;
    }

    const { idx, rowIdx } = activePosition;
    const column = columns[idx];
    if (column.renderEditCell == null || column.editable === false) {
      return;
    }

    const isLastRow = rowIdx === maxRowIdx;
    const columnWidth = getColumnWidth(column);
    const colSpan = column.colSpan?.({ type: 'ROW', row: rows[rowIdx] }) ?? 1;
    const { insetInlineStart, ...style } = getCellStyle(column, colSpan);
    const marginEnd = 'calc(var(--rdg-drag-handle-size) * -0.5 + 1px)';
    const isLastColumn = column.idx + colSpan - 1 === maxColIdx;
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

  function getCellEditor(rowIdx: number) {
    if (
      !activePositionIsCellInViewport ||
      activePosition.rowIdx !== rowIdx ||
      activePosition.mode === 'ACTIVE'
    ) {
      return;
    }

    const { idx, row } = activePosition;
    const column = columns[idx];
    const colSpan = getColSpan(column, lastFrozenColumnIndex, { type: 'ROW', row });
    const closeOnExternalRowChange = column.editorOptions?.closeOnExternalRowChange ?? true;

    const closeEditor = (shouldFocus: boolean) => {
      setShouldFocusPosition(shouldFocus);
      setActivePosition(({ idx, rowIdx }) => ({ idx, rowIdx, mode: 'ACTIVE' }));
    };

    const onRowChange = (row: R, commitChanges: boolean, shouldFocus: boolean) => {
      if (commitChanges) {
        // Prevents two issues when editor is closed by clicking on a different cell
        //
        // Otherwise commitEditorChanges may be called before the cell state is changed to
        // SELECT and this results in onRowChange getting called twice.
        flushSync(() => {
          updateRow(column, activePosition.rowIdx, row);
          closeEditor(shouldFocus);
        });
      } else {
        setActivePosition((position) => ({ ...position, row }));
      }
    };

    if (closeOnExternalRowChange && rows[activePosition.rowIdx] !== activePosition.originalRow) {
      // Discard changes if rows are updated from outside
      closeEditor(false);
    }

    return (
      <EditCell
        key={column.key}
        column={column}
        colSpan={colSpan}
        row={row}
        rowIdx={rowIdx}
        onRowChange={onRowChange}
        closeEditor={closeEditor}
        onKeyDown={onCellKeyDown}
        navigate={navigate}
      />
    );
  }

  function* iterateOverViewportRowIdx() {
    const activeRowIdx = activePosition.rowIdx;

    if (activePositionIsInViewport && activeRowIdx < rowOverscanStartIdx) {
      yield activeRowIdx;
    }
    for (let rowIdx = rowOverscanStartIdx; rowIdx <= rowOverscanEndIdx; rowIdx++) {
      yield rowIdx;
    }
    if (activePositionIsInViewport && activeRowIdx > rowOverscanEndIdx) {
      yield activeRowIdx;
    }
  }

  function getViewportRows() {
    const { idx: activeIdx, rowIdx: activeRowIdx } = activePosition;

    return iterateOverViewportRowIdx()
      .map((rowIdx) => {
        const isActiveRow = rowIdx === activeRowIdx;

        // if the row is outside the viewport then only render its active column, if any
        const iterateOverColumns =
          isActiveRow && (rowIdx < rowOverscanStartIdx || rowIdx > rowOverscanEndIdx)
            ? iterateOverViewportColumnsForRowOutsideOfViewport
            : iterateOverViewportColumnsForRow;

        const row = rows[rowIdx];
        const gridRowStart = headerAndTopSummaryRowsCount + rowIdx + 1;
        let key: K | number = rowIdx;
        let isRowSelected = false;
        if (typeof rowKeyGetter === 'function') {
          key = rowKeyGetter(row);
          isRowSelected = selectedRows?.has(key) ?? false;
        }

        return renderRow(key, {
          // aria-rowindex is 1 based
          'aria-rowindex': headerAndTopSummaryRowsCount + rowIdx + 1,
          'aria-selected': isSelectable ? isRowSelected : undefined,
          rowIdx,
          row,
          iterateOverViewportColumnsForRow: iterateOverColumns,
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
          onRowChange: handleFormatterRowChangeLatest,
          setPosition: setPositionLatest,
          activeCellEditor: getCellEditor(rowIdx),
          isTreeGrid
        });
      })
      .toArray();
  }

  // Reset the positions if the current values are no longer valid. This can happen if a column or row is removed
  if (activePosition.idx > maxColIdx || activePosition.rowIdx > maxRowIdx) {
    setActivePosition(getInitialActivePosition());
    setDraggedOverRowIdx(undefined);
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

  return (
    <div
      role={role}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-description={ariaDescription}
      aria-describedby={ariaDescribedBy}
      aria-multiselectable={isSelectable ? true : undefined}
      aria-colcount={columns.length}
      aria-rowcount={ariaRowCount}
      // Scrollable containers without tabIndex are keyboard focusable in Chrome only if there is no focusable element inside
      // whereas they are always focusable in Firefox. We need to set tabIndex to have a consistent behavior across browsers.
      tabIndex={-1}
      className={classnames(
        rootClassname,
        {
          [viewportDraggingClassname]: isDragging
        },
        className
      )}
      style={{
        ...style,
        // set scrollPadding to correctly scroll to non-sticky cells/rows
        scrollPaddingInlineStart: totalFrozenColumnWidth,
        scrollPaddingBlockStart: headerRowsHeight + topSummaryRowsCount * summaryRowHeight,
        scrollPaddingBlockEnd: bottomSummaryRowsCount * summaryRowHeight,
        gridTemplateColumns,
        gridTemplateRows: templateRows,
        '--rdg-header-row-height': `${headerRowHeight}px`,
        '--rdg-scroll-height': `${scrollHeight}px`,
        ...layoutCssVars
      }}
      dir={direction}
      ref={gridRef}
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
      onCopy={handleCellCopy}
      onPaste={handleCellPaste}
      data-testid={testId}
      data-cy={dataCy}
    >
      <DataGridDefaultRenderersContext value={defaultGridComponents}>
        <HeaderRowSelectionChangeContext value={selectHeaderRowLatest}>
          <HeaderRowSelectionContext value={headerSelectionValue}>
            {Array.from({ length: groupedColumnHeaderRowsCount }, (_, index) => (
              <GroupedColumnHeaderRow
                key={index}
                rowIdx={index + 1}
                level={-groupedColumnHeaderRowsCount + index}
                iterateOverViewportColumnsForRow={iterateOverViewportColumnsForRow}
                activeCellIdx={
                  activePosition.rowIdx === minRowIdx + index ? activePosition.idx : undefined
                }
                setPosition={selectHeaderCellLatest}
              />
            ))}
            <HeaderRow
              headerRowClass={headerRowClass}
              rowIdx={headerRowsCount}
              iterateOverViewportColumnsForRow={iterateOverViewportColumnsForRow}
              onColumnResize={handleColumnResizeLatest}
              onColumnResizeEnd={handleColumnResizeEndLatest}
              onColumnsReorder={onColumnsReorderLastest}
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
                  iterateOverViewportColumnsForRow={iterateOverViewportColumnsForRow}
                  activeCellIdx={isSummaryRowActive ? activePosition.idx : undefined}
                  isTop
                  setPosition={setPositionLatest}
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
                  ? gridHeight - summaryRowHeight * (bottomSummaryRows.length - rowIdx)
                  : undefined;
              const bottom =
                top === undefined
                  ? summaryRowHeight * (bottomSummaryRows.length - 1 - rowIdx)
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
                  iterateOverViewportColumnsForRow={iterateOverViewportColumnsForRow}
                  activeCellIdx={isSummaryRowActive ? activePosition.idx : undefined}
                  isTop={false}
                  setPosition={setPositionLatest}
                  isTreeGrid={isTreeGrid}
                />
              );
            })}
          </>
        )}
      </DataGridDefaultRenderersContext>

      {getDragHandle()}

      {/* render empty cells that span only 1 column so we can safely measure column widths, regardless of colSpan */}
      {renderMeasuringCells(viewportColumns)}

      {scrollToPosition !== null && (
        <ScrollToCell
          scrollToPosition={scrollToPosition}
          setScrollToCellPosition={setScrollToPosition}
          gridRef={gridRef}
        />
      )}
    </div>
  );
}

function getRowToScroll(gridEl: HTMLDivElement) {
  return gridEl.querySelector<HTMLDivElement>(':scope > [role="row"][tabindex="0"]');
}

function getCellToScroll(gridEl: HTMLDivElement) {
  return gridEl.querySelector<HTMLDivElement>(':scope > [role="row"] > [tabindex="0"]');
}

function isSamePosition(p1: Position, p2: Position) {
  return p1.idx === p2.idx && p1.rowIdx === p2.rowIdx;
}

function focusElement(element: HTMLDivElement | null, shouldScroll: boolean) {
  if (element === null) return;

  if (shouldScroll) {
    scrollIntoView(element);
  }

  element.focus({ preventScroll: true });
}

function focusRow(gridEl: HTMLDivElement) {
  focusElement(getRowToScroll(gridEl), true);
}

function focusCell(gridEl: HTMLDivElement, shouldScroll = true) {
  focusElement(getCellToScroll(gridEl), shouldScroll);
}
