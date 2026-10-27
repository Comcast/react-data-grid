import { memo } from 'react';

import { useRovingTabIndex } from './hooks';
import { getCellClassname, getCellStyle } from './utils';
import type { CalculatedColumn, GroupRow } from './types';

interface GroupCellProps<R, SR> {
  id: string;
  groupKey: unknown;
  childRows: readonly R[];
  toggleGroup: (expandedGroupId: unknown) => void;
  isExpanded: boolean;
  column: CalculatedColumn<R, SR>;
  row: GroupRow<R>;
  isCellActive: boolean;
  isGroupByColumn: boolean;
  // Only the group-by column of the row's level renders the group cell and is clickable
  isLevelMatching: boolean;
}

function GroupCell<R, SR>({
  id,
  groupKey,
  childRows,
  isExpanded,
  isCellActive,
  column,
  row,
  isGroupByColumn,
  isLevelMatching,
  toggleGroup: toggleGroupWrapper
}: GroupCellProps<R, SR>) {
  const { tabIndex, childTabIndex, onFocus } = useRovingTabIndex(isCellActive);

  function toggleGroup() {
    toggleGroupWrapper(id);
  }

  return (
    <div
      key={column.key}
      role="gridcell"
      aria-colindex={column.idx + 1}
      aria-selected={isCellActive}
      // tabIndex={undefined} prevents clicks on the cell
      // from stealing focus from the row.
      // onMouseDown={preventDefault} would break mousewheel clicks
      tabIndex={tabIndex === -1 ? undefined : tabIndex}
      className={getCellClassname(column)}
      style={{
        ...getCellStyle(column, 1),
        cursor: isLevelMatching ? 'pointer' : 'default'
      }}
      onClick={isLevelMatching ? toggleGroup : undefined}
      onFocus={onFocus}
    >
      {(!isGroupByColumn || isLevelMatching) &&
        column.renderGroupCell?.({
          groupKey,
          childRows,
          column,
          row,
          isExpanded,
          tabIndex: childTabIndex,
          toggleGroup
        })}
    </div>
  );
}

export default memo(GroupCell) as <R, SR>(props: GroupCellProps<R, SR>) => React.JSX.Element;
