import { useHeaderRowSelection, useRowSelection } from './hooks';
import type {
  Column,
  RenderCellContentProps,
  RenderGroupCellContentProps,
  RenderHeaderCellContentProps
} from './types';
import { SelectCheckbox } from './cellRenderers';

export const SELECT_COLUMN_KEY = 'rdg-select-column';

function SelectAllCell(props: RenderHeaderCellContentProps<unknown>) {
  const { isIndeterminate, isRowSelected, onRowSelectionChange } = useHeaderRowSelection();

  return (
    <SelectCheckbox
      aria-label="Select All"
      tabIndex={props.tabIndex}
      indeterminate={isIndeterminate}
      value={isRowSelected}
      onChange={(checked) => {
        onRowSelectionChange({ checked: isIndeterminate ? false : checked });
      }}
    />
  );
}

function RowSelectCell(props: RenderCellContentProps<unknown>) {
  const { isRowSelectionDisabled, isRowSelected, onRowSelectionChange } = useRowSelection();

  return (
    <SelectCheckbox
      aria-label="Select"
      tabIndex={props.tabIndex}
      disabled={isRowSelectionDisabled}
      value={isRowSelected}
      onChange={(checked, isShiftClick) => {
        onRowSelectionChange({ row: props.row, checked, isShiftClick });
      }}
    />
  );
}

function GroupSelectCell(props: RenderGroupCellContentProps<unknown>) {
  const { isRowSelected, onRowSelectionChange } = useRowSelection();

  return (
    <SelectCheckbox
      aria-label="Select Group"
      tabIndex={props.tabIndex}
      value={isRowSelected}
      onChange={(checked) => {
        onRowSelectionChange({ row: props.row, checked, isShiftClick: false });
      }}
    />
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
