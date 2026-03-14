import { bench } from 'vitest';

import type { CalculatedColumn, CalculatedColumnParent } from '../../src/types';
import { classnames, getCellClassname, getCellStyle, getHeaderCellStyle } from '../../src/utils';

// --- Helpers ---

function createColumn(
  idx: number,
  frozen = false,
  parent?: CalculatedColumnParent<unknown, unknown>
): CalculatedColumn<unknown> {
  return {
    key: `col${idx}`,
    name: `Column ${idx}`,
    idx,
    level: 0,
    width: 100,
    minWidth: 50,
    maxWidth: undefined,
    resizable: true,
    sortable: true,
    draggable: false,
    frozen,
    parent,
    renderCell: () => null,
    renderHeaderCell: () => null
  };
}

// --- Benchmarks ---

describe('classnames', () => {
  bench('no args', () => {
    classnames();
  });

  bench('single string', () => {
    classnames('rdg-cell');
  });

  bench('multiple strings', () => {
    classnames('rdg-cell', 'rdg-cell-frozen', 'rdg-cell-selected', 'custom-class');
  });

  bench('mixed with falsy values', () => {
    classnames('rdg-cell', false, undefined, 'rdg-cell-frozen', null, 'custom');
  });
});

describe('getCellClassname', () => {
  const column = createColumn(0);
  const frozenColumn = createColumn(0, true);

  bench('non-frozen column', () => {
    getCellClassname(column);
  });

  bench('frozen column', () => {
    getCellClassname(frozenColumn);
  });

  bench('with extra classes', () => {
    const isEditing = false as boolean;
    getCellClassname(column, 'selected', 'active', isEditing && 'editing');
  });
});

describe('getCellStyle', () => {
  const column = createColumn(3);
  const frozenColumn = createColumn(1, true);

  bench('non-frozen column', () => {
    getCellStyle(column);
  });

  bench('frozen column', () => {
    getCellStyle(frozenColumn);
  });

  bench('with colSpan', () => {
    getCellStyle(column, 3);
  });
});

describe('getHeaderCellStyle', () => {
  const column = createColumn(0);
  const parent: CalculatedColumnParent<unknown, unknown> = {
    name: 'Parent',
    parent: undefined,
    idx: 0,
    colSpan: 3,
    level: 0,
    headerCellClass: undefined
  };
  const childColumn = createColumn(1, false, parent);

  bench('top-level column', () => {
    getHeaderCellStyle(column, 2, 2);
  });

  bench('nested column with parent', () => {
    getHeaderCellStyle(childColumn, 3, 1);
  });
});
