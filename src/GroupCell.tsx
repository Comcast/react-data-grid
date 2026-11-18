import { memo } from 'react';

import { useRovingTabIndex } from './hooks';
import { getCellClassname, getCellStyle } from './utils';
import type { CalculatedColumn, RowGroup } from './types';

interface GroupCellProps<R, SR> {
  column: CalculatedColumn<R, SR>;
  row: RowGroup<R>;
  isCellActive: boolean;
  isGroupByColumn: boolean;
  // Only the group-by column of the row's level renders the group cell and is clickable
  isLevelMatching: boolean;
  toggleGroup: (expandedGroupId: string) => void;
}

function GroupCell<R, SR>({
  column,
  row,
  isCellActive,
  isGroupByColumn,
  isLevelMatching,
  toggleGroup: toggleGroupWrapper
}: GroupCellProps<R, SR>) {
  const { tabIndex, childTabIndex, onFocus } = useRovingTabIndex(isCellActive);

  function toggleGroup() {
    toggleGroupWrapper(row.id);
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
          column,
          row,
          tabIndex: childTabIndex,
          toggleGroup
        })}
    </div>
  );
}

export default memo(GroupCell) as <R, SR>(props: GroupCellProps<R, SR>) => React.JSX.Element;
