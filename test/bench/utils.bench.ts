import type { CalculatedColumn, CalculatedColumnParent, ColumnFrozen } from '../../src/types';
import { classnames, getCellClassname, getCellStyle, getHeaderCellStyle } from '../../src/utils';
import { bench } from './utils';

// --- Helpers ---

function createColumn(
  idx: number,
  frozen: ColumnFrozen = false,
  parent?: CalculatedColumnParent<unknown, unknown>
): CalculatedColumn<unknown> {
  return {
    name: `Column ${idx}`,
    key: `col${idx}`,
    parent,
    idx,
    level: 0,
    width: 100,
    minWidth: 50,
    maxWidth: undefined,
    cellClass: undefined,
    headerCellClass: undefined,
    summaryCellClass: undefined,
    renderCell: () => null,
    renderHeaderCell: () => null,
    renderSummaryCell: undefined,
    renderGroupCell: undefined,
    renderEditCell: undefined,
    editable: undefined,
    colSpan: undefined,
    getColSpan: () => 1,
    frozen,
    resizable: true,
    sortable: true,
    draggable: false,
    sortDescendingFirst: undefined,
    editorOptions: undefined
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
  const frozenColumn = createColumn(0, 'start');

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
  const frozenColumn = createColumn(1, 'start');

  bench('non-frozen column', () => {
    getCellStyle(column, 1);
  });

  bench('frozen column', () => {
    getCellStyle(frozenColumn, 1);
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
