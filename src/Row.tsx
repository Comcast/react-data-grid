import { memo, useMemo } from 'react';

import { RowSelectionContext, useLatestFunc, type RowSelectionContextValue } from './hooks';
import { classnames, getColSpan, getRowStyle } from './utils';
import type { CalculatedColumn, RenderRowProps } from './types';
import { useDefaultRenderers } from './DataGridDefaultRenderersContext';
import { rowClassname, rowSelectedClassname } from './style/row';

function Row<R, SR>({
  className,
  rowIdx,
  gridRowStart,
  selectedCellIdx,
  isRowSelectionDisabled,
  isRowSelected,
  draggedOverCellIdx,
  lastFrozenColumnIndex,
  row,
  viewportColumns,
  selectedCellEditor,
  onCellMouseDown,
  onCellClick,
  onCellDoubleClick,
  onCellContextMenu,
  rowClass,
  onRowChange,
  selectCell,
  style,
  ...props
}: RenderRowProps<R, SR>) {
  const renderCell = useDefaultRenderers<R, SR>()!.renderCell!;

  const handleRowChange = useLatestFunc((column: CalculatedColumn<R, SR>, newRow: R) => {
    onRowChange(column, rowIdx, newRow);
  });

  className = classnames(
    rowClassname,
    `rdg-row-${rowIdx % 2 === 0 ? 'even' : 'odd'}`,
    {
      [rowSelectedClassname]: selectedCellIdx === -1
    },
    rowClass?.(row, rowIdx),
    className
  );

  const cells = [];

  for (let index = 0; index < viewportColumns.length; index++) {
    const column = viewportColumns[index];
    const { idx } = column;
    const colSpan = getColSpan(column, lastFrozenColumnIndex, { type: 'ROW', row });
    if (colSpan !== undefined) {
      index += colSpan - 1;
    }

    const isCellSelected = selectedCellIdx === idx;

    if (isCellSelected && selectedCellEditor) {
      cells.push(selectedCellEditor);
    } else {
      cells.push(
        renderCell(column.key, {
          column,
          colSpan,
          row,
          rowIdx,
          isDraggedOver: draggedOverCellIdx === idx,
          isCellSelected,
          onCellMouseDown,
          onCellClick,
          onCellDoubleClick,
          onCellContextMenu,
          onRowChange: handleRowChange,
          selectCell
        })
      );
    }
  }

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
          ...getRowStyle(gridRowStart),
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
