import { useEffectEvent, useLayoutEffect, useRef } from 'react';
import { css } from 'ecij';

import { createCellEvent, getCellClassname, getCellStyle, onEditorNavigation } from './utils';
import type { EditCellProps } from './types';

/*
 * To check for outside `mousedown` events, we listen to all `mousedown` events at their birth,
 * i.e., on the window during the capture phase, and at their death, i.e., on the window during the bubble phase.
 *
 * We schedule a check at the birth of the event, cancel the check when the event reaches the "inside" container,
 * and trigger the "outside" callback when the event bubbles back up to the window.
 *
 * The event can be `stopPropagation()`ed halfway through, so it may not always bubble back up to the window,
 * and an alternative check must be used. The check must happen after the event can reach the "inside" container,
 * and not before it has run to completion. `postTask`/`requestAnimationFrame` are the best way we know to achieve this.
 * Usually we want click event handlers from parent components to access the latest committed values,
 * so `mousedown` is used instead of `click`.
 *
 * We must also rely on React's event capturing/bubbling to handle elements rendered in a portal.
 *
 * The grid may be portaled into another window, like an iframe or a popup window,
 * so we listen to events on both the window the editor is rendered in and the current window,
 * and schedule tasks on the window that received the event.
 */

// TODO: remove when all browsers support the scheduler APIs
function canUsePostTask({ scheduler }: typeof globalThis) {
  return typeof scheduler === 'object' && typeof scheduler.postTask === 'function';
}

const cellEditing = css`
  @layer rdg.EditCell {
    padding: 0;
  }
`;

const editCell = css`
  @layer rdg.EditCell {
    /* forced colors mode replaces the editor's background with Canvas, even on a selected row */
    @media (forced-colors: active) {
      --rdg-selection-color: CanvasText;
    }
  }
`;

export default function EditCell<R, SR>({
  column,
  row,
  rowIdx,
  onRowChange,
  closeEditor,
  navigate,
  onKeyDown
}: EditCellProps<R, SR>) {
  const editCellRef = useRef<HTMLDivElement>(null);
  const captureEventRef = useRef<MouseEvent | undefined>(undefined);
  const cancelScheduledTaskRef = useRef<() => void>(undefined);
  const modalKeyDownEventRef = useRef<KeyboardEvent | undefined>(undefined);
  const commitOnOutsideClick = column.editorOptions?.commitOnOutsideClick ?? true;

  function onClose(commitChanges = false, shouldFocus = true) {
    if (commitChanges) {
      onRowChange(row, true, shouldFocus);
    } else {
      closeEditor(shouldFocus);
    }
  }

  // We need to prevent the `useLayoutEffect` from cleaning up between re-renders,
  // as `onWindowCaptureMouseDown` might otherwise miss valid mousedown events.
  // To that end, we instead access the latest props via useEffectEvent.
  const commitOnOutsideMouseDown = useEffectEvent(() => {
    onClose(true, false);
  });

  function cancelTask() {
    captureEventRef.current = undefined;
    cancelScheduledTaskRef.current?.();
    cancelScheduledTaskRef.current = undefined;
  }

  const cancelTaskEffect = useEffectEvent(cancelTask);

  useLayoutEffect(() => {
    if (!commitOnOutsideClick) return;

    const windows = new Set([editCellRef.current!.ownerDocument.defaultView!, globalThis]);

    function onWindowCaptureMouseDown(event: MouseEvent) {
      captureEventRef.current = event;
      const eventWindow = event.currentTarget as typeof globalThis;

      if (canUsePostTask(eventWindow)) {
        const abortController = new AbortController();
        cancelScheduledTaskRef.current = () => {
          abortController.abort();
        };
        // Use postTask to ensure that the event is not called in the middle of a React render
        // and that it is called before the next paint.
        eventWindow.scheduler
          .postTask(commitOnOutsideMouseDown, {
            priority: 'user-blocking',
            signal: abortController.signal
          })
          // ignore abort errors
          .catch(() => {});
      } else {
        const frameRequest = eventWindow.requestAnimationFrame(commitOnOutsideMouseDown);
        cancelScheduledTaskRef.current = () => {
          eventWindow.cancelAnimationFrame(frameRequest);
        };
      }
    }

    function onWindowMouseDown(event: MouseEvent) {
      if (captureEventRef.current === event) {
        commitOnOutsideMouseDown();
      }
    }

    for (const win of windows) {
      win.addEventListener('mousedown', onWindowCaptureMouseDown, { capture: true });
      win.addEventListener('mousedown', onWindowMouseDown);
    }

    return () => {
      for (const win of windows) {
        win.removeEventListener('mousedown', onWindowCaptureMouseDown, { capture: true });
        win.removeEventListener('mousedown', onWindowMouseDown);
      }
      cancelTaskEffect();
    };
  }, [commitOnOutsideClick]);

  function handleKeyDownCapture(event: React.KeyboardEvent<HTMLDivElement>) {
    // Let :modal editors handle their own keyboard events,
    // skipping both `onCellKeyDown` and the default behavior.
    // The check happens in the capture phase, as the editor may close the :modal while handling the event.
    // The :modal may be rendered in the cell or in a portal,
    // but the grid itself may also be rendered in a :modal.
    // Ideally we would check if the cell is inert,
    // but there's no good way to do it.
    // https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:modal
    const modal = (event.target as Element).closest(':modal');
    if (modal !== null && !modal.contains(event.currentTarget)) {
      modalKeyDownEventRef.current = event.nativeEvent;
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (modalKeyDownEventRef.current === event.nativeEvent) return;

    if (onKeyDown) {
      const cellEvent = createCellEvent(event);
      onKeyDown(
        {
          mode: 'EDIT',
          row,
          column,
          rowIdx,
          navigate() {
            navigate(event);
          },
          onClose
        },
        cellEvent
      );
      if (cellEvent.isGridDefaultPrevented()) return;
    }

    if (event.key === 'Escape') {
      // Discard changes
      onClose();
    } else if (event.key === 'Enter') {
      onClose(true);
    } else if (onEditorNavigation(event)) {
      navigate(event);
    }
  }

  function onEditorRowChange(row: R, commitChangesAndFocus = false) {
    onRowChange(row, commitChangesAndFocus, commitChangesAndFocus);
  }

  const colSpan = column.getColSpan({ type: 'ROW', row });
  const { cellClass } = column;
  const className = getCellClassname(
    column,
    'rdg-editor-container',
    editCell,
    !column.editorOptions?.displayCellContent && cellEditing,
    typeof cellClass === 'function' ? cellClass(row) : cellClass
  );

  return (
    <div
      ref={editCellRef}
      role="gridcell"
      aria-colindex={column.idx + 1} // aria-colindex is 1-based
      aria-colspan={colSpan > 1 ? colSpan : undefined}
      aria-selected
      className={className}
      style={getCellStyle(column, colSpan)}
      onKeyDownCapture={handleKeyDownCapture}
      onKeyDown={handleKeyDown}
      onMouseDownCapture={cancelTask}
    >
      {column.renderEditCell != null && (
        <>
          {column.renderEditCell({
            column,
            row,
            rowIdx,
            onRowChange: onEditorRowChange,
            onClose
          })}
          {column.editorOptions?.displayCellContent &&
            column.renderCell({
              column,
              row,
              rowIdx,
              isCellEditable: true,
              tabIndex: -1,
              onRowChange: onEditorRowChange
            })}
        </>
      )}
    </div>
  );
}
