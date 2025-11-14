import { useState } from 'react';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { css } from '@nstep/ecis';

import type { Direction } from '../../src/types';
import { DirectionContext } from '../directionContext';
import Nav from '../Nav';

export const Route = createRootRoute({
  component: Root
});

const mainClassname = css`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  block-size: 100vh;
  padding: 8px;
  contain: inline-size;
`;

function Root() {
  const [direction, setDirection] = useState<Direction>('ltr');

  return (
    <DirectionContext value={direction}>
      <Nav direction={direction} onDirectionChange={setDirection} />
      <main dir={direction} className={mainClassname}>
        <Outlet />
      </main>
    </DirectionContext>
  );
}
