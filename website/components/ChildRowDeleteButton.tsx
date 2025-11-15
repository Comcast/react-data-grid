import { css } from 'ecij';

const childRowActionCrossClassname = css`
  block-size: 100%;
  &::before,
  &::after {
    content: '';
    position: absolute;
    background: grey;
  }

  &::before {
    inset-inline-start: 21px;
    inline-size: 1px;
    block-size: 100%;
  }

  &::after {
    inset-block-start: 50%;
    inset-inline-start: 21px;
    block-size: 1px;
    inline-size: 15px;
  }

  &:hover {
    background: red;
  }
`;

const childRowButtonClassname = css`
  cursor: pointer;
  position: absolute;
  inset-inline-start: 21px;
  transform: translateX(-50%);
  filter: grayscale(1);
  &:dir(rtl) {
    transform: translateX(50%);
  }
`;

interface ChildRowDeleteButtonProps {
  tabIndex: number;
  isDeleteSubRowEnabled: boolean;
  onDeleteSubRow: () => void;
}

export function ChildRowDeleteButton({
  tabIndex,
  onDeleteSubRow,
  isDeleteSubRowEnabled
}: ChildRowDeleteButtonProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLSpanElement>) {
    if (e.key === 'Enter') {
      // prevent scrolling
      e.preventDefault();
      onDeleteSubRow();
    }
  }

  return (
    <>
      <div className={childRowActionCrossClassname} />
      {isDeleteSubRowEnabled && (
        <div className={childRowButtonClassname} onClick={onDeleteSubRow}>
          <span tabIndex={tabIndex} onKeyDown={handleKeyDown}>
            ❌
          </span>
        </div>
      )}
    </>
  );
}
