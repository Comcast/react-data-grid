import { createHashHistory, createRouter, ErrorComponent } from '@tanstack/react-router';

import { routeTree } from './routeTree.gen';

export const router = createRouter({
  routeTree,
  history: createHashHistory(),
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

// Register the router instance for type safety
declare module '@tanstack/router-core' {
  interface Register {
    router: typeof router;
  }
}

function PendingComponent() {
  return 'Loading...';
}

function NotFound() {
  return 'Nothing to see here';
}
