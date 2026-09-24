import { useState } from 'react';
import { createPortal } from 'react-dom';
import { page, userEvent } from 'vitest/browser';

import { DataGrid, type Column, type RenderEditCellProps } from '../../src';

// The grid can be portaled into another window, like an iframe or a popup window.
// Its DOM nodes then belong to that other window, while its JS still runs in this window.
// https://github.com/Comcast/react-data-grid/issues/4184

interface Row {
  a: string;
  b: string;
}

const columns: readonly Column<unknown>[] = Array.from({ length: 20 }, (_, i) => ({
  key: String(i),
  name: String(i),
  width: 100
}));

const noRows: readonly unknown[] = [];

// unlike `renderTextEditor`, this editor does not commit on blur
function renderEditCell({ row, column, onRowChange }: RenderEditCellProps<Row>) {
  const key = column.key as keyof Row;

  return (
    <input
      autoFocus
      aria-label="editor"
      value={row[key]}
      onChange={(event) => onRowChange({ ...row, [key]: event.target.value })}
    />
  );
}

const editableColumns: readonly Column<Row>[] = [
  { key: 'a', name: 'A', renderEditCell },
  { key: 'b', name: 'B', renderEditCell }
];

const initialRows: readonly Row[] = [
  { a: 'a1', b: 'b1' },
  { a: 'a2', b: 'b2' }
];

function EditableGrid() {
  const [rows, setRows] = useState(initialRows);

  return (
    <>
      <div>outside</div>
      <DataGrid columns={editableColumns} rows={rows} onRowsChange={setRows} />
    </>
  );
}

async function createIframe(width = 400) {
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

  return {
    iframe,
    iframeDocument,
    iframeWindow: iframeDocument.defaultView!,
    frame: page.frameLocator(page.elementLocator(iframe))
  };
}

test('should observe grid resizes with the ResizeObserver of the window the grid is rendered in', async () => {
  const { iframe, iframeDocument, iframeWindow } = await createIframe();
  const observeSpy = vi.spyOn(iframeWindow.ResizeObserver.prototype, 'observe');

  await page.render(
    createPortal(<DataGrid columns={columns} rows={noRows} />, iframeDocument.body)
  );

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

test.fails('should navigate between cells with the keyboard', async () => {
  const { iframeDocument, frame } = await createIframe();
  await page.render(createPortal(<EditableGrid />, iframeDocument.body));

  await userEvent.click(frame.getCell({ name: 'a1' }));
  await expect.element(frame.getActiveCell()).toHaveTextContent('a1');
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(frame.getActiveCell()).toHaveTextContent('b1');
});

test.fails('should commit changes and navigate out of the editor on Tab', async () => {
  const { iframeDocument, frame } = await createIframe();
  await page.render(createPortal(<EditableGrid />, iframeDocument.body));
  const editor = frame.getByRole('textbox', { name: 'editor' });

  await userEvent.dblClick(frame.getCell({ name: 'a1' }));
  await expect.element(editor).toHaveValue('a1');
  await userEvent.keyboard('new{Tab}');
  await expect.element(editor).not.toBeInTheDocument();
  await expect.element(frame.getActiveCell()).toHaveTextContent('b1');
  await expect.element(frame.getCell({ name: 'a1new' })).toBeInTheDocument();
});

test.fails('should commit changes and close the editor when clicked outside', async () => {
  const { iframeDocument, frame } = await createIframe();
  await page.render(createPortal(<EditableGrid />, iframeDocument.body));
  const editor = frame.getByRole('textbox', { name: 'editor' });

  await userEvent.dblClick(frame.getCell({ name: 'a1' }));
  await expect.element(editor).toHaveValue('a1');
  await userEvent.keyboard('new');
  await userEvent.click(frame.getByText('outside'));
  await expect.element(editor).not.toBeInTheDocument();
  await expect.element(frame.getCell({ name: 'a1new' })).toBeInTheDocument();
});
