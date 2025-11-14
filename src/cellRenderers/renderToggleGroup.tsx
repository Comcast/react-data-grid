import { css } from '@nstep/ecis';

import type { RenderGroupCellProps } from '../types';

const groupCellContent = css`
  @layer rdg.GroupCellContent {
    outline: none;
  }
`;

const groupCellContentClassname = `rdg-group-cell-content ${groupCellContent}`;

const caret = css`
  @layer rdg.GroupCellCaret {
    margin-inline-start: 4px;
    stroke: currentColor;
    stroke-width: 1.5px;
    fill: transparent;
    vertical-align: middle;

    > path {
      transition: d 0.1s;
    }
  }
`;

const caretClassname = `rdg-caret ${caret}`;

export function renderToggleGroup<R, SR>(props: RenderGroupCellProps<R, SR>) {
  return <ToggleGroup {...props} />;
}

export function ToggleGroup<R, SR>({
  groupKey,
  isExpanded,
  tabIndex,
  toggleGroup
}: RenderGroupCellProps<R, SR>) {
  function handleKeyDown({ key }: React.KeyboardEvent<HTMLSpanElement>) {
    if (key === 'Enter') {
      toggleGroup();
    }
  }

  const d = isExpanded ? 'M1 1 L 7 7 L 13 1' : 'M1 7 L 7 1 L 13 7';

  return (
    <span className={groupCellContentClassname} tabIndex={tabIndex} onKeyDown={handleKeyDown}>
      {groupKey as string}
      <svg viewBox="0 0 14 8" width="14" height="8" className={caretClassname} aria-hidden>
        <path d={d} />
      </svg>
    </span>
  );
}
