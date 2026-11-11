import type { Key } from 'react';

import type { GridSize } from '../src';

// Pages are prerendered on the build machine, and the browser must render the same content to hydrate them:
// demos format in a fixed locale and time zone, generate dates around a fixed date,
// and generate random values with a fixed seed.
const locale = 'en-US';

export const { compare } = new Intl.Collator(locale, { numeric: true });
export const formatDate = new Intl.DateTimeFormat(locale, { timeZone: 'UTC' }).format;
export const formatCurrency = new Intl.NumberFormat(locale, {
  style: 'currency',
  currency: 'eur'
}).format;

export const referenceDate = Date.UTC(2026, 0, 1);

// mulberry32
export function createRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d_2b_79_f5) >>> 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

// grids render the rows and columns that fit on a 1080p screen when prerendered
export const initialGridSize: GridSize = { inlineSize: 1920, blockSize: 1080 };

export function showModalRef(dialog: HTMLDialogElement | null) {
  dialog?.showModal();
}

export function getRowKey<K extends Key>(row: { readonly id: K }): K {
  return row.id;
}

export function exportToCsv(gridEl: HTMLDivElement, fileName: string) {
  // TODO: remove both toArray calls https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator/join
  const content = getGridContent(gridEl)
    .map((row) => row.cells.map(serializeCellValue).toArray().join(','))
    .toArray()
    .join('\n');

  downloadFile(fileName, new Blob([content], { type: 'text/csv;charset=utf-8;' }));
}

export async function exportToPdf(gridEl: HTMLDivElement, fileName: string) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]);
  const doc = new jsPDF({
    orientation: 'l',
    unit: 'px'
  });

  const head: string[][] = [];
  const body: string[][] = [];
  const foot: string[][] = [];

  for (const row of getGridContent(gridEl)) {
    const cells = row.cells.toArray();
    if (row.type === 'body') {
      body.push(cells);
    } else if (row.type === 'head') {
      head.push(cells);
    } else {
      foot.push(cells);
    }
  }

  autoTable(doc, {
    head,
    body,
    foot,
    horizontalPageBreak: true,
    styles: { cellPadding: 1.5, fontSize: 8, cellWidth: 'wrap' },
    tableWidth: 'wrap'
  });
  doc.save(fileName);
}

function getGridContent(gridEl: HTMLDivElement) {
  return Iterator.from(gridEl.children)
    .filter((child) => child.matches('[role="row"]:not(.rdg-top-summary-row)'))
    .map((row) => {
      const cells = Iterator.from(row.children).map((cell) => cell.textContent);

      if (row.classList.contains('rdg-header-row')) {
        return { type: 'head', cells } as const;
      }

      if (row.classList.contains('rdg-bottom-summary-row')) {
        return { type: 'foot', cells } as const;
      }

      return { type: 'body', cells } as const;
    });
}

function serializeCellValue(value: string) {
  const formattedValue = value.replaceAll('"', '""');
  return formattedValue.includes(',') ? `"${formattedValue}"` : formattedValue;
}

function downloadFile(fileName: string, data: Blob) {
  const downloadLink = document.createElement('a');
  downloadLink.download = fileName;
  const url = URL.createObjectURL(data);
  downloadLink.href = url;
  downloadLink.click();
  URL.revokeObjectURL(url);
}
