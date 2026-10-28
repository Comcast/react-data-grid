import { createContext, use } from 'react';

import type { SelectHeaderRowEvent, SelectRowEvent } from '../types';

export interface RowSelectionContextValue {
  readonly isRowSelected: boolean;
  readonly isRowSelectionDisabled: boolean;
}

export const RowSelectionContext = createContext<RowSelectionContextValue | undefined>(undefined);
RowSelectionContext.displayName = 'RowSelectionContext';

export const RowSelectionChangeContext = createContext<
  // oxlint-disable-next-line typescript/no-explicit-any
  ((selectRowEvent: SelectRowEvent<any>) => void) | undefined
>(undefined);
RowSelectionChangeContext.displayName = 'RowSelectionChangeContext';

/**
 * Hook for managing row selection state. Used within custom cell renderers to implement custom row selection.
 *
 * @returns An object with:
 *
 * - `isRowSelectionDisabled: boolean` - Whether selection is disabled for this row
 * - `isRowSelected: boolean` - Whether this row is selected
 * - `onRowSelectionChange: (event: SelectRowEvent<R>) => void` - Callback to change selection state
 *
 * @example
 * ```tsx
 * function CustomSelectCell({ row }: RenderCellContentProps<Row>) {
 *   const { isRowSelectionDisabled, isRowSelected, onRowSelectionChange } = useRowSelection();
 *
 *   return (
 *     <input
 *       type="checkbox"
 *       disabled={isRowSelectionDisabled}
 *       checked={isRowSelected}
 *       onChange={(event) =>
 *         onRowSelectionChange({
 *           row,
 *           checked: event.currentTarget.checked,
 *           isShiftClick: event.nativeEvent.shiftKey
 *         })
 *       }
 *     />
 *   );
 * }
 * ```
 */
export function useRowSelection() {
  const rowSelectionContext = use(RowSelectionContext);
  const rowSelectionChangeContext = use(RowSelectionChangeContext);

  if (rowSelectionContext === undefined || rowSelectionChangeContext === undefined) {
    throw new Error('useRowSelection must be used within renderCell');
  }

  return {
    isRowSelectionDisabled: rowSelectionContext.isRowSelectionDisabled,
    isRowSelected: rowSelectionContext.isRowSelected,
    onRowSelectionChange: rowSelectionChangeContext
  };
}

export interface HeaderRowSelectionContextValue {
  readonly isRowSelected: boolean;
  readonly isIndeterminate: boolean;
}

export const HeaderRowSelectionContext = createContext<HeaderRowSelectionContextValue | undefined>(
  undefined
);
HeaderRowSelectionContext.displayName = 'HeaderRowSelectionContext';

export const HeaderRowSelectionChangeContext = createContext<
  ((selectRowEvent: SelectHeaderRowEvent) => void) | undefined
>(undefined);
HeaderRowSelectionChangeContext.displayName = 'HeaderRowSelectionChangeContext';

/**
 * Hook for managing header row selection state. Used within custom header cell renderers to implement custom "select all" functionality.
 *
 * @returns An object with:
 *
 * - `isIndeterminate: boolean` - Whether some (but not all) rows are selected
 * - `isRowSelected: boolean` - Whether all rows are selected
 * - `onRowSelectionChange: (event: SelectHeaderRowEvent) => void` - Callback to change selection state
 *
 * @example
 * ```tsx
 * import { useLayoutEffect, useRef } from 'react';
 *
 * function CustomHeaderCell() {
 *   const { isIndeterminate, isRowSelected, onRowSelectionChange } = useHeaderRowSelection();
 *   const checkboxRef = useRef<HTMLInputElement>(null);
 *
 *   useLayoutEffect(() => {
 *     if (checkboxRef.current) {
 *       checkboxRef.current.indeterminate = isIndeterminate && !isRowSelected;
 *     }
 *   }, [isIndeterminate, isRowSelected]);
 *
 *   return (
 *     <input
 *       ref={checkboxRef}
 *       type="checkbox"
 *       checked={isRowSelected}
 *       onChange={(event) => onRowSelectionChange({ checked: event.target.checked })}
 *     />
 *   );
 * }
 * ```
 */
export function useHeaderRowSelection() {
  const headerRowSelectionContext = use(HeaderRowSelectionContext);
  const headerRowSelectionChangeContext = use(HeaderRowSelectionChangeContext);

  if (headerRowSelectionContext === undefined || headerRowSelectionChangeContext === undefined) {
    throw new Error('useHeaderRowSelection must be used within renderHeaderCell');
  }

  return {
    isIndeterminate: headerRowSelectionContext.isIndeterminate,
    isRowSelected: headerRowSelectionContext.isRowSelected,
    onRowSelectionChange: headerRowSelectionChangeContext
  };
}
