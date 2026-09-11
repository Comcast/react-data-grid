import type { Maybe } from '../types';

export function stopPropagation(event: React.SyntheticEvent) {
  event.stopPropagation();
}

export function scrollIntoView(element: Maybe<Element>, behavior: ScrollBehavior = 'instant') {
  element?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior });
}

function getRowToScroll(gridEl: HTMLDivElement) {
  return gridEl.querySelector<HTMLDivElement>(':scope > [role="row"][tabindex="0"]');
}

export function getCellToScroll(gridEl: HTMLDivElement) {
  return gridEl.querySelector<HTMLDivElement>(':scope > [role="row"] > [tabindex="0"]');
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
