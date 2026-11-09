import '../root.css';

import { useState, type ReactNode } from 'react';
import { ClientOnly, createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import { css } from 'ecij';

import type { Direction } from '../../src';
import { DirectionContext } from '../directionContext';
import Nav from '../Nav';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'React Data Grid' },
      {
        name: 'description',
        content: 'Feature-rich and customizable data grid React component'
      }
    ]
  }),
  shellComponent: Shell,
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

function Shell({ children }: { children: ReactNode }) {
  return (
    <html lang="en-US">
      <head>
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
    <DirectionContext value={direction}>
      <Nav direction={direction} onDirectionChange={setDirection} />
      <main dir={direction} className={mainClassname}>
        <ClientOnly>
          <Outlet />
        </ClientOnly>
      </main>
    </DirectionContext>
  );
}
