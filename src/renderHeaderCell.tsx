import { css } from 'ecij';

import type { RenderHeaderCellContentProps } from './types';
import { useDefaultRenderers } from './DataGridDefaultRenderersContext';

const headerSortCellClassname = css`
  @layer rdg.SortableHeaderCell {
    display: flex;
  }
`;

const headerSortName = css`
  @layer rdg.SortableHeaderCellName {
    flex-grow: 1;
    overflow: clip;
    text-overflow: ellipsis;
  }
`;

const headerSortNameClassname = `rdg-header-sort-name ${headerSortName}`;

export function renderHeaderCell<R, SR>({
  column,
  sortDirection,
  priority
}: RenderHeaderCellContentProps<R, SR>) {
  if (!column.sortable) return column.name;

  return <SortableHeaderCell column={column} sortDirection={sortDirection} priority={priority} />;
}

type SortableHeaderCellProps<R, SR> = Pick<
  RenderHeaderCellContentProps<R, SR>,
  'column' | 'sortDirection' | 'priority'
>;

function SortableHeaderCell<R, SR>({
  column,
  sortDirection,
  priority
}: SortableHeaderCellProps<R, SR>) {
  const renderSortStatus = useDefaultRenderers<R, SR>()!.renderSortStatus!;

  return (
    <span className={headerSortCellClassname}>
      <span className={headerSortNameClassname}>{column.name}</span>
      <span>{renderSortStatus({ sortDirection, priority })}</span>
    </span>
  );
}
