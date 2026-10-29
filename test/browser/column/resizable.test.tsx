import { useState } from 'react';
import { commands, page, server, userEvent } from 'vite-plus/test/browser';

import { DataGrid, type Column, type ColumnWidth, type ColumnWidths } from '../../../src';
import { setup } from '../utils';

const grid = page.getGrid();

interface Row {
  readonly col1: number;
  readonly col2: string;
}

function getResizeHandle(name: string) {
  return page.getHeaderCell({ name }).getBySelector('.rdg-resize-handle');
}

async function resize(columnName: string, resizeBy: number | readonly number[]) {
  await expect.element(getResizeHandle(columnName)).toBeInTheDocument();

  await commands.resizeColumn(columnName, resizeBy);
}

async function autoResize(columnName: string) {
  const resizeHandle = getResizeHandle(columnName);

  await userEvent.dblClick(resizeHandle);
}

const columns: readonly Column<Row>[] = [
  {
    key: 'col1',
    name: 'col1',
    width: 100
  },
  {
    key: 'col2',
    name: 'col2',
    minWidth: 100,
    width: 200,
    maxWidth: 400,
    resizable: true
  }
];

test('cannot resize or auto resize column when resizable is not specified', async () => {
  await setup<Row, unknown>({ columns, rows: [] });
  await expect.element(getResizeHandle('col1')).not.toBeInTheDocument();
});

test('should resize column when dragging the handle', async () => {
  const onColumnResize = vi.fn();
  await setup<Row, unknown>({ columns, rows: [], onColumnResize });
  expect(onColumnResize).not.toHaveBeenCalled();
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 200px' });
  await resize('col2', -50);
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 150px' });
  expect(onColumnResize).toHaveBeenCalledExactlyOnceWith(expect.objectContaining(columns[1]), 150);
});

test('should use the maxWidth if specified when dragging the handle', async () => {
  await setup<Row, unknown>({ columns, rows: [] });
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 200px' });
  await resize('col2', 1000);
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 400px' });
});

test('should use the minWidth if specified when dragging the handle', async () => {
  await setup<Row, unknown>({ columns, rows: [] });
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 200px' });
  await resize('col2', -150);
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 100px' });
});

test('should resize column using keyboard', async () => {
  const onColumnResize = vi.fn();
  await setup<Row, unknown>({ columns, rows: [], onColumnResize });
  expect(onColumnResize).not.toHaveBeenCalled();
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 200px' });
  const col2 = page.getHeaderCell({ name: 'col2' });
  await userEvent.click(col2);

  await userEvent.keyboard('{Control>}{ArrowRight}{/Control}');
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 210px' });
  expect(onColumnResize).toHaveBeenCalledWith(expect.objectContaining(columns[1]), 210);

  await userEvent.keyboard('{Control>}{ArrowLeft}{/Control}');
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 200px' });
  expect(onColumnResize).toHaveBeenCalledWith(expect.objectContaining(columns[1]), 200);
  expect(onColumnResize).toHaveBeenCalledTimes(2);
});

test('should use the maxWidth if specified when resizing using keyboard', async () => {
  const onColumnResize = vi.fn();
  await setup<Row, unknown>({ columns, rows: [], onColumnResize });
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 200px' });
  const col2 = page.getHeaderCell({ name: 'col2' });
  await userEvent.click(col2);
  await userEvent.keyboard(`{Control>}${'{ArrowRight}'.repeat(22)}{/Control}`);
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 400px' });
  expect(onColumnResize).toHaveBeenCalledTimes(20);
});

test('should use the minWidth if specified when resizing using keyboard', async () => {
  const onColumnResize = vi.fn();
  await setup<Row, unknown>({ columns, rows: [], onColumnResize });
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 200px' });
  const col2 = page.getHeaderCell({ name: 'col2' });
  await userEvent.click(col2);
  await userEvent.keyboard(`{Control>}${'{ArrowLeft}'.repeat(12)}{/Control}`);
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 100px' });
  expect(onColumnResize).toHaveBeenCalledTimes(10);
});

test('should call onColumnWidthsChange when the key is released after resizing using keyboard', async () => {
  const onColumnWidthsChange = vi.fn();
  await setup<Row, unknown>({ columns, rows: [], onColumnWidthsChange });
  await userEvent.click(page.getHeaderCell({ name: 'col2' }));

  // keep the key pressed, so the column is still being resized
  await userEvent.keyboard('{Control>}{ArrowRight>}');
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 210px' });
  expect(onColumnWidthsChange).not.toHaveBeenCalled();

  await userEvent.keyboard('{/ArrowRight}');
  expect(onColumnWidthsChange).toHaveBeenCalledExactlyOnceWith(
    new Map<string, ColumnWidth>([['col2', { width: 210, type: 'resized' }]])
  );
  await userEvent.keyboard('{/Control}');
  expect(onColumnWidthsChange).toHaveBeenCalledOnce();
});

test('should end the keyboard resize when the header cell loses focus', async () => {
  const onColumnWidthsChange = vi.fn();
  await setup<Row, unknown>({ columns, rows: [], onColumnWidthsChange });
  const headerCell = page.getHeaderCell({ name: 'col2' });

  await userEvent.click(headerCell);
  // keep the key pressed, so the column is still being resized
  await userEvent.keyboard('{Control>}{ArrowRight>}');
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 210px' });
  expect(onColumnWidthsChange).not.toHaveBeenCalled();

  (headerCell.element() as HTMLElement).blur();
  expect(onColumnWidthsChange).toHaveBeenCalledExactlyOnceWith(
    new Map<string, ColumnWidth>([['col2', { width: 210, type: 'resized' }]])
  );
  await userEvent.keyboard('{/ArrowRight}{/Control}');
  expect(onColumnWidthsChange).toHaveBeenCalledOnce();
});

test('should use the columnWidths prop again after resizing using keyboard', async () => {
  function TestGrid() {
    const [columnWidths, setColumnWidths] = useState((): ColumnWidths => new Map());

    return (
      <>
        <button type="button" onClick={() => setColumnWidths(new Map())}>
          Reset widths
        </button>
        <DataGrid<Row>
          columns={columns}
          rows={[]}
          columnWidths={columnWidths}
          onColumnWidthsChange={setColumnWidths}
        />
      </>
    );
  }

  await page.render(<TestGrid />);

  await userEvent.click(page.getHeaderCell({ name: 'col2' }));
  await userEvent.keyboard('{Control>}{ArrowRight}{/Control}');
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 210px' });
  await userEvent.click(page.getByRole('button', { name: 'Reset widths' }));
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 200px' });
});

test('should auto resize column when resize handle is double-clicked', async () => {
  const onColumnResize = vi.fn();
  await setup<Row, unknown>({
    columns,
    rows: [
      {
        col1: 1,
        col2: 'a'.repeat(50)
      }
    ],
    onColumnResize
  });
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 200px' });
  await autoResize('col2');
  await testGridTemplateColumns({
    chrome: '100px 327.703px',
    firefox: '100px 327.833px',
    firefoxCI: '100px 400px',
    webkit: '100px 327.703125px',
    webkitCI: '100px 400px'
  });
  await expect
    .poll(() => onColumnResize)
    .toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining(columns[1]),
      // Due to differences in text rendering between browsers, the measured width can vary
      expect.toSatisfy(
        (width) =>
          // Chrome and Firefox on Windows
          (width >= 327.7 && width <= 327.9) ||
          // Firefox/WebKit in CI
          width === 400
      )
    );
});

test('should use the maxWidth if specified on auto resize', async () => {
  await setup<Row, unknown>({
    columns,
    rows: [
      {
        col1: 1,
        col2: 'a'.repeat(500)
      }
    ]
  });
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 200px' });
  await autoResize('col2');
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 400px' });
});

test('should use the minWidth if specified on auto resize', async () => {
  await setup<Row, unknown>({
    columns,
    rows: [
      {
        col1: 1,
        col2: 'a'
      }
    ]
  });
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 200px' });
  await autoResize('col2');
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 100px' });
});

test('should remeasure flex columns when resizing a column', async () => {
  const onColumnResize = vi.fn();
  await setup<
    {
      readonly col1: string;
      readonly col2: string;
      readonly col3: string;
    },
    unknown
  >({
    columns: [
      {
        key: 'col1',
        name: 'col1',
        resizable: true
      },
      {
        key: 'col2',
        name: 'col2',
        resizable: true
      },
      {
        key: 'col3',
        name: 'col3',
        resizable: true
      }
    ],
    rows: [
      {
        col1: 'a'.repeat(10),
        col2: 'a'.repeat(10),
        col3: 'a'.repeat(10)
      }
    ],
    onColumnResize
  });

  await testGridTemplateColumns({
    chrome: '639.328px 639.328px 639.344px',
    firefox: '639.333px 639.333px 639.333px',
    webkit: '639.328125px 639.328125px 639.328125px'
  });
  await autoResize('col1');
  await testGridTemplateColumns({
    chrome: '79.1406px 919.422px 919.438px',
    firefox: '79.1667px 919.417px 919.417px',
    firefoxCI: '100.5px 908.75px 908.75px',
    webkit: '79.140625px 919.421875px 919.421875px',
    webkitCI: '102.796875px 907.59375px 907.59375px'
  });
  await expect.poll(() => onColumnResize).toHaveBeenCalledOnce();
  // onColumnResize is not called if width is not changed
  await autoResize('col1');
  await testGridTemplateColumns({
    chrome: '79.1406px 919.422px 919.438px',
    firefox: '79.1667px 919.417px 919.417px',
    firefoxCI: '100.5px 908.75px 908.75px',
    webkit: '79.140625px 919.421875px 919.421875px',
    webkitCI: '102.796875px 907.59375px 907.59375px'
  });
  expect(onColumnResize).toHaveBeenCalledOnce();
});

test('should use columnWidths and onColumnWidthsChange props when provided', async () => {
  const onColumnWidthsChangeSpy = vi.fn();
  const onColumnResizeSpy = vi.fn();

  function TestGrid() {
    const [columnWidths, setColumnWidths] = useState(
      (): ColumnWidths =>
        new Map<string, ColumnWidth>([
          ['col1', { width: 101, type: 'resized' }],
          ['col2', { width: 201, type: 'resized' }]
        ])
    );

    function onColumnWidthsChange(newColumnWidths: ColumnWidths) {
      setColumnWidths(newColumnWidths);
      onColumnWidthsChangeSpy(newColumnWidths);
    }

    function changedColumnWidths() {
      setColumnWidths(
        new Map<string, ColumnWidth>([
          ['col1', { width: 120, type: 'resized' }],
          ['col2', { width: 120, type: 'resized' }]
        ])
      );
    }

    return (
      <>
        <button type="button" onClick={changedColumnWidths}>
          Change widths
        </button>
        <DataGrid<Row>
          columns={columns}
          rows={[]}
          columnWidths={columnWidths}
          onColumnWidthsChange={onColumnWidthsChange}
          onColumnResize={onColumnResizeSpy}
        />
      </>
    );
  }

  await page.render(<TestGrid />);

  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '101px 201px' });
  await autoResize('col2');
  await expect
    .poll(() => onColumnWidthsChangeSpy)
    .toHaveBeenCalledExactlyOnceWith(
      new Map<string, ColumnWidth>([
        ['col1', { width: 101, type: 'resized' }],
        ['col2', { width: 100, type: 'resized' }]
      ])
    );
  expect(onColumnResizeSpy).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining(columns[1]),
    100
  );
  onColumnWidthsChangeSpy.mockClear();
  onColumnResizeSpy.mockClear();

  await resize('col2', [5, 5, 5]);
  expect(onColumnWidthsChangeSpy).toHaveBeenCalledExactlyOnceWith(
    new Map<string, ColumnWidth>([
      ['col1', { width: 101, type: 'resized' }],
      ['col2', { width: 115, type: 'resized' }]
    ])
  );
  expect(onColumnResizeSpy).toHaveBeenCalledTimes(3);
  expect(onColumnResizeSpy).toHaveBeenNthCalledWith(1, expect.objectContaining(columns[1]), 105);
  expect(onColumnResizeSpy).toHaveBeenNthCalledWith(2, expect.objectContaining(columns[1]), 110);
  expect(onColumnResizeSpy).toHaveBeenNthCalledWith(3, expect.objectContaining(columns[1]), 115);
  onColumnWidthsChangeSpy.mockClear();
  onColumnResizeSpy.mockClear();

  await userEvent.click(page.getByRole('button', { name: 'Change widths' }));
  expect(onColumnWidthsChangeSpy).not.toHaveBeenCalled();
  expect(onColumnResizeSpy).not.toHaveBeenCalled();
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '120px 120px' });

  await resize('col2', [5, 5]);
  expect(onColumnWidthsChangeSpy).toHaveBeenCalledExactlyOnceWith(
    new Map<string, ColumnWidth>([
      ['col1', { width: 120, type: 'resized' }],
      ['col2', { width: 130, type: 'resized' }]
    ])
  );
});

test('should discard the measured and resized widths when the columnWidths prop changes', async () => {
  function TestGrid() {
    const [columnWidths, setColumnWidths] = useState((): ColumnWidths => new Map());

    return (
      <>
        <button type="button" onClick={() => setColumnWidths(new Map())}>
          Reset widths
        </button>
        <DataGrid<Row>
          columns={[{ key: 'col1', name: 'col1' }, columns[1]]}
          rows={[]}
          columnWidths={columnWidths}
          onColumnWidthsChange={setColumnWidths}
        />
      </>
    );
  }

  await page.render(<TestGrid />);

  // the grid is 1918px wide
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '1718px 200px' });
  // the grid ends at the edge of the viewport, so the column is resized from its end inward
  await resize('col2', -50);
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '1768px 150px' });
  await userEvent.click(page.getByRole('button', { name: 'Reset widths' }));
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '1718px 200px' });
});

test('should keep the resized widths when the grid is resized', async () => {
  function TestGrid() {
    const [gridWidth, setGridWidth] = useState(600);
    const [columnWidths, setColumnWidths] = useState((): ColumnWidths => new Map());

    return (
      <>
        <button type="button" onClick={() => setGridWidth(800)}>
          Widen grid
        </button>
        <DataGrid<Row>
          columns={[{ key: 'col1', name: 'col1' }, columns[1]]}
          rows={[]}
          columnWidths={columnWidths}
          onColumnWidthsChange={setColumnWidths}
          style={{ width: gridWidth }}
        />
      </>
    );
  }

  await page.render(<TestGrid />);

  // the grid has a 1px border
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '398px 200px' });
  await resize('col2', 50);
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '348px 250px' });
  // the measured width of `col1` is re-evaluated, but not the resized width of `col2`
  await userEvent.click(page.getByRole('button', { name: 'Widen grid' }));
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '548px 250px' });
});

test('should only use the columnWidths prop as the initial widths without onColumnWidthsChange', async () => {
  await setup<Row, unknown>({
    columns,
    rows: [],
    columnWidths: new Map<string, ColumnWidth>([['col2', { width: 300, type: 'resized' }]])
  });

  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 300px' });
  await resize('col2', 50);
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 350px' });
});

test('should clamp the widths provided via the columnWidths prop', async () => {
  await setup<Row, unknown>({
    columns,
    rows: [],
    columnWidths: new Map<string, ColumnWidth>([
      ['col1', { width: 100, type: 'resized' }],
      // out of the column's bounds, e.g. `maxWidth` was lowered since the width was persisted
      ['col2', { width: 900, type: 'resized' }]
    ]),
    onColumnWidthsChange() {}
  });

  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 400px' });
});

test('should retain the widths of columns that are filtered out', async () => {
  const onColumnWidthsChange = vi.fn();

  function TestGrid() {
    const [columnWidths, setColumnWidths] = useState(
      (): ColumnWidths =>
        new Map<string, ColumnWidth>([
          // an intentional width for a rendered column
          ['col1', { width: 120, type: 'resized' }],
          // `col3` and `col4` are not rendered, e.g. they were filtered out
          // before the widths were persisted
          ['col3', { width: 300, type: 'resized' }],
          // only a measurement, so it is dropped rather than retained
          ['col4', { width: 400, type: 'measured' }]
        ])
    );

    return (
      <DataGrid<Row>
        columns={columns}
        rows={[]}
        columnWidths={columnWidths}
        onColumnWidthsChange={(newColumnWidths) => {
          setColumnWidths(newColumnWidths);
          onColumnWidthsChange(newColumnWidths);
        }}
      />
    );
  }

  await page.render(<TestGrid />);

  await resize('col2', [5, 5, 5]);
  expect(onColumnWidthsChange).toHaveBeenCalledExactlyOnceWith(
    new Map<string, ColumnWidth>([
      ['col1', { width: 120, type: 'resized' }],
      ['col2', { width: 215, type: 'resized' }],
      ['col3', { width: 300, type: 'resized' }]
    ])
  );
});

test('should re-evaluate the measured widths provided via the columnWidths prop', async () => {
  await setup<Row, unknown>({
    columns: [{ key: 'col1', name: 'col1' }, columns[1]],
    rows: [],
    // for example, measured while the grid was wider
    columnWidths: new Map<string, ColumnWidth>([['col1', { width: 1500, type: 'measured' }]]),
    onColumnWidthsChange() {},
    style: { width: 1000 }
  });

  // the grid has a 1px border
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '798px 200px' });
});

test('should keep the resized width when the maxWidth is lowered temporarily', async () => {
  const columnWidths: ColumnWidths = new Map([['col2', { width: 300, type: 'resized' }]]);

  function TestGrid() {
    const [maxWidth, setMaxWidth] = useState(400);

    return (
      <>
        <button type="button" onClick={() => setMaxWidth(250)}>
          Lower maxWidth
        </button>
        <button type="button" onClick={() => setMaxWidth(400)}>
          Raise maxWidth
        </button>
        <DataGrid<Row>
          columns={[columns[0], { ...columns[1], maxWidth }]}
          rows={[]}
          columnWidths={columnWidths}
        />
      </>
    );
  }

  await page.render(<TestGrid />);

  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 300px' });
  await userEvent.click(page.getByRole('button', { name: 'Lower maxWidth' }));
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 250px' });
  await userEvent.click(page.getByRole('button', { name: 'Raise maxWidth' }));
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 300px' });
});

test('should keep percentage columns within their maxWidth while another column is resized', async () => {
  await setup<Row, unknown>({
    columns: [
      { key: 'col1', name: 'col1', width: 80, resizable: true },
      { key: 'col2', name: 'col2', width: '30%', minWidth: 100, maxWidth: 400 },
      { key: 'col3', name: 'col3' }
    ],
    rows: []
  });

  // 30% of 1918px is 575.4px
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '80px 400px 1438px' });
  await userEvent.click(page.getHeaderCell({ name: 'col1' }));
  // keep the key pressed, so the column is still being resized
  await userEvent.keyboard('{Control>}{ArrowRight>}');
  await expect
    .poll(() => page.getHeaderCell({ name: 'col3' }).element().getBoundingClientRect().width)
    .toBe(1428);
  await userEvent.keyboard('{/ArrowRight}{/Control}');
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '90px 400px 1428px' });
});

test('should keep the widths when onColumnWidthsChange is removed', async () => {
  function TestGrid() {
    const [columnWidths, setColumnWidths] = useState((): ColumnWidths => new Map());
    const [isReadOnly, setIsReadOnly] = useState(false);

    return (
      <>
        <button type="button" onClick={() => setIsReadOnly(true)}>
          Read only
        </button>
        <DataGrid<Row>
          columns={columns}
          rows={[]}
          columnWidths={columnWidths}
          onColumnWidthsChange={isReadOnly ? undefined : setColumnWidths}
        />
      </>
    );
  }

  await page.render(<TestGrid />);

  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 200px' });
  await resize('col2', 50);
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 250px' });
  await userEvent.click(page.getByRole('button', { name: 'Read only' }));
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 250px' });
});

test('should not mark a column as resized when auto-sizing does not change its width', async () => {
  const onColumnWidthsChange = vi.fn();
  const onColumnResize = vi.fn();
  await setup<Row, unknown>({
    columns: [{ key: 'col1', name: 'col1', width: 'max-content', resizable: true }, columns[1]],
    rows: [],
    onColumnWidthsChange,
    onColumnResize
  });

  // the content of the column is narrower than its minWidth
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '50px 200px' });
  await autoResize('col1');
  await new Promise(requestAnimationFrame);
  await new Promise(requestAnimationFrame);
  await resize('col2', 10);
  expect(onColumnResize).toHaveBeenCalledExactlyOnceWith(expect.objectContaining(columns[1]), 210);
  expect(onColumnWidthsChange).toHaveBeenCalledExactlyOnceWith(
    new Map<string, ColumnWidth>([
      ['col1', { width: 50, type: 'measured' }],
      ['col2', { width: 210, type: 'resized' }]
    ])
  );
});

async function testGridTemplateColumns(obj: {
  chrome: string;
  firefox: string;
  firefoxCI?: string;
  webkit: string;
  webkitCI?: string;
}) {
  const { browser } = server;
  const gridTemplateColumns =
    browser === 'chromium'
      ? obj.chrome
      : browser === 'webkit'
        ? import.meta.env.CI
          ? (obj.webkitCI ?? obj.webkit)
          : obj.webkit
        : import.meta.env.CI
          ? (obj.firefoxCI ?? obj.firefox)
          : obj.firefox;

  await expect.element(grid).toHaveStyle({ gridTemplateColumns });
}
