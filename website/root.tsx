import './root.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  createHashHistory,
  createRouter,
  ErrorComponent,
  RouterProvider
} from '@tanstack/react-router';

import { routeTree } from './routeTree.gen';

const router = createRouter({
  routeTree,
  history: createHashHistory(),
  caseSensitive: true,
  defaultErrorComponent: ErrorComponent,
  defaultNotFoundComponent: NotFound,
  defaultPendingMinMs: 0,
  defaultPreload: 'intent',
  defaultStructuralSharing: true,
  scrollRestoration: true
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function NotFound() {
  return 'Nothing to see here';
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
