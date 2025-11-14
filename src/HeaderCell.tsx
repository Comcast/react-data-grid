import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { css } from '@nstep/ecis';

import { useRovingTabIndex } from './hooks';
import {
  clampColumnWidth,
  getCellClassname,
  getCellStyle,
  getHeaderCellRowSpan,
  getHeaderCellStyle,
  getLeftRightKey,
  isCtrlKeyHeldDown,
  stopPropagation
} from './utils';
import type { CalculatedColumn, SortColumn } from './types';
import type { HeaderRowProps } from './HeaderRow';

const cellSortableClassname = css`
  @layer rdg.HeaderCell {
    cursor: pointer;
  }
`;

const cellResizable = css`
  @layer rdg.HeaderCell {
    touch-action: none;
  }
`;

const cellResizableClassname = `rdg-cell-resizable ${cellResizable}`;

const resizeHandle = css`
  @layer rdg.HeaderCell {
    cursor: col-resize;
    position: absolute;
    inset-block-start: 0;
    inset-inline-end: 0;
    inset-block-end: 0;
    inline-size: 10px;
  }
`;

const resizeHandleClassname = `rdg-resize-handle ${resizeHandle}`;

const cellDraggableClassname = 'rdg-cell-draggable';

const cellDragging = css`
  @layer rdg.HeaderCell {
    background-color: var(--rdg-header-draggable-background-color);
  }
`;

const cellDraggingClassname = `rdg-cell-dragging ${cellDragging}`;

const cellOver = css`
  @layer rdg.HeaderCell {
    background-color: var(--rdg-header-draggable-background-color);
  }
`;

const cellOverClassname = `rdg-cell-drag-over ${cellOver}`;

const dragImageClassname = css`
  @layer rdg.HeaderCell {
    border-radius: 4px;
    width: fit-content;
    outline: 2px solid hsl(207, 100%, 50%);
    outline-offset: -2px;
  }
`;

type SharedHeaderRowProps<R, SR> = Pick<
  HeaderRowProps<R, SR, React.Key>,
  | 'sortColumns'
  | 'onSortColumnsChange'
  | 'selectCell'
  | 'onColumnResize'
  | 'onColumnResizeEnd'
  | 'shouldFocusGrid'
  | 'direction'
  | 'onColumnsReorder'
>;

export interface HeaderCellProps<R, SR> extends SharedHeaderRowProps<R, SR> {
  column: CalculatedColumn<R, SR>;
  colSpan: number | undefined;
  rowIdx: number;
  isCellSelected: boolean;
  draggedColumnKey: string | undefined;
  setDraggedColumnKey: (draggedColumnKey: string | undefined) => void;
}

export default function HeaderCell<R, SR>({
  column,
  colSpan,
  rowIdx,
  isCellSelected,
  onColumnResize,
  onColumnResizeEnd,
  onColumnsReorder,
  sortColumns,
  onSortColumnsChange,
  selectCell,
  shouldFocusGrid,
  direction,
  draggedColumnKey,
  setDraggedColumnKey
}: HeaderCellProps<R, SR>) {
  const [isOver, setIsOver] = useState(false);
  const dragImageRef = useRef<HTMLDivElement>(null);
  const isDragging = draggedColumnKey === column.key;
  const rowSpan = getHeaderCellRowSpan(column, rowIdx);
  // set the tabIndex to 0 when there is no selected cell so grid can receive focus
  const { tabIndex, childTabIndex, onFocus } = useRovingTabIndex(shouldFocusGrid || isCellSelected);
  const sortIndex = sortColumns?.findIndex((sort) => sort.columnKey === column.key);
  const sortColumn =
    sortIndex !== undefined && sortIndex > -1 ? sortColumns![sortIndex] : undefined;
  const sortDirection = sortColumn?.direction;
  const priority = sortColumn !== undefined && sortColumns!.length > 1 ? sortIndex! + 1 : undefined;
  const ariaSort =
    sortDirection && !priority ? (sortDirection === 'ASC' ? 'ascending' : 'descending') : undefined;
  const { sortable, resizable, draggable } = column;

  const className = getCellClassname(column, column.headerCellClass, {
    [cellSortableClassname]: sortable,
    [cellResizableClassname]: resizable,
    [cellDraggableClassname]: draggable,
    [cellDraggingClassname]: isDragging,
    [cellOverClassname]: isOver
  });

  function onSort(ctrlClick: boolean) {
    if (onSortColumnsChange == null) return;
    const { sortDescendingFirst } = column;
    if (sortColumn === undefined) {
      // not currently sorted
      const nextSort: SortColumn = {
        columnKey: column.key,
        direction: sortDescendingFirst ? 'DESC' : 'ASC'
      };
      onSortColumnsChange(sortColumns && ctrlClick ? [...sortColumns, nextSort] : [nextSort]);
    } else {
      let nextSortColumn: SortColumn | undefined;
      if (
        (sortDescendingFirst === true && sortDirection === 'DESC') ||
        (sortDescendingFirst !== true && sortDirection === 'ASC')
      ) {
        nextSortColumn = {
          columnKey: column.key,
          direction: sortDirection === 'ASC' ? 'DESC' : 'ASC'
        };
      }
      if (ctrlClick) {
        const nextSortColumns = [...sortColumns!];
        if (nextSortColumn) {
          // swap direction
          nextSortColumns[sortIndex!] = nextSortColumn;
        } else {
          // remove sort
          nextSortColumns.splice(sortIndex!, 1);
        }
        onSortColumnsChange(nextSortColumns);
      } else {
        onSortColumnsChange(nextSortColumn ? [nextSortColumn] : []);
      }
    }
  }

  function handleFocus(event: React.FocusEvent<HTMLDivElement>) {
    onFocus?.(event);
    if (shouldFocusGrid) {
      // Select the first header cell if there is no selected cell
      selectCell({ idx: 0, rowIdx });
    }
  }

  function onMouseDown() {
    selectCell({ idx: column.idx, rowIdx });
  }

  function onClick(event: React.MouseEvent<HTMLSpanElement>) {
    if (sortable) {
      onSort(event.ctrlKey || event.metaKey);
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLSpanElement>) {
    const { key } = event;
    if (sortable && (key === ' ' || key === 'Enter')) {
      // prevent scrolling
      event.preventDefault();
      onSort(event.ctrlKey || event.metaKey);
    } else if (
      resizable &&
      isCtrlKeyHeldDown(event) &&
      (key === 'ArrowLeft' || key === 'ArrowRight')
    ) {
      // prevent navigation
      // TODO: check if we can use `preventDefault` instead
      event.stopPropagation();
      const { width } = event.currentTarget.getBoundingClientRect();
      const { leftKey } = getLeftRightKey(direction);
      const offset = key === leftKey ? -10 : 10;
      const newWidth = clampColumnWidth(width + offset, column);
      if (newWidth !== width) {
        onColumnResize(column, newWidth);
      }
    }
  }

  function onDragStart(event: React.DragEvent<HTMLDivElement>) {
    // need flushSync to make sure the drag image is rendered before the drag starts
    flushSync(() => {
      setDraggedColumnKey(column.key);
    });
    event.dataTransfer.setDragImage(dragImageRef.current!, 0, 0);
    event.dataTransfer.dropEffect = 'move';
  }

  function onDragEnd() {
    setDraggedColumnKey(undefined);
  }

  function onDragOver(event: React.DragEvent<HTMLDivElement>) {
    // prevent default to allow drop
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    setIsOver(false);
    // prevent the browser from redirecting in some cases
    event.preventDefault();
    onColumnsReorder?.(draggedColumnKey!, column.key);
  }

  function onDragEnter(event: React.DragEvent<HTMLDivElement>) {
    if (isEventPertinent(event)) {
      setIsOver(true);
    }
  }

  function onDragLeave(event: React.DragEvent<HTMLDivElement>) {
    if (isEventPertinent(event)) {
      setIsOver(false);
    }
  }

  let dragTargetProps: React.ComponentProps<'div'> | undefined;
  let dropTargetProps: React.ComponentProps<'div'> | undefined;
  if (draggable) {
    dragTargetProps = {
      draggable: true,
      onDragStart,
      onDragEnd
    };

    if (draggedColumnKey !== undefined && draggedColumnKey !== column.key) {
      dropTargetProps = {
        onDragOver,
        onDragEnter,
        onDragLeave,
        onDrop
      };
    }
  }

  const style: React.CSSProperties = {
    ...getHeaderCellStyle(column, rowIdx, rowSpan),
    ...getCellStyle(column, colSpan)
  };

  const content = column.renderHeaderCell({
    column,
    sortDirection,
    priority,
    tabIndex: childTabIndex
  });

  return (
    <>
      {isDragging && (
        <div
          ref={dragImageRef}
          style={style}
          className={getCellClassname(column, column.headerCellClass, dragImageClassname)}
        >
          {content}
        </div>
      )}
      <div
        role="columnheader"
        aria-colindex={column.idx + 1}
        aria-colspan={colSpan}
        aria-rowspan={rowSpan}
        aria-selected={isCellSelected}
        aria-sort={ariaSort}
        tabIndex={tabIndex}
        className={className}
        style={style}
        onMouseDown={onMouseDown}
        onFocus={handleFocus}
        onClick={onClick}
        onKeyDown={onKeyDown}
        {...dragTargetProps}
        {...dropTargetProps}
      >
        {content}

        {resizable && (
          <ResizeHandle
            direction={direction}
            column={column}
            onColumnResize={onColumnResize}
            onColumnResizeEnd={onColumnResizeEnd}
          />
        )}
      </div>
    </>
  );
}

type ResizeHandleProps<R, SR> = Pick<
  HeaderCellProps<R, SR>,
  'direction' | 'column' | 'onColumnResize' | 'onColumnResizeEnd'
>;

function ResizeHandle<R, SR>({
  direction,
  column,
  onColumnResize,
  onColumnResizeEnd
}: ResizeHandleProps<R, SR>) {
  const resizingOffsetRef = useRef<number>(undefined);
  const isRtl = direction === 'rtl';

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.buttons !== 1) {
      return;
    }

    // Fix column resizing on a draggable column in FF
    event.preventDefault();

    const { currentTarget, pointerId } = event;
    currentTarget.setPointerCapture(pointerId);
    const headerCell = currentTarget.parentElement!;
    const { right, left } = headerCell.getBoundingClientRect();
    resizingOffsetRef.current = isRtl ? event.clientX - left : right - event.clientX;
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const offset = resizingOffsetRef.current;
    if (offset === undefined) return;
    const { width, right, left } = event.currentTarget.parentElement!.getBoundingClientRect();
    let newWidth = isRtl ? right + offset - event.clientX : event.clientX + offset - left;
    newWidth = clampColumnWidth(newWidth, column);
    if (width > 0 && newWidth !== width) {
      onColumnResize(column, newWidth);
    }
  }

  function onLostPointerCapture() {
    onColumnResizeEnd();
    resizingOffsetRef.current = undefined;
  }

  function onDoubleClick() {
    onColumnResize(column, 'max-content');
  }

  return (
    <div
      aria-hidden
      className={resizeHandleClassname}
      onClick={stopPropagation}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      // we are not using pointerup because it does not fire in some cases
      // pointer down -> alt+tab -> pointer up over another window -> pointerup event not fired
      onLostPointerCapture={onLostPointerCapture}
      onDoubleClick={onDoubleClick}
    />
  );
}

// only accept pertinent drag events:
// - ignore drag events going from the container to an element inside the container
// - ignore drag events going from an element inside the container to the container
function isEventPertinent(event: React.DragEvent) {
  const relatedTarget = event.relatedTarget as HTMLElement | null;

  return !event.currentTarget.contains(relatedTarget);
}
