import type { CalculatedColumn, CalculatedColumnOrColumnGroup, Maybe } from '../types';
import { cellClassname, cellFrozenClassname } from '../style/cell';

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
  colSpan = 1
): React.CSSProperties {
  const index = column.idx + 1;
  return {
    gridColumnStart: index,
    gridColumnEnd: index + colSpan,
    insetInlineStart: column.frozen ? `var(--rdg-frozen-left-${column.idx})` : undefined
  };
}

type ClassValue = Maybe<string> | Record<string, boolean> | false;

export function classnames(...args: readonly ClassValue[]) {
  let classname = '';

  for (const arg of args) {
    if (arg) {
      if (typeof arg === 'string') {
        classname += ` ${arg}`;
      } else if (typeof arg === 'object') {
        for (const key in arg) {
          if (arg[key]) {
            classname += ` ${key}`;
          }
        }
      }
    }
  }

  return classname.trimStart();
}

export function getCellClassname<R, SR>(
  column: CalculatedColumn<R, SR>,
  ...extraClasses: readonly ClassValue[]
): string {
  return classnames(
    cellClassname,
    {
      [cellFrozenClassname]: column.frozen
    },
    ...extraClasses
  );
}
