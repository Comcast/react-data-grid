import { useState } from 'react';
import { css } from '@nstep/ecis';
import clsx from 'clsx';

import { Cell, type CellRendererProps } from '../../src';

const rowDraggingClassname = css`
  opacity: 0.5;
`;

const rowOverClassname = css`
  .rdg-row:has(&) {
    background-color: #ececec;
  }
`;

interface DraggableCellRenderProps<R, SR> extends CellRendererProps<R, SR> {
  onRowReorder: (sourceIndex: number, targetIndex: number) => void;
}

export function DraggableCellRenderer<R, SR>({
  rowIdx,
  className,
  onRowReorder,
  ...props
}: DraggableCellRenderProps<R, SR>) {
  const [isDragging, setIsDragging] = useState(false);
  const [isOver, setIsOver] = useState(false);

  className = clsx(className, {
    [rowDraggingClassname]: isDragging,
    [rowOverClassname]: isOver
  });

  function onDragStart(event: React.DragEvent<HTMLDivElement>) {
    setIsDragging(true);
    // TODO: use a custom drag image to show a preview of the row being dragged
    event.dataTransfer.setDragImage(event.currentTarget.parentElement!.firstElementChild!, 40, 17);
    event.dataTransfer.setData('text/plain', String(rowIdx));
    event.dataTransfer.dropEffect = 'move';
  }

  function onDragEnd() {
    setIsDragging(false);
  }

  function onDragOver(event: React.DragEvent<HTMLDivElement>) {
    // prevent default to allow drop
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    setIsOver(false);
    // prevent the browser from redirecting in some cases
    event.preventDefault();
    onRowReorder(Number(event.dataTransfer.getData('text/plain')), rowIdx);
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
    <Cell
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      rowIdx={rowIdx}
      className={className}
      {...props}
    />
  );
}

// only accept pertinent drag events:
// - ignore drag events going from the container to an element inside the container
// - ignore drag events going from an element inside the container to the container
function isEventPertinent(event: React.DragEvent) {
  const relatedTarget = event.relatedTarget as HTMLElement | null;

  return !event.currentTarget.contains(relatedTarget);
}
