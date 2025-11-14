import { css } from '@nstep/ecis';

export const cell = css`
  @layer rdg.Cell {
    /* max-content does not work with size containment
     * dynamically switching between different containment styles incurs a heavy relayout penalty
     * Chromium bug: at odd zoom levels or subpixel positioning,
     * layout/paint/style containment can make cell borders disappear
     *   https://issues.chromium.org/issues/40840864
     */
    position: relative; /* needed for absolute positioning to work */
    padding-block: 0;
    padding-inline: 8px;
    border-inline-end: var(--rdg-border-width) solid var(--rdg-border-color);
    border-block-end: var(--rdg-border-width) solid var(--rdg-border-color);
    grid-row-start: var(--rdg-grid-row-start);
    align-content: center;
    background-color: inherit;

    white-space: nowrap;
    overflow: clip;
    text-overflow: ellipsis;
    outline: none;

    &[aria-selected='true'] {
      outline: var(--rdg-selection-width) solid var(--rdg-selection-color);
      outline-offset: calc(var(--rdg-selection-width) * -1);
    }
  }
`;

export const cellClassname = `rdg-cell ${cell}`;

export const cellFrozen = css`
  @layer rdg.Cell {
    position: sticky;
    /* Should have a higher value than 0 to show up above unfrozen cells */
    z-index: 1;

    /* Add box-shadow on the last frozen cell */
    &:nth-last-child(1 of &) {
      box-shadow: var(--rdg-cell-frozen-box-shadow);
    }
  }
`;

export const cellFrozenClassname = `rdg-cell-frozen ${cellFrozen}`;

const cellDragHandle = css`
  @layer rdg.DragHandle {
    --rdg-drag-handle-size: 8px;
    z-index: 0;
    cursor: move;
    inline-size: var(--rdg-drag-handle-size);
    block-size: var(--rdg-drag-handle-size);
    background-color: var(--rdg-selection-color);
    place-self: end;

    &:hover {
      --rdg-drag-handle-size: 16px;
      border: 2px solid var(--rdg-selection-color);
      background-color: var(--rdg-background-color);
    }
  }
`;

export const cellDragHandleFrozenClassname = css`
  @layer rdg.DragHandle {
    z-index: 1;
    position: sticky;
  }
`;

export const cellDragHandleClassname = `rdg-cell-drag-handle ${cellDragHandle}`;
