import { css } from '@nstep/ecis';

const cellExpandClassname = css`
  block-size: 100%;
  align-content: center;
  text-align: center;
  cursor: pointer;
`;

interface CellExpanderFormatterProps {
  tabIndex: number;
  expanded: boolean;
  onCellExpand: () => void;
}

export function CellExpanderFormatter({
  tabIndex,
  expanded,
  onCellExpand
}: CellExpanderFormatterProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLSpanElement>) {
    if (e.key === ' ' || e.key === 'Enter') {
      // prevent scrolling
      e.preventDefault();
      onCellExpand();
    }
  }

  return (
    <div className={cellExpandClassname} onClick={onCellExpand} onKeyDown={handleKeyDown}>
      <span tabIndex={tabIndex}>{expanded ? '\u25BC' : '\u25B6'}</span>
    </div>
  );
}
