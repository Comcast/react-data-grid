import { createContext, use } from 'react';

import type { SelectHeaderRowEvent, SelectRowEvent } from '../types';

export interface RowSelectionContextValue {
  readonly isRowSelected: boolean;
  readonly isRowSelectionDisabled: boolean;
}

export const RowSelectionContext = createContext<RowSelectionContextValue | undefined>(undefined);
RowSelectionContext.displayName = 'RowSelectionContext';

export const RowSelectionChangeContext = createContext<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ((selectRowEvent: SelectRowEvent<any>) => void) | undefined
>(undefined);
RowSelectionChangeContext.displayName = 'RowSelectionChangeContext';

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
