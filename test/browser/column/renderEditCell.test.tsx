import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { commands, page, userEvent } from 'vitest/browser';

import { DataGrid } from '../../../src';
import type { Column, DataGridProps } from '../../../src';
import { getCell, getCellsAtRowIndex, getGrid, getSelectedCell, testCount } from '../utils';

interface Row {
  col1: number;
  col2: string;
}

describe('Editor', () => {
  it('should open editor on double click', async () => {
    await page.render(<EditorTest />);
    const editor = page.getByRole('spinbutton', { name: 'col1-editor' });
    await userEvent.click(getCellsAtRowIndex(0)[0]);
    await expect.element(editor).not.toBeInTheDocument();
    await userEvent.dblClick(getCellsAtRowIndex(0)[0]);
    await expect.element(editor).toHaveValue(1);
    await userEvent.keyboard('2');
    await userEvent.tab();
    await expect.element(editor).not.toBeInTheDocument();
    expect(getCellsAtRowIndex(0)[0]).toHaveTextContent(/^12$/);
  });

  it('should open and commit changes on enter', async () => {
    await page.render(<EditorTest />);
    const editor = page.getByRole('spinbutton', { name: 'col1-editor' });
    await userEvent.click(getCellsAtRowIndex(0)[0]);
    await expect.element(editor).not.toBeInTheDocument();
    await userEvent.keyboard('{enter}');
    await expect.element(editor).toHaveValue(1);
    await userEvent.keyboard('3{enter}');
    expect(getCellsAtRowIndex(0)[0]).toHaveTextContent(/^13$/);
    expect(getCellsAtRowIndex(0)[0]).toHaveFocus();
    await expect.element(editor).not.toBeInTheDocument();
  });

  it('should open editor when user types', async () => {
    await page.render(<EditorTest />);
    await userEvent.click(getCellsAtRowIndex(0)[0]);
    // TODO: await userEvent.keyboard('123{enter}'); fails in FF
    await userEvent.keyboard('{enter}123{enter}');
    expect(getCellsAtRowIndex(0)[0]).toHaveTextContent(/^1123$/);
  });

  it('should close editor and discard changes on escape', async () => {
    await page.render(<EditorTest />);
    await userEvent.dblClick(getCellsAtRowIndex(0)[0]);
    const editor = page.getByRole('spinbutton', { name: 'col1-editor' });
    await expect.element(editor).toHaveValue(1);
    await userEvent.keyboard('2222{escape}');
    await expect.element(editor).not.toBeInTheDocument();
    expect(getCellsAtRowIndex(0)[0]).toHaveTextContent(/^1$/);
    expect(getCellsAtRowIndex(0)[0]).toHaveFocus();
  });

  it('should commit changes and close editor when clicked outside', async () => {
    await page.render(<EditorTest />);
    await userEvent.dblClick(getCellsAtRowIndex(0)[0]);
    const editor = page.getByRole('spinbutton', { name: 'col1-editor' });
    await expect.element(editor).toHaveValue(1);
    await userEvent.keyboard('2222');
    await userEvent.click(page.getByText('outside'));
    await expect.element(editor).not.toBeInTheDocument();
    expect(getCellsAtRowIndex(0)[0]).toHaveTextContent(/^12222$/);
  });

  it('should commit quickly enough on outside clicks so click event handlers access the latest rows state', async () => {
    const onSave = vi.fn();
    await page.render(<EditorTest onSave={onSave} />);
    await userEvent.dblClick(getCellsAtRowIndex(0)[0]);
    await userEvent.keyboard('234');
    expect(onSave).not.toHaveBeenCalled();
    const saveButton = page.getByRole('button', { name: 'save' });

    // without delay, `click()` triggers both `mousedown` and `click` events
    // too quickly for outside clicks to be detected
    await userEvent.click(saveButton, { delay: 10 });

    expect(onSave).toHaveBeenCalledExactlyOnceWith([
      { col1: 1234, col2: 'a1' },
      { col1: 2, col2: 'a2' }
    ]);
  });

  it('should scroll to the editor if selected cell is not in the viewport', async () => {
    const rows: Row[] = [];
    for (let i = 0; i < 99; i++) {
      rows.push({ col1: i, col2: `${i}` });
    }

    await page.render(<EditorTest gridRows={rows} />);
    await userEvent.click(getCellsAtRowIndex(0)[0]);
    const selectedRowCells = page
      .getByRole('row')
      .filter({ has: getSelectedCell() })
      .getByRole('gridcell');
    await testCount(selectedRowCells, 2);
    await commands.scrollGrid({ scrollTop: 2001 });
    await testCount(selectedRowCells, 1);
    const editor = page.getByRole('spinbutton', { name: 'col1-editor' });
    await expect.element(editor).not.toBeInTheDocument();
    expect(getGrid().element().scrollTop).toBe(2001);
    // TODO: await userEvent.keyboard('123'); fails in FF
    await userEvent.keyboard('{enter}123');
    await testCount(selectedRowCells, 2);
    await expect.element(editor).toHaveValue(123);
    expect(getGrid().element().scrollTop).toBe(0);
  });

  describe('editable', () => {
    it('should be editable if an editor is specified and editable is undefined/null', async () => {
      await page.render(<EditorTest />);
      const cell = getCellsAtRowIndex(0)[1];
      expect(cell).not.toHaveAttribute('aria-readonly');
      await userEvent.dblClick(cell);
      await expect.element(page.getByRole('textbox', { name: 'col2-editor' })).toBeInTheDocument();
    });

    it('should be editable if an editor is specified and editable is set to true', async () => {
      await page.render(<EditorTest editable />);
      await userEvent.dblClick(getCellsAtRowIndex(0)[1]);
      await expect.element(page.getByRole('textbox', { name: 'col2-editor' })).toBeInTheDocument();
    });

    it('should not be editable if editable is false', async () => {
      await page.render(<EditorTest editable={false} />);
      const cell = getCellsAtRowIndex(0)[1];
      expect(cell).toHaveAttribute('aria-readonly', 'true');
      await userEvent.dblClick(cell);

      await expect
        .element(page.getByRole('textbox', { name: 'col2-editor' }))
        .not.toBeInTheDocument();
    });

    it('should not be editable if editable function returns false', async () => {
      await page.render(<EditorTest editable={(row) => row.col1 === 2} />);
      await userEvent.dblClick(getCellsAtRowIndex(0)[1]);
      const editor = page.getByRole('textbox', { name: 'col2-editor' });
      await expect.element(editor).not.toBeInTheDocument();

      await userEvent.dblClick(getCellsAtRowIndex(1)[1]);
      await expect.element(editor).toBeInTheDocument();
    });
  });

  describe('editorOptions', () => {
    it('should detect outside click if editor is rendered in a portal', async () => {
      await page.render(
        <EditorTest createEditorPortal editorOptions={{ displayCellContent: true }} />
      );
      await userEvent.dblClick(getCellsAtRowIndex(0)[1]);
      const editor1 = page.getByRole('textbox', { name: 'col2-editor' });
      await expect.element(editor1).toHaveValue('a1');
      await userEvent.keyboard('23');
      // The cell value should update as the editor value is changed
      expect(getCellsAtRowIndex(0)[1]).toHaveTextContent(/^a123$/);
      // clicking in a portal does not count as an outside click
      await userEvent.click(editor1);
      await expect.element(editor1).toBeInTheDocument();
      // true outside clicks are still detected
      await userEvent.click(page.getByText('outside'));
      await expect.element(editor1).not.toBeInTheDocument();
      expect(getCellsAtRowIndex(0)[1]).not.toHaveFocus();

      await userEvent.dblClick(getCellsAtRowIndex(0)[1]);
      await userEvent.click(page.getByRole('textbox', { name: 'col2-editor' }));
      await userEvent.keyboard('{enter}');
      expect(getCellsAtRowIndex(0)[1]).toHaveFocus();
    });

    it('should not commit on outside click if commitOnOutsideClick is false', async () => {
      await page.render(
        <EditorTest
          editorOptions={{
            commitOnOutsideClick: false
          }}
        />
      );
      await userEvent.dblClick(getCellsAtRowIndex(0)[1]);
      const editor = page.getByRole('textbox', { name: 'col2-editor' });
      await expect.element(editor).toBeInTheDocument();
      await userEvent.click(page.getByText('outside'));
      await expect.element(editor).toBeInTheDocument();
      await userEvent.click(editor);
      await userEvent.keyboard('{enter}');
      await expect.element(editor).not.toBeInTheDocument();
    });

    it('should not open editor if onCellKeyDown prevents the default event', async () => {
      await page.render(
        <EditorTest
          onCellKeyDown={(args, event) => {
            if (args.mode === 'SELECT' && event.key === 'x') {
              event.preventGridDefault();
            }
          }}
        />
      );
      await userEvent.click(getCellsAtRowIndex(0)[1]);
      // TODO: await userEvent.keyboard('yz{enter}'); fails in FF
      await userEvent.keyboard('{enter}yz{enter}');
      expect(getCellsAtRowIndex(0)[1]).toHaveTextContent(/^a1yz$/);
      await userEvent.keyboard('x');
      await expect
        .element(page.getByRole('textbox', { name: 'col2-editor' }))
        .not.toBeInTheDocument();
    });

    it('should prevent navigation if onCellKeyDown prevents the default event', async () => {
      await page.render(
        <EditorTest
          onCellKeyDown={(args, event) => {
            if (args.mode === 'EDIT' && event.key === 'ArrowDown') {
              event.preventGridDefault();
              args.onClose(true);
            }
          }}
        />
      );
      await userEvent.dblClick(getCellsAtRowIndex(0)[1]);
      await userEvent.keyboard('a{arrowleft}b{arrowright}c{arrowdown}'); // should commit changes on arrowdown
      expect(getCellsAtRowIndex(0)[1]).toHaveTextContent(/^a1bac$/);
    });

    it('should close the editor when closeOnExternalRowChange is true or undefined and row is changed from outside', async () => {
      await page.render(
        <EditorTest
          editorOptions={{
            // needed to prevent editor from closing on update button click
            commitOnOutsideClick: false
          }}
        />
      );
      await userEvent.dblClick(getCellsAtRowIndex(0)[1]);
      const editor = page.getByRole('textbox', { name: 'col2-editor' });
      await expect.element(editor).toBeInTheDocument();
      await userEvent.click(page.getByRole('button', { name: 'update' }));
      await expect.element(editor).not.toBeInTheDocument();
    });

    it('should not close the editor when closeOnExternalRowChange is false and row is changed from outside', async () => {
      await page.render(
        <EditorTest
          editorOptions={{
            commitOnOutsideClick: false,
            closeOnExternalRowChange: false
          }}
        />
      );
      await userEvent.dblClick(getCellsAtRowIndex(0)[1]);
      const editor = page.getByRole('textbox', { name: 'col2-editor' });
      await expect.element(editor).toBeInTheDocument();
      await userEvent.click(page.getByRole('button', { name: 'update' }));
      await expect.element(editor).toBeInTheDocument();
    });
  });

  describe('editor focus', () => {
    it('should not steal focus back to the cell if the editor is not in the viewport and another cell is clicked', async () => {
      const rows: Row[] = [];
      for (let i = 0; i < 99; i++) {
        rows.push({ col1: i, col2: `name${i}` });
      }

      await page.render(<EditorTest gridRows={rows} />);

      await userEvent.dblClick(getCell('name0'));
      await userEvent.keyboard('abc');

      await commands.scrollGrid({ scrollTop: 1500 });
      await userEvent.click(getCell('name43'));
      await expect.element(getSelectedCell()).toHaveTextContent(/^name43$/);
      await commands.scrollGrid({ scrollTop: 0 });
      await expect.element(getCell('name0abc')).toBeVisible();
    });

    it('should not steal focus back to the cell after being closed by clicking outside the grid', async () => {
      const columns: readonly Column<NonNullable<unknown>>[] = [
        {
          key: 'col1',
          name: 'Column1',
          renderEditCell() {
            return <input aria-label="col1-input" value="123" readOnly autoFocus />;
          }
        },
        {
          key: 'col2',
          name: 'Column2',
          renderEditCell({ onClose }) {
            return (
              <input
                aria-label="col2-input"
                value="123"
                readOnly
                autoFocus
                onBlur={() => {
                  onClose(true, false);
                }}
              />
            );
          },
          editorOptions: {
            commitOnOutsideClick: false
          }
        }
      ];

      await page.render(
        <>
          <input aria-label="outer-input" value="abc" readOnly />
          <DataGrid columns={columns} rows={[{}]} />
        </>
      );

      const outerInput = page.getByRole('textbox', { name: 'outer-input' });
      await userEvent.dblClick(getCellsAtRowIndex(0)[0]);
      const col1Input = page.getByRole('textbox', { name: 'col1-input' });
      await expect.element(col1Input).toHaveFocus();
      await userEvent.click(outerInput);
      await expect.element(outerInput).toHaveFocus();
      await expect.element(col1Input).not.toBeInTheDocument();
      await expect.element(outerInput).toHaveFocus();

      await userEvent.dblClick(getCellsAtRowIndex(0)[1]);
      const col2Input = page.getByRole('textbox', { name: 'col2-input' });
      await expect.element(col2Input).toHaveFocus();
      await userEvent.click(outerInput);
      await expect.element(outerInput).toHaveFocus();
      await expect.element(col2Input).not.toBeInTheDocument();
    });
  });
});

interface EditorTestProps
  extends Pick<Column<Row>, 'editorOptions' | 'editable'>,
    Pick<DataGridProps<Row>, 'onCellKeyDown'> {
  onSave?: (rows: readonly Row[]) => void;
  gridRows?: readonly Row[];
  createEditorPortal?: boolean;
}

const initialRows: readonly Row[] = [
  {
    col1: 1,
    col2: 'a1'
  },
  {
    col1: 2,
    col2: 'a2'
  }
];

function EditorTest({
  editable,
  editorOptions,
  onCellKeyDown,
  onSave,
  gridRows = initialRows,
  createEditorPortal
}: EditorTestProps) {
  const [rows, setRows] = useState(gridRows);

  const columns = useMemo((): readonly Column<Row>[] => {
    return [
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
        editable,
        renderEditCell({ row, onRowChange }) {
          const editor = (
            <input
              autoFocus
              aria-label="col2-editor"
              value={row.col2}
              onChange={(e) => onRowChange({ ...row, col2: e.target.value })}
            />
          );

          return createEditorPortal ? createPortal(editor, document.body) : editor;
        },
        editorOptions
      }
    ];
  }, [editable, editorOptions, createEditorPortal]);

  return (
    <>
      <div
        onClick={(e) => e.stopPropagation()}
        onClickCapture={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseDownCapture={(e) => e.stopPropagation()}
      >
        outside
      </div>
      <button type="button" onClick={() => onSave?.(rows)}>
        save
      </button>
      <button
        type="button"
        onClick={() => {
          setRows((rows) => rows.map((row) => ({ ...row })));
        }}
      >
        update
      </button>
      <DataGrid
        columns={columns}
        rows={rows}
        onRowsChange={setRows}
        onCellKeyDown={onCellKeyDown}
      />
    </>
  );
}
