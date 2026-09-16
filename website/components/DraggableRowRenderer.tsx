import { startTransition, useState, ViewTransition } from 'react';
import { css } from 'ecij';
import clsx from 'clsx';

import { Row, type RenderRowProps } from '../../src';

const draggableRowClassname = css`
  :root:active-view-transition &:focus-within {
    z-index: 1;
  }
`;

const rowOverClassname = css`
  background-color: #ececec;
`;

interface DraggableRowRenderProps<R, SR> extends RenderRowProps<R, SR> {
  onRowReorder: (sourceIndex: number, targetIndex: number) => void;
}

export function DraggableRowRenderer<R, SR>({
  rowIdx,
  className,
  onRowReorder,
  ...props
}: DraggableRowRenderProps<R, SR>) {
  const [isOver, setIsOver] = useState(false);

  className = clsx(className, draggableRowClassname, {
    [rowOverClassname]: isOver
  });

  function onDragStart(event: React.DragEvent<HTMLDivElement>) {
    event.dataTransfer.setData('text/plain', String(rowIdx));
    event.dataTransfer.dropEffect = 'move';
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    // prevent the browser from redirecting in some cases
    event.preventDefault();
    setIsOver(false);

    startTransition(() => {
      onRowReorder(Number(event.dataTransfer.getData('text/plain')), rowIdx);
    });
  }

  function onDragEnter(event: React.DragEvent<HTMLDivElement>) {
    if (isEventPertinent(event)) {
      setIsOver(true);
    }
  }

  function onDragLeave(event: React.DragEvent<HTMLDivElement>) {
    if (isEventPertinent(event)) {
      setIsOver(false);
    }
  }

  return (
    <ViewTransition>
      <Row
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        rowIdx={rowIdx}
        className={className}
        {...props}
      />
    </ViewTransition>
  );
}

// only accept pertinent drag events:
// - ignore drag events going from the container to an element inside the container
// - ignore drag events going from an element inside the container to the container
function isEventPertinent(event: React.DragEvent) {
  const relatedTarget = event.relatedTarget as HTMLElement | null;

  return !event.currentTarget.contains(relatedTarget);
}

function onDragOver(event: React.DragEvent<HTMLDivElement>) {
  // prevent default to allow drop
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}
