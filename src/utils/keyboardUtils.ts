import type { Direction, Maybe } from '../types';

// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
const nonInputKeys = new Set([
  // Special keys
  'Unidentified',
  // Modifier keys
  'Alt',
  'AltGraph',
  'CapsLock',
  'Control',
  'Fn',
  'FnLock',
  'Meta',
  'NumLock',
  'ScrollLock',
  'Shift',
  // Whitespace keys
  'Tab',
  // Navigation keys
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'End',
  'Home',
  'PageDown',
  'PageUp',
  // Editing
  'Insert',
  // UI keys
  'ContextMenu',
  'Escape',
  'Pause',
  'Play',
  // Device keys
  'PrintScreen',
  // Function keys
  'F1',
  // 'F2', /!\ specifically allowed, do not edit
  'F3',
  'F4',
  'F5',
  'F6',
  'F7',
  'F8',
  'F9',
  'F10',
  'F11',
  'F12'
]);

export function isCtrlKeyHeldDown(e: React.KeyboardEvent): boolean {
  return (e.ctrlKey || e.metaKey) && e.key !== 'Control';
}

// event.key may differ by keyboard input language, so we use event.keyCode instead
// event.nativeEvent.code cannot be used either as it would break copy/paste for the DVORAK layout
const vKey = 86;

export function isDefaultCellInput(
  event: React.KeyboardEvent<HTMLDivElement>,
  isUserHandlingPaste: boolean
): boolean {
  if (isCtrlKeyHeldDown(event) && (event.keyCode !== vKey || isUserHandlingPaste)) return false;
  return !nonInputKeys.has(event.key);
}

/**
 * By default, the following navigation keys are enabled while an editor is open, under specific conditions:
 * - Tab:
 *   - The editor must be an <input>, a <textarea>, or a <select> element.
 *   - The editor element must be the only immediate child of the editor container/a label.
 */
export function onEditorNavigation({ key, target }: React.KeyboardEvent<HTMLDivElement>): boolean {
  if (
    key === 'Tab' &&
    (target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement)
  ) {
    return (
      target.closest('.rdg-editor-container')?.querySelectorAll('input, textarea, select')
        .length === 1
    );
  }
  return false;
}

export function getLeftRightKey(direction: Maybe<Direction>) {
  const isRtl = direction === 'rtl';

  return {
    leftKey: isRtl ? 'ArrowRight' : 'ArrowLeft',
    rightKey: isRtl ? 'ArrowLeft' : 'ArrowRight'
  } as const;
}
