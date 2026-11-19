// `instanceof Element` fails for elements from another window,
// for example when the grid is portaled into an iframe or a popup window
export function isElement(target: EventTarget | null): target is Element {
  return (target as Node | null)?.nodeType === Node.ELEMENT_NODE;
}

// Returns a function that gets the ResizeObserver of the window a target is rendered in,
// creating one per window, so that resizes are observed in that window,
// for example when the grid is portaled into an iframe or a popup window
export function createResizeObserverGetter(callback: ResizeObserverCallback) {
  const resizeObservers = new WeakMap<Window, ResizeObserver>();

  return function getResizeObserver(target: Element): ResizeObserver | null {
    const ownerWindow = target.ownerDocument.defaultView;

    // don't break in environments that don't support ResizeObserver
    if (ownerWindow?.ResizeObserver == null) return null;

    return resizeObservers.getOrInsertComputed(
      ownerWindow,
      () => new ownerWindow.ResizeObserver(callback)
    );
  };
}

export function stopPropagation(event: React.SyntheticEvent) {
  event.stopPropagation();
}

export function scrollIntoView(element: Element | null, behavior: ScrollBehavior = 'instant') {
  element?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior });
}

function getRowToScroll(gridEl: HTMLDivElement) {
  return gridEl.querySelector<HTMLDivElement>('& > [role="row"][tabindex="0"]');
}

export function getCellToScroll(gridEl: HTMLDivElement) {
  return gridEl.querySelector<HTMLDivElement>('& > [role="row"] > [tabindex="0"]');
}

function focusElement(element: HTMLDivElement | null, shouldScroll: boolean) {
  if (element === null) return;

  if (shouldScroll) {
    scrollIntoView(element);
  }

  element.focus({ preventScroll: true });
}

export function focusRow(gridEl: HTMLDivElement) {
  focusElement(getRowToScroll(gridEl), true);
}

export function focusCell(gridEl: HTMLDivElement, shouldScroll = true) {
  focusElement(getCellToScroll(gridEl), shouldScroll);
}
