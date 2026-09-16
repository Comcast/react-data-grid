export const { compare } = new Intl.Collator('en-US', { numeric: true });

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
