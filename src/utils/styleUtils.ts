import type { CalculatedColumn, CalculatedColumnOrColumnGroup, Maybe } from '../types';
import { cellClassname, cellFrozenStartClassname, cellFrozenEndClassname } from '../style/cell';

export function getHeaderCellStyle<R, SR>(
  column: CalculatedColumnOrColumnGroup<R, SR>,
  rowIdx: number,
  rowSpan: number
): React.CSSProperties {
  const gridRowEnd = rowIdx + 1;
  const paddingBlockStart = `calc(${rowSpan - 1} * var(--rdg-header-row-height))`;

  if (column.parent === undefined) {
    return {
      insetBlockStart: 0,
      gridRowStart: 1,
      gridRowEnd,
      paddingBlockStart
    };
  }

  return {
    insetBlockStart: `calc(${rowIdx - rowSpan} * var(--rdg-header-row-height))`,
    gridRowStart: gridRowEnd - rowSpan,
    gridRowEnd,
    paddingBlockStart
  };
}

export function getCellStyle<R, SR>(
  column: CalculatedColumn<R, SR>,
  colSpan: number
): React.CSSProperties {
  const { idx, frozen, minWidth, maxWidth } = column;
  const index = idx + 1;
  let insetInlineStart;
  let insetInlineEnd;

  if (frozen !== false) {
    if (frozen === 'start') {
      insetInlineStart = `var(--rdg-frozen-start-${idx})`;
    } else {
      insetInlineEnd = `var(--rdg-frozen-end-${idx + colSpan - 1})`;
    }
  }

  return {
    gridColumnStart: index,
    gridColumnEnd: index + colSpan,
    insetInlineStart,
    insetInlineEnd,
    // Cells size `auto`, `min-content`, and `max-content` columns with their content,
    // so they must not be wider than `maxWidth`, or the column would exceed it
    // and leave less room for the other columns.
    // `maxWidth` is ignored when it is less than `minWidth`, as when clamping widths.
    // `minWidth` is set on the measuring cells instead, so that cells keep the minimum width of their content.
    maxWidth: colSpan === 1 && maxWidth !== undefined && maxWidth >= minWidth ? maxWidth : undefined
  };
}

type ClassValue = Maybe<string | false>;

export function classnames(...args: readonly ClassValue[]) {
  let classname = '';

  for (const arg of args) {
    if (typeof arg === 'string') {
      classname += ` ${arg}`;
    }
  }

  return classname.slice(1);
}

export function getCellClassname<R, SR>(
  column: CalculatedColumn<R, SR>,
  ...extraClasses: readonly ClassValue[]
): string {
  const { frozen } = column;

  return classnames(
    cellClassname,
    frozen !== false && (frozen === 'start' ? cellFrozenStartClassname : cellFrozenEndClassname),
    ...extraClasses
  );
}
