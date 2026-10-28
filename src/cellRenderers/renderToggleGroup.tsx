import { css } from 'ecij';

import type { RenderGroupCellContentProps } from '../types';

const groupCellContent = css`
  @layer rdg.GroupCellContent {
    /* reset the native button styles, the cell renders the focus outline */
    all: unset;
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

    @media (prefers-reduced-motion: no-preference) {
      > path {
        transition: d 0.1s;
      }
    }
  }
`;

const caretClassname = `rdg-caret ${caret}`;

function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
  // Shift + Space selects the row, so prevent it from activating the button
  if (event.key === ' ' && event.shiftKey) {
    event.preventDefault();
  }
}

export function renderToggleGroup<R, SR>(props: RenderGroupCellContentProps<R, SR>) {
  return <ToggleGroup {...props} />;
}

export function ToggleGroup<R, SR>({
  groupKey,
  isExpanded,
  tabIndex,
  toggleGroup
}: RenderGroupCellContentProps<R, SR>) {
  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    // the group cell also toggles the group on click
    event.stopPropagation();
    toggleGroup();
  }

  const d = isExpanded ? 'M1 1 L 7 7 L 13 1' : 'M1 7 L 7 1 L 13 7';

  return (
    <button
      type="button"
      className={groupCellContentClassname}
      tabIndex={tabIndex}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {groupKey as string}
      <svg viewBox="0 0 14 8" width="14" height="8" className={caretClassname} aria-hidden>
        <path d={d} />
      </svg>
    </button>
  );
}
