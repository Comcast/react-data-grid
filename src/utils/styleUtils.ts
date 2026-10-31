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
  const { idx, frozen } = column;
  const index = idx + 1;
  return {
    gridColumnStart: index,
    gridColumnEnd: index + colSpan,
    insetInlineStart: frozen === 'start' ? `var(--rdg-frozen-start-${idx})` : undefined,
    insetInlineEnd: frozen === 'end' ? `var(--rdg-frozen-end-${idx + colSpan - 1})` : undefined
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
  return classnames(
    cellClassname,
    column.frozen === 'start' && cellFrozenStartClassname,
    column.frozen === 'end' && cellFrozenEndClassname,
    ...extraClasses
  );
}
