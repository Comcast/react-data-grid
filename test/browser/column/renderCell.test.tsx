import { useState } from 'react';
import { page, userEvent } from 'vitest/browser';

import { DataGrid } from '../../../src';
import type { Column } from '../../../src';
import { renderHeaderCell } from '../../../src/renderHeaderCell';
import { getCellsAtRowIndex, setup } from '../utils';

const cells = page.getCell();

interface Row {
  id: number;
}

describe('renderValue', () => {
  const columns = [
    { key: 'id', name: 'ID' },
    { key: 'name', name: 'Name' }
  ] as const satisfies Column<Row | null>[];

  const rows: readonly Row[] = [{ id: 101 }];

  it('should be used by default', async () => {
    await setup({ columns, rows });
    await expect.element(cells.nth(0)).toHaveTextContent('101');
    await expect.element(cells.nth(1)).toBeEmptyDOMElement();
  });

  it('should handle non-object values', async () => {
    await setup({ columns, rows: [null] });
    await expect.element(cells.nth(0)).toBeEmptyDOMElement();
    await expect.element(cells.nth(1)).toBeEmptyDOMElement();
  });
});

describe('Custom cell content renderer', () => {
  const columns: readonly Column<Row>[] = [
    {
      key: 'id',
      name: 'ID',
      renderCell: (props) => `#${props.row.id}`
    },
    {
      key: 'name',
      name: 'Name',
      renderCell: () => 'No name'
    }
  ];

  const rows: readonly Row[] = [{ id: 101 }];

  it('should replace the default cell content renderer', async () => {
    await setup({ columns, rows });
    await expect.element(cells.nth(0)).toHaveTextContent('#101');
    await expect.element(cells.nth(1)).toHaveTextContent('No name');
  });

  it('can update rows', async () => {
    const onChange = vi.fn();

    const column: Column<Row> = {
      key: 'test',
      name: 'test',
      renderCell(props) {
        function onClick() {
          props.onRowChange({ id: props.row.id + 1 });
        }

        return (
          <button type="button" onClick={onClick}>
            value: {props.row.id}
          </button>
        );
      }
    };

    function Test() {
      const [rows, setRows] = useState<readonly Row[]>([{ id: 1 }]);

      return (
        <DataGrid
          columns={[column]}
          rows={rows}
          onRowsChange={(rows, data) => {
            setRows(rows);
            onChange(rows, data);
          }}
        />
      );
    }

    await page.render(<Test />);

    const cell = cells.first();
    await expect.element(cell).toHaveTextContent('value: 1');
    await userEvent.click(cell.getByRole('button'));
    await expect.element(cell).toHaveTextContent('value: 2');
    expect(onChange).toHaveBeenCalledExactlyOnceWith([{ id: 2 }], {
      column: {
        ...column,
        frozen: false,
        idx: 0,
        level: 0,
        maxWidth: undefined,
        minWidth: 50,
        parent: undefined,
        resizable: false,
        sortable: false,
        draggable: false,
        width: 'auto',
        renderHeaderCell
      },
      indexes: [0]
    });
  });
});

test('Focus child if it sets tabIndex', async () => {
  const column: Column<Row> = {
    key: 'test',
    name: 'test',
    renderCell(props) {
      return (
        <>
          <button type="button" tabIndex={props.tabIndex}>
            Button 1
          </button>
          <span>Text</span>
          <button type="button" tabIndex={-1}>
            Button 2
          </button>
        </>
      );
    }
  };

  await page.render(<DataGrid columns={[column]} rows={[{ id: 1 }]} />);

  const button1 = page.getByRole('button', { name: 'Button 1' });
  const button2 = page.getByRole('button', { name: 'Button 2' });
  const cell = page.getCell({ name: 'Button 1 Text Button 2' });
  await expect.element(button1).toHaveAttribute('tabindex', '-1');
  await expect.element(cell).toHaveAttribute('tabindex', '-1');
  await userEvent.click(page.getByText('Text'));
  await expect.element(button1).toHaveFocus();
  await expect.element(button1).toHaveAttribute('tabindex', '0');
  await userEvent.tab({ shift: true });
  await expect.element(button1).not.toHaveFocus();
  await expect.element(button1).toHaveAttribute('tabindex', '-1');
  await expect.element(cell).toHaveAttribute('tabindex', '-1');
  await userEvent.click(button1);
  await expect.element(button1).toHaveFocus();
  await expect.element(button1).toHaveAttribute('tabindex', '0');
  await expect.element(cell).toHaveAttribute('tabindex', '-1');
  await userEvent.tab({ shift: true });
  await userEvent.click(button2);
  await expect.element(button2).toHaveFocus();
  // It is user's responsibilty to set the tabIndex on button2
  await expect.element(button1).toHaveAttribute('tabindex', '0');
  await expect.element(cell).toHaveAttribute('tabindex', '-1');
  await userEvent.click(button1);
  await expect.element(button1).toHaveFocus();
  await expect.element(button1).toHaveAttribute('tabindex', '0');
  await expect.element(cell).toHaveAttribute('tabindex', '-1');
});

test('Cell should not steal focus when the focus is outside the grid and cell is recreated', async () => {
  const columns: readonly Column<Row>[] = [{ key: 'id', name: 'ID' }];

  function Test() {
    const [rows, setRows] = useState((): readonly Row[] => [{ id: 1 }]);

    function onClick() {
      setRows([{ id: 2 }]);
    }

    return (
      <>
        <button type="button" onClick={onClick}>
          Test
        </button>
        <DataGrid
          columns={columns}
          rows={rows}
          onRowsChange={setRows}
          rowKeyGetter={(row) => row.id}
        />
      </>
    );
  }

  await page.render(<Test />);

  const cell = getCellsAtRowIndex(0).nth(0);
  await userEvent.click(cell);
  await expect.element(cell).toHaveFocus();

  const button = page.getByRole('button', { name: 'Test' });
  await expect.element(button).not.toHaveFocus();
  await userEvent.click(button);
  await expect.element(cell).not.toHaveFocus();
  await expect.element(button).toHaveFocus();
});
