import { css } from '@nstep/ecis';

import { cell } from './cell';
import { bottomSummaryRowClassname, row, topSummaryRowClassname } from './row';

const root = css`
  @layer rdg.Defaults {
    *,
    *::before,
    *::after {
      box-sizing: inherit;
    }
  }

  @layer rdg.Root {
    --rdg-selection-width: 2px;
    --rdg-selection-color: hsl(207, 75%, 66%);
    --rdg-font-size: 14px;
    --rdg-cell-frozen-box-shadow: 2px 0 5px -2px rgba(136, 136, 136, 0.3);
    --rdg-border-width: 1px;
    --rdg-summary-border-width: calc(var(--rdg-border-width) * 2);
    --rdg-color: light-dark(#000, #ddd);
    --rdg-border-color: light-dark(#ddd, #444);
    --rdg-summary-border-color: light-dark(#aaa, #555);
    --rdg-background-color: light-dark(hsl(0deg 0% 100%), hsl(0deg 0% 13%));
    --rdg-header-background-color: light-dark(hsl(0deg 0% 97.5%), hsl(0deg 0% 10.5%));
    --rdg-header-draggable-background-color: light-dark(hsl(0deg 0% 90.5%), hsl(0deg 0% 17.5%));
    --rdg-row-hover-background-color: light-dark(hsl(0deg 0% 96%), hsl(0deg 0% 9%));
    --rdg-row-selected-background-color: light-dark(hsl(207deg 76% 92%), hsl(207deg 76% 42%));
    --rdg-row-selected-hover-background-color: light-dark(hsl(207deg 76% 88%), hsl(207deg 76% 38%));
    --rdg-checkbox-focus-color: hsl(207deg 100% 69%);

    &.rdg-dark {
      --rdg-color-scheme: dark;
    }

    &.rdg-light {
      --rdg-color-scheme: light;
    }

    color-scheme: var(--rdg-color-scheme, light dark);

    &:dir(rtl) {
      --rdg-cell-frozen-box-shadow: -2px 0 5px -2px rgba(136, 136, 136, 0.3);
    }

    display: grid;

    accent-color: light-dark(hsl(207deg 100% 29%), hsl(207deg 100% 79%));

    /* https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context */
    /* We set a stacking context so internal elements don't render on top of external elements. */
    /* size containment is not used as it could break "width: min-content" for example, and the grid would infinitely resize on Chromium browsers */
    contain: content;
    content-visibility: auto;
    block-size: 350px;
    border: 1px solid var(--rdg-border-color);
    box-sizing: border-box;
    overflow: auto;
    background-color: var(--rdg-background-color);
    color: var(--rdg-color);
    font-size: var(--rdg-font-size);

    /* needed on Firefox to fix scrollbars */
    &::before {
      content: '';
      grid-column: 1/-1;
      grid-row: 1/-1;
    }

    > :nth-last-child(1 of .${topSummaryRowClassname}) {
      > .${cell} {
        border-block-end: var(--rdg-summary-border-width) solid var(--rdg-summary-border-color);
      }
    }

    > :nth-child(1 of .${bottomSummaryRowClassname}) {
      > .${cell} {
        border-block-start: var(--rdg-summary-border-width) solid var(--rdg-summary-border-color);
      }
    }
  }
`;

export const rootClassname = `rdg ${root}`;

const viewportDragging = css`
  @layer rdg.Root {
    user-select: none;

    & .${row} {
      cursor: move;
    }
  }
`;

export const viewportDraggingClassname = `rdg-viewport-dragging ${viewportDragging}`;

export const focusSinkClassname = css`
  @layer rdg.FocusSink {
    grid-column: 1/-1;
    pointer-events: none;
    /* Should have a higher value than 1 to show up above regular frozen cells */
    z-index: 1;
  }
`;

export const focusSinkHeaderAndSummaryClassname = css`
  @layer rdg.FocusSink {
    /* Should have a higher value than 3 to show up above header and summary rows */
    z-index: 3;
  }
`;
