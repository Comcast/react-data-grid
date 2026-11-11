import { memo, useMemo } from 'react';

import { RowSelectionContext, type RowSelectionContextValue } from './hooks';
import { classnames } from './utils';
import type { RenderRowProps } from './types';
import { useRenderers } from './DataGridRenderersContext';
import { rowClassname } from './style/row';

function Row<R, SR>({
  className,
  rowIdx,
  gridRowStart,
  activeCellIdx,
  isRowSelectionDisabled,
  isRowSelected,
  draggedOverCellIdx,
  row,
  mapViewportColumns,
  activeCellEditor,
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
  const renderCell = useRenderers<R, SR>()!.renderCell!;

  className = classnames(
    rowClassname,
    `rdg-row-${rowIdx % 2 === 0 ? 'even' : 'odd'}`,
    rowClass?.(row, rowIdx),
    className
  );

  const cells = mapViewportColumns(
    activeCellIdx,
    { type: 'ROW', row },
    (column, isCellActive, colSpan) => {
      if (isCellActive && activeCellEditor) {
        return activeCellEditor;
      }

      return renderCell(column.key, {
        column,
        colSpan,
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
    }
  );

  const selectionValue = useMemo(
    (): RowSelectionContextValue => ({ isRowSelected, isRowSelectionDisabled }),
    [isRowSelectionDisabled, isRowSelected]
  );

  return (
    <RowSelectionContext value={selectionValue}>
      <div
        role="row"
        className={className}
        style={{
          gridRowStart,
          ...style
        }}
        {...props}
      >
        {cells}
      </div>
    </RowSelectionContext>
  );
}

const MemoRow = memo(Row) as <R, SR>(props: RenderRowProps<R, SR>) => React.JSX.Element;

export { MemoRow as Row };

export function defaultRenderRow<R, SR>(key: React.Key, props: RenderRowProps<R, SR>) {
  return <MemoRow key={key} {...props} />;
}
