import { page, userEvent } from 'vitest/browser';

import { DataGrid } from '../../src';
import type { Column, DataGridProps } from '../../src';

interface Row {
  col1: number;
  col2: string;
}

const columns: readonly Column<Row>[] = [
  {
    key: 'col1',
    name: 'Col1',
    renderEditCell(p) {
      return (
        <input
          autoFocus
          type="number"
          aria-label="col1-editor"
          value={p.row.col1}
          onChange={(e) => p.onRowChange({ ...p.row, col1: e.target.valueAsNumber })}
        />
      );
    }
  },
  {
    key: 'col2',
    name: 'Col2',
    renderEditCell({ row, onRowChange }) {
      return (
        <input
          autoFocus
          aria-label="col2-editor"
          value={row.col2}
          onChange={(e) => onRowChange({ ...row, col2: e.target.value })}
        />
      );
    }
  }
];

const rows: readonly Row[] = [
  {
    col1: 1,
    col2: 'a1'
  },
  {
    col1: 2,
    col2: 'a2'
  }
];

describe('Events', () => {
  it('should not select cell if onCellMouseDown prevents grid default', async () => {
    await page.render(
      <EventTest
        onCellMouseDown={(args, event) => {
          if (args.column.key === 'col1') {
            event.preventGridDefault();
          }
        }}
      />
    );
    await userEvent.click(page.getCell({ name: '1' }));
    await expect.element(page.getCell({ name: '1' })).toHaveAttribute('aria-selected', 'false');
    await userEvent.click(page.getCell({ name: 'a1' }));
    await expect.element(page.getCell({ name: 'a1' })).toHaveAttribute('aria-selected', 'true');
  });

  it('should be able to open editor editor on single click using onCellClick', async () => {
    await page.render(
      <EventTest
        onCellClick={(args, event) => {
          if (args.column.key === 'col2') {
            event.preventGridDefault();
            args.setPosition(true);
          }
        }}
      />
    );
    await userEvent.click(page.getCell({ name: '1' }));
    await expect.element(page.getByLabelText('col1-editor')).not.toBeInTheDocument();
    await userEvent.click(page.getCell({ name: 'a1' }));
    await expect.element(page.getByRole('textbox', { name: 'col2-editor' })).toBeInTheDocument();
  });

  it('should not open editor editor on double click if onCellDoubleClick prevents default', async () => {
    await page.render(
      <EventTest
        onCellDoubleClick={(args, event) => {
          if (args.column.key === 'col1') {
            event.preventGridDefault();
          }
        }}
      />
    );
    await userEvent.dblClick(page.getCell({ name: '1' }));
    await expect.element(page.getByLabelText('col1-editor')).not.toBeInTheDocument();
    await userEvent.dblClick(page.getCell({ name: 'a1' }));
    await expect.element(page.getByRole('textbox', { name: 'col2-editor' })).toBeInTheDocument();
  });

  it('should call onCellContextMenu when cell is right clicked', async () => {
    const onCellContextMenu = vi.fn();
    await page.render(<EventTest onCellContextMenu={onCellContextMenu} />);
    expect(onCellContextMenu).not.toHaveBeenCalled();
    await userEvent.click(page.getCell({ name: '1' }), { button: 'right' });
    expect(onCellContextMenu).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        column: expect.objectContaining(columns[0]),
        row: rows[0],
        rowIdx: 0
      }),
      expect.objectContaining({
        type: 'contextmenu'
      })
    );
  });

  it('should call onActivePositionChange when cell selection is changed', async () => {
    const onActivePositionChange = vi.fn();

    await page.render(<EventTest onActivePositionChange={onActivePositionChange} />);

    expect(onActivePositionChange).not.toHaveBeenCalled();

    // Selected by click
    await userEvent.click(page.getCell({ name: 'a1' }));
    expect(onActivePositionChange).toHaveBeenLastCalledWith({
      column: expect.objectContaining(columns[1]),
      row: rows[0],
      rowIdx: 0
    });
    expect(onActivePositionChange).toHaveBeenCalledOnce();

    // Selected by double click
    await userEvent.dblClick(page.getCell({ name: '1' }));
    expect(onActivePositionChange).toHaveBeenLastCalledWith({
      column: expect.objectContaining(columns[0]),
      row: rows[0],
      rowIdx: 0
    });
    expect(onActivePositionChange).toHaveBeenCalledTimes(2);

    // Selected by right-click
    await userEvent.click(page.getCell({ name: '2' }), { button: 'right' });
    expect(onActivePositionChange).toHaveBeenLastCalledWith({
      column: expect.objectContaining(columns[0]),
      row: rows[1],
      rowIdx: 1
    });
    expect(onActivePositionChange).toHaveBeenCalledTimes(3);

    // Selected by ←↑→↓ keys
    await userEvent.keyboard('{ArrowUp}');
    expect(onActivePositionChange).toHaveBeenLastCalledWith({
      column: expect.objectContaining(columns[0]),
      row: rows[0],
      rowIdx: 0
    });
    expect(onActivePositionChange).toHaveBeenCalledTimes(4);

    // Selected by tab key
    await userEvent.keyboard('{Tab}');
    expect(onActivePositionChange).toHaveBeenLastCalledWith({
      column: expect.objectContaining(columns[1]),
      row: rows[0],
      rowIdx: 0
    });
    expect(onActivePositionChange).toHaveBeenCalledTimes(5);

    // go to the header row
    await userEvent.keyboard('{ArrowUp}');
    expect(onActivePositionChange).toHaveBeenLastCalledWith({
      column: expect.objectContaining(columns[1]),
      row: undefined,
      rowIdx: -1
    });
    expect(onActivePositionChange).toHaveBeenCalledTimes(6);
  });
});

type EventProps = Pick<
  DataGridProps<Row>,
  | 'onCellMouseDown'
  | 'onCellClick'
  | 'onCellDoubleClick'
  | 'onCellContextMenu'
  | 'onActivePositionChange'
>;

function EventTest(props: EventProps) {
  return <DataGrid columns={columns} rows={rows} {...props} />;
}
