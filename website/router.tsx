import { createRouter, ErrorComponent } from '@tanstack/react-router';

import { routeTree } from './routeTree.gen';

export function getRouter() {
  return createRouter({
    routeTree,
    caseSensitive: true,
    defaultPendingComponent: PendingComponent,
    defaultErrorComponent: ErrorComponent,
    defaultNotFoundComponent: NotFound,
    defaultPendingMs: 0,
    defaultPendingMinMs: 0,
    defaultPreload: 'intent',
    defaultStructuralSharing: true,
    scrollRestoration: true,
    scrollToTopSelectors: ['.rdg']
  });
}

function PendingComponent() {
  return 'Loading...';
}

function NotFound() {
  return 'Nothing to see here';
}

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    title?: string;
  }
}
