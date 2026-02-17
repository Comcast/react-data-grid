import { memo } from 'react';

import type { CalculatedColumn, CalculatedColumnParent, Position } from './types';
import GroupedColumnHeaderCell from './GroupedColumnHeaderCell';
import { headerRowClassname } from './HeaderRow';

export interface GroupedColumnHeaderRowProps<R, SR> {
  rowIdx: number;
  level: number;
  columns: readonly CalculatedColumn<R, SR>[];
  selectCell: (position: Position) => void;
  selectedCellIdx: number | undefined;
}

function GroupedColumnHeaderRow<R, SR>({
  rowIdx,
  level,
  columns,
  selectedCellIdx,
  selectCell
}: GroupedColumnHeaderRowProps<R, SR>) {
  const cells = [];
  const renderedParents = new Set<CalculatedColumnParent<R, SR>>();

  for (const column of columns) {
    let { parent } = column;

    if (parent === undefined) continue;

    while (parent.level > level) {
      if (parent.parent === undefined) break;
      parent = parent.parent;
    }

    if (parent.level === level && !renderedParents.has(parent)) {
      renderedParents.add(parent);
      const { idx } = parent;
      cells.push(
        <GroupedColumnHeaderCell<R, SR>
          key={idx}
          column={parent}
          rowIdx={rowIdx}
          isCellSelected={selectedCellIdx === idx}
          selectCell={selectCell}
        />
      );
    }
  }

  return (
    <div
      role="row"
      aria-rowindex={rowIdx} // aria-rowindex is 1 based
      className={headerRowClassname}
    >
      {cells}
    </div>
  );
}

export default memo(GroupedColumnHeaderRow) as <R, SR>(
  props: GroupedColumnHeaderRowProps<R, SR>
) => React.JSX.Element;
