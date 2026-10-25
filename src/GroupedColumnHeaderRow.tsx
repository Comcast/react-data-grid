import { memo } from 'react';

import type { CalculatedColumnParent, MapViewportColumns, Position } from './types';
import GroupedColumnHeaderCell from './GroupedColumnHeaderCell';
import { headerRowClassname } from './HeaderRow';

export interface GroupedColumnHeaderRowProps<R, SR> {
  rowIdx: number;
  level: number;
  mapViewportColumns: MapViewportColumns<R, SR>;
  activeCellIdx: number | undefined;
  setPosition: (position: Position) => void;
}

function GroupedColumnHeaderRow<R, SR>({
  rowIdx,
  level,
  mapViewportColumns,
  activeCellIdx,
  setPosition
}: GroupedColumnHeaderRowProps<R, SR>) {
  const renderedParents = new Set<CalculatedColumnParent<R, SR>>();

  const cells = mapViewportColumns(activeCellIdx, undefined, (column, isCellActive) => {
    if (column.parent === undefined) return null;

    let { parent } = column;

    while (parent.level > level) {
      if (parent.parent === undefined) break;
      ({ parent } = parent);
    }

    if (parent.level !== level || renderedParents.has(parent)) return null;

    renderedParents.add(parent);
    return (
      <GroupedColumnHeaderCell<R, SR>
        key={parent.idx}
        column={parent}
        rowIdx={rowIdx}
        isCellActive={isCellActive}
        setPosition={setPosition}
      />
    );
  });

  return (
    <div
      role="row"
      aria-rowindex={rowIdx} // aria-rowindex is 1-based
      className={headerRowClassname}
    >
      {cells}
    </div>
  );
}

export default memo(GroupedColumnHeaderRow) as <R, SR>(
  props: GroupedColumnHeaderRowProps<R, SR>
) => React.JSX.Element;
