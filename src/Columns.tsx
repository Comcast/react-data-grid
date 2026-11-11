import { useHeaderRowSelection, useRowSelection } from './hooks';
import type {
  Column,
  RenderCellContentProps,
  RenderGroupCellContentProps,
  RenderHeaderCellContentProps
} from './types';
import { SelectCheckbox } from './cellRenderers';

/**
 * The key used for the `SelectColumn`. Useful for identifying or filtering the select column.
 *
 * @example
 * ```tsx
 * import { SELECT_COLUMN_KEY } from 'react-data-grid';
 *
 * const nonSelectColumns = columns.filter((column) => column.key !== SELECT_COLUMN_KEY);
 * ```
 */
export const SELECT_COLUMN_KEY = 'rdg-select-column';

function SelectAllCell({ tabIndex }: RenderHeaderCellContentProps<unknown>) {
  const { isIndeterminate, isRowSelected, onRowSelectionChange } = useHeaderRowSelection();

  return (
    <SelectCheckbox
      aria-label="Select All"
      tabIndex={tabIndex}
      indeterminate={isIndeterminate}
      checked={isRowSelected}
      onChange={(checked) => {
        onRowSelectionChange({ checked: isIndeterminate ? false : checked });
      }}
    />
  );
}

function RowSelectCell({ row, tabIndex }: RenderCellContentProps<unknown>) {
  const { isRowSelectionDisabled, isRowSelected, onRowSelectionChange } = useRowSelection();

  return (
    <SelectCheckbox
      aria-label="Select"
      tabIndex={tabIndex}
      disabled={isRowSelectionDisabled}
      checked={isRowSelected}
      onChange={(checked, isShiftClick) => {
        onRowSelectionChange({ row, checked, isShiftClick });
      }}
    />
  );
}

function GroupSelectCell({ row, tabIndex }: RenderGroupCellContentProps<unknown>) {
  const { isRowSelected, onRowSelectionChange } = useRowSelection();

  return (
    <SelectCheckbox
      aria-label="Select Group"
      tabIndex={tabIndex}
      checked={isRowSelected}
      onChange={(checked) => {
        onRowSelectionChange({ row, checked, isShiftClick: false });
      }}
    />
  );
}

/**
 * A pre-configured column for row selection.
 * Includes checkbox renderers for the header row, regular rows, and group rows.
 *
 * @example
 * ```tsx
 * import { DataGrid, SelectColumn, type Column } from 'react-data-grid';
 *
 * const columns: readonly Column<Row>[] = [SelectColumn, ...otherColumns];
 *
 * function getRowKey(row: Row) {
 *   return row.id;
 * }
 *
 * function MyGrid() {
 *   return (
 *     <DataGrid
 *       columns={columns}
 *       rows={rows}
 *       getRowKey={getRowKey}
 *       selectedRows={selectedRows}
 *       onSelectedRowsChange={setSelectedRows}
 *     />
 *   );
 * }
 * ```
 */
// oxlint-disable-next-line typescript/no-explicit-any
export const SelectColumn: Column<any, any> = {
  key: SELECT_COLUMN_KEY,
  name: '',
  width: 35,
  minWidth: 35,
  maxWidth: 35,
  resizable: false,
  sortable: false,
  frozen: true,
  renderHeaderCell(props) {
    return <SelectAllCell {...props} />;
  },
  renderCell(props) {
    return <RowSelectCell {...props} />;
  },
  renderGroupCell(props) {
    return <GroupSelectCell {...props} />;
  }
};
