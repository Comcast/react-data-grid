import '../root.css';

import { useState, type ReactNode } from 'react';
import { ClientOnly, createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import { css } from 'ecij';

import type { Direction } from '../../src';
import { Route as CommonFeaturesRoute } from './CommonFeatures';
import { DirectionContext } from '../directionContext';
import Nav from '../Nav';

// prerendering runs on localhost, so canonical links need the URL that GitHub Pages serves
const siteUrl = 'https://comcast.github.io/react-data-grid';

export const Route = createRootRoute({
  head({ matches }) {
    let { pathname, staticData } = matches.at(-1)!;
    // prerendering follows the index route's redirect, so `index.html` is the Common Features page,
    // which `/` hydrates before redirecting: with another head, React would add a second canonical link
    if (pathname === '/') {
      pathname = CommonFeaturesRoute.fullPath;
      staticData = CommonFeaturesRoute.options.staticData!;
    }
    const { title } = staticData;

    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'color-scheme', content: 'light dark' },
        { title: title === undefined ? 'React Data Grid' : `${title} | React Data Grid` },
        {
          name: 'description',
          content: 'Feature-rich and customizable data grid React component'
        }
      ],
      links: [{ rel: 'canonical', href: `${siteUrl}${pathname}` }]
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
      <main id="demo" tabIndex={-1} dir={direction} className={mainClassname}>
        <ClientOnly>
          <Outlet />
        </ClientOnly>
      </main>
    </DirectionContext>
  );
}
