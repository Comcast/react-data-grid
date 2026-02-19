import { css } from 'ecij';

import { cellFrozen } from './cell';

export const row = css`
  @layer rdg.Row {
    display: grid;
    grid-column: 1/-1;
    grid-template: subgrid / subgrid;
    background-color: var(--rdg-background-color);

    &:hover {
      background-color: var(--rdg-row-hover-background-color);
    }

    &:focus {
      outline: none;
    }

    &[tabindex='0'] {
      &::after {
        content: '';
        grid-column: 1 / -1;
        grid-row: 1;
        z-index: 1;
        pointer-events: none;
        border: var(--rdg-selection-width) solid var(--rdg-selection-color);
      }

      & > .${cellFrozen}:first-child::before {
        content: '';
        display: inline-block;
        position: absolute;
        inset-block: 0;
        inset-inline-start: 0;
        border-inline-start: var(--rdg-selection-width) solid var(--rdg-selection-color);
      }
    }

    &[aria-selected='true'] {
      background-color: var(--rdg-row-selected-background-color);

      &:hover {
        background-color: var(--rdg-row-selected-hover-background-color);
      }
    }
  }
`;

export const rowClassname = `rdg-row ${row}`;

export const rowSelectedClassname = 'rdg-row-selected';

export const topSummaryRowClassname = 'rdg-top-summary-row';

export const bottomSummaryRowClassname = 'rdg-bottom-summary-row';
