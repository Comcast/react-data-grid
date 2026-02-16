import { useRef, useState } from 'react';
import { css } from 'ecij';
import clsx from 'clsx';
import { DataGrid, type Column, type DataGridHandle } from '../../src';
import { renderCoordinates } from '../renderers';
import { useDirection } from '../directionContext';

export const Route = createFileRoute({
  component: ScrollToCell
});

type Row = number;
const rows: readonly Row[] = Array.from({ length: 200 }, (_, i) => i);
const columns: Column<Row>[] = [];
for (let i = 0; i < 200; i++) {
  const key = String(i);
  columns.push({
    key,
    name: key,
    width: 120,
    frozen: i < 5,
    resizable: true,
    renderCell: renderCoordinates
  });
}

const flexClassname = css`
  display: flex;
  gap: 5px;
  align-items: center;
  margin-block-end: 5px;

  > fieldset {
    display: contents;
  }
`;

const smoothClassname = css`
  scroll-behavior: smooth;
`;

function ScrollToCell() {
  const direction = useDirection();
  const [idx, setIdx] = useState<number | undefined>(10);
  const [rowIdx, setRowIdx] = useState<number | undefined>(10);
  const [scrollBehavior, setScrollBehavior] = useState<ScrollBehavior>('auto');
  const gridRef = useRef<DataGridHandle>(null);

  function scrollToColumn() {
    gridRef.current!.scrollToCell({ idx });
  }

  function scrollToRow() {
    gridRef.current!.scrollToCell({ rowIdx });
  }

  function scrollToCell() {
    gridRef.current!.scrollToCell({ idx, rowIdx });
  }

  return (
    <>
      <div className={flexClassname}>
        <label>
          <span>Column index: </span>
          <input
            style={{ inlineSize: 50 }}
            type="number"
            value={idx ?? ''}
            onChange={(event) => {
              const { valueAsNumber } = event.target;
              setIdx(Number.isNaN(valueAsNumber) ? undefined : valueAsNumber);
            }}
          />
        </label>
        <label>
          <span>Row index: </span>
          <input
            style={{ inlineSize: 50 }}
            type="number"
            value={rowIdx ?? ''}
            onChange={(event) => {
              const { valueAsNumber } = event.target;
              setRowIdx(Number.isNaN(valueAsNumber) ? undefined : valueAsNumber);
            }}
          />
        </label>
        <fieldset>
          <legend>Scroll behavior</legend>
          <label>
            Auto
            <input
              type="radio"
              name="scroll-behavior"
              checked={scrollBehavior === 'auto'}
              onChange={() => {
                setScrollBehavior('auto');
              }}
            />
          </label>
          <label>
            Smooth
            <input
              type="radio"
              name="scroll-behavior"
              checked={scrollBehavior === 'smooth'}
              onChange={() => {
                setScrollBehavior('smooth');
              }}
            />
          </label>
        </fieldset>
      </div>
      <div className={flexClassname}>
        <button type="button" onClick={scrollToCell}>
          Scroll to cell
        </button>
        <button type="button" onClick={scrollToColumn}>
          Scroll to column
        </button>
        <button type="button" onClick={scrollToRow}>
          Scroll to row
        </button>
      </div>
      <DataGrid
        ref={gridRef}
        aria-label="Scroll To Cell Example"
        columns={columns}
        rows={rows}
        className={clsx('fill-grid', { [smoothClassname]: scrollBehavior === 'smooth' })}
        direction={direction}
      />
    </>
  );
}
