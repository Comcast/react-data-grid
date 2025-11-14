import { memo, type MouseEvent } from 'react';
import { css } from '@nstep/ecis';

import { useRovingTabIndex } from './hooks';
import { createCellEvent, getCellClassname, getCellStyle, isCellEditableUtil } from './utils';
import type { CellMouseEventHandler, CellRendererProps } from './types';

const cellDraggedOver = css`
  @layer rdg.Cell {
    background-color: #ccccff;
  }
`;

const cellDraggedOverClassname = `rdg-cell-dragged-over ${cellDraggedOver}`;

function Cell<R, SR>({
  column,
  colSpan,
  isCellSelected,
  isDraggedOver,
  row,
  rowIdx,
  className,
  onMouseDown,
  onCellMouseDown,
  onClick,
  onCellClick,
  onDoubleClick,
  onCellDoubleClick,
  onContextMenu,
  onCellContextMenu,
  onRowChange,
  selectCell,
  style,
  ...props
}: CellRendererProps<R, SR>) {
  const { tabIndex, childTabIndex, onFocus } = useRovingTabIndex(isCellSelected);

  const { cellClass } = column;
  className = getCellClassname(
    column,
    {
      [cellDraggedOverClassname]: isDraggedOver
    },
    typeof cellClass === 'function' ? cellClass(row) : cellClass,
    className
  );
  const isEditable = isCellEditableUtil(column, row);

  function selectCellWrapper(enableEditor?: boolean) {
    selectCell({ rowIdx, idx: column.idx }, { enableEditor });
  }

  function handleMouseEvent(
    event: React.MouseEvent<HTMLDivElement>,
    eventHandler?: CellMouseEventHandler<R, SR>
  ) {
    let eventHandled = false;
    if (eventHandler) {
      const cellEvent = createCellEvent(event);
      eventHandler({ rowIdx, row, column, selectCell: selectCellWrapper }, cellEvent);
      eventHandled = cellEvent.isGridDefaultPrevented();
    }
    return eventHandled;
  }

  function handleMouseDown(event: MouseEvent<HTMLDivElement>) {
    onMouseDown?.(event);
    if (!handleMouseEvent(event, onCellMouseDown)) {
      // select cell if the event is not prevented
      selectCellWrapper();
    }
  }

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    onClick?.(event);
    handleMouseEvent(event, onCellClick);
  }

  function handleDoubleClick(event: MouseEvent<HTMLDivElement>) {
    onDoubleClick?.(event);
    if (!handleMouseEvent(event, onCellDoubleClick)) {
      // go into edit mode if the event is not prevented
      selectCellWrapper(true);
    }
  }

  function handleContextMenu(event: MouseEvent<HTMLDivElement>) {
    onContextMenu?.(event);
    handleMouseEvent(event, onCellContextMenu);
  }

  function handleRowChange(newRow: R) {
    onRowChange(column, newRow);
  }

  return (
    <div
      role="gridcell"
      aria-colindex={column.idx + 1} // aria-colindex is 1-based
      aria-colspan={colSpan}
      aria-selected={isCellSelected}
      aria-readonly={!isEditable || undefined}
      tabIndex={tabIndex}
      className={className}
      style={{
        ...getCellStyle(column, colSpan),
        ...style
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onFocus={onFocus}
      {...props}
    >
      {column.renderCell({
        column,
        row,
        rowIdx,
        isCellEditable: isEditable,
        tabIndex: childTabIndex,
        onRowChange: handleRowChange
      })}
    </div>
  );
}

const CellComponent = memo(Cell) as <R, SR>(props: CellRendererProps<R, SR>) => React.JSX.Element;

export default CellComponent;

export function defaultRenderCell<R, SR>(key: React.Key, props: CellRendererProps<R, SR>) {
  return <CellComponent key={key} {...props} />;
}
