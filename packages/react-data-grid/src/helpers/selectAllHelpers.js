export const indeterminateClassName = 'indeterminate';

export const addIndeterminate = (classList) => {
  if (!classList.contains(indeterminateClassName)) {
    classList.add(indeterminateClassName);
  }
};

export const removeIndeterminate = (classList) => {
  if (classList.contains(indeterminateClassName)) {
    classList.remove(indeterminateClassName);
  }
};

export const populateSelectAllChecked = (selectAllCheckbox, rowsCount, selectedRowCounts) => {
  if (selectAllCheckbox) {
    const { checked } = selectAllCheckbox;
    const isEmptySelected = selectedRowCounts === 0;
    const isPartiallySelected = selectedRowCounts > 0 && selectedRowCounts < rowsCount;
    const isFullySelected = selectedRowCounts === rowsCount && rowsCount !== 0;

    // render checked status for select all
    if ((isEmptySelected || isPartiallySelected) && checked) {
      selectAllCheckbox.checked = false;
    }

    if (isFullySelected && !checked) {
      selectAllCheckbox.checked = true;
    }
  }
};

export const populateIndeterminate = (checkboxLabel, rowsCount, selectedRowCounts, enableIndeterminate) => {
  if (checkboxLabel) {
    const { classList } = checkboxLabel;
    if (!enableIndeterminate) {
      removeIndeterminate(classList);
      return;
    }

    if (selectedRowCounts > 0 && selectedRowCounts < rowsCount) {
      // if there are any rows selected while it's not equals to rowsCount, it renders indeterminate status if it's set true.
      addIndeterminate(classList);
    } else {
      // if there are any rows equals to rowsCount, it remove the indeterminate status
      removeIndeterminate(classList);
    }
  }
};

module.export = { addIndeterminate, removeIndeterminate, populateSelectAllChecked, populateIndeterminate };
