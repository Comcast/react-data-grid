import '../root.css';

import { useState, type ReactNode } from 'react';
import { ClientOnly, createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import { css } from 'ecij';

import type { Direction } from '../../src';
import { demos } from '../demos';
import { DirectionContext } from '../directionContext';
import Nav from '../Nav';

// prerendering runs on localhost, so canonical links need the URL that GitHub Pages serves
const siteUrl = 'https://comcast.github.io/react-data-grid';

export const Route = createRootRoute({
  head({ matches }) {
    // prerendering follows the index route's redirect, so `index.html` is the Common Features page,
    // which `/` hydrates before redirecting: with another head, React would add a second canonical link
    const pathname = matches.at(-1)?.pathname;
    const demoPath = pathname === '/' ? '/CommonFeatures' : pathname;
    const demo = demos.find(({ path }) => path === demoPath);

    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'color-scheme', content: 'light dark' },
        { title: demo === undefined ? 'React Data Grid' : `${demo.label} | React Data Grid` },
        {
          name: 'description',
          content: 'Feature-rich and customizable data grid React component'
        }
      ],
      links: demo === undefined ? [] : [{ rel: 'canonical', href: `${siteUrl}${demo.path}` }]
    };
  },
  shellComponent: Shell,
  component: Root
});

const skipLinkClassname = css`
  position: absolute;
  inset-block-start: 8px;
  inset-inline-start: 8px;
  padding: 8px;
  background-color: Canvas;

  &:not(:focus) {
    clip-path: inset(50%);
  }
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
      <a href="#demo" className={skipLinkClassname}>
        Skip to demo
      </a>
      <Nav direction={direction} onDirectionChange={setDirection} />
      {/* focusable, so the skip link moves focus to it */}
      <main id="demo" tabIndex={-1} dir={direction} className={mainClassname}>
        <ClientOnly>
          <Outlet />
        </ClientOnly>
      </main>
    </DirectionContext>
  );
}
