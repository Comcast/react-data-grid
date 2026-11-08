import '../root.css';

import { useState, type ReactNode } from 'react';
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import { css } from 'ecij';

import type { Direction } from '../../src';
import { DirectionContext } from '../directionContext';
import Nav from '../Nav';

export const Route = createRootRoute({
  // overrides `defaultSsr: false` in `start.ts`, so the navigation is prerendered
  ssr: true,
  head: () => ({
    meta: [
      { title: 'React Data Grid' },
      {
        name: 'description',
        content: 'Feature-rich and customizable data grid React component.'
      }
    ]
  }),
  shellComponent: Shell,
  component: Root
});

const layoutClassname = css`
  display: grid;
  grid-template-columns: auto 1fr;
`;

const mainClassname = css`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  block-size: 100vh;
  padding: 8px;
  contain: inline-size;
`;

function Shell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function Root() {
  const [direction, setDirection] = useState<Direction>('ltr');

  return (
    <div className={layoutClassname}>
      <DirectionContext value={direction}>
        <Nav direction={direction} onDirectionChange={setDirection} />
        <main dir={direction} className={mainClassname}>
          <Outlet />
        </main>
      </DirectionContext>
    </div>
  );
}
