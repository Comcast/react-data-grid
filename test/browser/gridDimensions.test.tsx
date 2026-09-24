import { createPortal } from 'react-dom';
import { page } from 'vitest/browser';

import { DataGrid, type Column } from '../../src';

const columns: readonly Column<unknown>[] = Array.from({ length: 20 }, (_, i) => ({
  key: String(i),
  name: String(i),
  width: 100
}));

const rows: readonly unknown[] = [];

async function createIframe(width: number) {
  const iframe = document.createElement('iframe');
  iframe.style.width = `${width}px`;
  iframe.srcdoc = '<!doctype html><body style="margin: 0"></body>';

  await new Promise((resolve) => {
    iframe.addEventListener('load', resolve, { once: true });
    document.body.append(iframe);
  });

  onTestFinished(() => {
    iframe.remove();
  });

  const iframeDocument = iframe.contentDocument!;

  // copy the grid styles into the iframe
  for (const style of document.head.querySelectorAll('style')) {
    iframeDocument.head.append(style.cloneNode(true));
  }

  return { iframe, iframeDocument, iframeWindow: iframeDocument.defaultView! };
}

// https://github.com/Comcast/react-data-grid/issues/4184
test('should observe grid resizes with the ResizeObserver of the window the grid is rendered in', async () => {
  const { iframe, iframeDocument, iframeWindow } = await createIframe(400);
  const observeSpy = vi.spyOn(iframeWindow.ResizeObserver.prototype, 'observe');

  await page.render(createPortal(<DataGrid columns={columns} rows={rows} />, iframeDocument.body));

  const grid = iframeDocument.querySelector('[role="grid"]');
  expect(grid).not.toBeNull();
  expect(observeSpy).toHaveBeenCalledWith(grid);

  function getLastHeaderCellColIndex() {
    return iframeDocument.querySelector('[role="columnheader"]:last-child')?.ariaColIndex;
  }

  await expect.poll(getLastHeaderCellColIndex).toBe('5');

  iframe.style.width = '800px';

  await expect.poll(getLastHeaderCellColIndex).toBe('9');
});
