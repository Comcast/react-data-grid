import { memo, useMemo } from 'react';

import { RowSelectionContext, type RowSelectionContextValue } from './hooks';
import { classnames, getRowSpan, isRowSpanCovered } from './utils';
import type { RenderRowProps } from './types';
import { useDefaultRenderers } from './DataGridDefaultRenderersContext';
import { rowClassname, rowActiveClassname } from './style/row';

function Row<R, SR>({
  className,
  rowIdx,
  gridRowStart,
  activeCellIdx,
  isRowSelectionDisabled,
  isRowSelected,
  draggedOverCellIdx,
  row,
  iterateOverViewportColumnsForRow,
  activeCellEditor,
  isTreeGrid,
  onCellMouseDown,
  onCellClick,
  onCellDoubleClick,
  onCellContextMenu,
  rowClass,
  onRowChange,
  setActivePosition,
  style,
  ...props
}: RenderRowProps<R, SR>) {
  const renderCell = useDefaultRenderers<R, SR>()!.renderCell!;

  const isPositionOnRow = activeCellIdx === -1;

  className = classnames(
    rowClassname,
    `rdg-row-${rowIdx % 2 === 0 ? 'even' : 'odd'}`,
    isPositionOnRow && rowActiveClassname,
    rowClass?.(row, rowIdx),
    className
  );

  // Track the largest rowSpan among this row's master cells so the row's own grid track
  // can be stretched to match via gridRowEnd below — otherwise the `subgrid` row template
  // only exposes a single track and a cell's `grid-row-end: span N` has nowhere to span into.
  let maxRowSpan = 1;

  const cells = iterateOverViewportColumnsForRow(activeCellIdx, { type: 'ROW', row })
    .filter(([column]) => !isRowSpanCovered(column, { type: 'ROW', row }))
    .map(([column, isCellActive, colSpan]) => {
      const rowSpan = getRowSpan(column, { type: 'ROW', row });
      if (rowSpan !== undefined && rowSpan > maxRowSpan) {
        maxRowSpan = rowSpan;
      }

      if (isCellActive && activeCellEditor) {
        return activeCellEditor;
      }

      return renderCell(column.key, {
        column,
        colSpan,
        rowSpan,
        row,
        rowIdx,
        isDraggedOver: draggedOverCellIdx === column.idx,
        isCellActive,
        onCellMouseDown,
        onCellClick,
        onCellDoubleClick,
        onCellContextMenu,
        onRowChange,
        setActivePosition
      });
    })
    .toArray();

  const selectionValue = useMemo(
    (): RowSelectionContextValue => ({ isRowSelected, isRowSelectionDisabled }),
    [isRowSelectionDisabled, isRowSelected]
  );

  return (
    <RowSelectionContext value={selectionValue}>
      <div
        role="row"
        tabIndex={isTreeGrid ? (isPositionOnRow ? 0 : -1) : undefined}
        className={className}
        style={{
          gridRowStart,
          gridRowEnd: maxRowSpan > 1 ? `span ${maxRowSpan}` : undefined,
          ...style
        }}
        {...props}
      >
        {cells}
      </div>
    </RowSelectionContext>
  );
}

const RowComponent = memo(Row) as <R, SR>(props: RenderRowProps<R, SR>) => React.JSX.Element;

export default RowComponent;

export function defaultRenderRow<R, SR>(key: React.Key, props: RenderRowProps<R, SR>) {
  return <RowComponent key={key} {...props} />;
}
