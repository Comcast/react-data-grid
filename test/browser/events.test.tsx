import { page, userEvent } from 'vite-plus/test/browser';

import { DataGrid } from '../../src';
import type { Column } from '../../src';
import { safeTab } from './utils';

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
      <DataGrid
        columns={columns}
        rows={rows}
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

  it('should be able to open the editor on single click using onCellClick', async () => {
    await page.render(
      <DataGrid
        columns={columns}
        rows={rows}
        onCellClick={(args, event) => {
          if (args.column.key === 'col2') {
            event.preventGridDefault();
            args.setActivePosition(true);
          }
        }}
      />
    );
    await userEvent.click(page.getCell({ name: '1' }));
    await expect.element(page.getByLabelText('col1-editor')).not.toBeInTheDocument();
    await userEvent.click(page.getCell({ name: 'a1' }));
    await expect.element(page.getByRole('textbox', { name: 'col2-editor' })).toBeInTheDocument();
  });

  it('should not open the editor on double click if onCellDoubleClick prevents default', async () => {
    await page.render(
      <DataGrid
        columns={columns}
        rows={rows}
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

  it('should call onCellContextMenu when cell is right-clicked', async () => {
    const onCellContextMenu = vi.fn();
    await page.render(
      <DataGrid columns={columns} rows={rows} onCellContextMenu={onCellContextMenu} />
    );
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

  it('should call onActivePositionChange when the active position changes', async () => {
    const onActivePositionChange = vi.fn();

    await page.render(
      <DataGrid columns={columns} rows={rows} onActivePositionChange={onActivePositionChange} />
    );

    expect(onActivePositionChange).not.toHaveBeenCalled();

    // Activated by click
    await userEvent.click(page.getCell({ name: 'a1' }));
    expect(onActivePositionChange).toHaveBeenLastCalledWith({
      column: expect.objectContaining(columns[1]),
      row: rows[0],
      rowIdx: 0
    });
    expect(onActivePositionChange).toHaveBeenCalledOnce();

    // Activated by double-click
    await userEvent.dblClick(page.getCell({ name: '1' }));
    expect(onActivePositionChange).toHaveBeenLastCalledWith({
      column: expect.objectContaining(columns[0]),
      row: rows[0],
      rowIdx: 0
    });
    expect(onActivePositionChange).toHaveBeenCalledTimes(2);

    // Activated by right-click
    await userEvent.click(page.getCell({ name: '2' }), { button: 'right' });
    expect(onActivePositionChange).toHaveBeenLastCalledWith({
      column: expect.objectContaining(columns[0]),
      row: rows[1],
      rowIdx: 1
    });
    expect(onActivePositionChange).toHaveBeenCalledTimes(3);

    // Activated by ←↑→↓ keys
    await userEvent.keyboard('{ArrowUp}');
    expect(onActivePositionChange).toHaveBeenLastCalledWith({
      column: expect.objectContaining(columns[0]),
      row: rows[0],
      rowIdx: 0
    });
    expect(onActivePositionChange).toHaveBeenCalledTimes(4);

    // Activated by Tab key
    await safeTab();
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

  it('should not call parent handlers if a cell event handler stops propagation', async () => {
    const onParentClick = vi.fn();
    const onParentKeyDown = vi.fn();

    await page.render(
      <div onClick={onParentClick} onKeyDown={onParentKeyDown}>
        <DataGrid
          columns={columns}
          rows={rows}
          onCellClick={(args, event) => {
            if (args.column.key === 'col1') {
              event.stopPropagation();
            }
          }}
          onCellKeyDown={(args, event) => {
            if (args.column?.key === 'col1') {
              event.stopPropagation();
            }
          }}
        />
      </div>
    );

    await userEvent.click(page.getCell({ name: '1' }));
    await userEvent.keyboard('{ArrowRight}');
    expect(onParentClick).not.toHaveBeenCalled();
    expect(onParentKeyDown).not.toHaveBeenCalled();

    await userEvent.click(page.getCell({ name: 'a1' }));
    await userEvent.keyboard('{ArrowLeft}');
    expect(onParentClick).toHaveBeenCalledOnce();
    expect(onParentKeyDown).toHaveBeenCalledOnce();
  });

  it('should let parent handlers know that a cell event handler prevented the default action', async () => {
    const onParentContextMenu = vi.fn((event: React.MouseEvent) => event.isDefaultPrevented());

    await page.render(
      <div onContextMenu={onParentContextMenu}>
        <DataGrid
          columns={columns}
          rows={rows}
          onCellContextMenu={(args, event) => {
            if (args.column.key === 'col1') {
              event.preventDefault();
            }
          }}
        />
      </div>
    );

    await userEvent.click(page.getCell({ name: '1' }), { button: 'right' });
    expect(onParentContextMenu).toHaveLastReturnedWith(true);
    await userEvent.click(page.getCell({ name: 'a1' }), { button: 'right' });
    expect(onParentContextMenu).toHaveLastReturnedWith(false);
  });
});
