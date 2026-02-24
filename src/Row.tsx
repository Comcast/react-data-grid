import { memo, useMemo } from 'react';

import { RowSelectionContext, type RowSelectionContextValue } from './hooks';
import { classnames } from './utils';
import type { RenderRowProps } from './types';
import { useDefaultRenderers } from './DataGridDefaultRenderersContext';
import { rowClassname, rowSelectedClassname } from './style/row';

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
  setPosition,
  style,
  ...props
}: RenderRowProps<R, SR>) {
  const renderCell = useDefaultRenderers<R, SR>()!.renderCell!;

  const isPositionOnRow = activeCellIdx === -1;

  className = classnames(
    rowClassname,
    `rdg-row-${rowIdx % 2 === 0 ? 'even' : 'odd'}`,
    isPositionOnRow && rowSelectedClassname,
    rowClass?.(row, rowIdx),
    className
  );

  const cells = iterateOverViewportColumnsForRow(activeCellIdx, { type: 'ROW', row })
    .map(([column, colSpan]) => {
      const { idx } = column;
      const isCellActive = activeCellIdx === idx;

      if (isCellActive && activeCellEditor) {
        return activeCellEditor;
      }

      return renderCell(column.key, {
        column,
        colSpan,
        row,
        rowIdx,
        isDraggedOver: draggedOverCellIdx === idx,
        isCellActive,
        onCellMouseDown,
        onCellClick,
        onCellDoubleClick,
        onCellContextMenu,
        onRowChange,
        setPosition
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
