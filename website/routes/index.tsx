import { createFileRoute, Navigate } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  loader({ location }) {
    // the website used to have hash URLs, like `/#/CommonFeatures`;
    // browsers don't send the hash to the server, so they all lead here
    return location.hash.startsWith('/') ? location.hash : '/CommonFeatures';
  },
  component: Index
});

function Index() {
  const to = Route.useLoaderData();

  // `Navigate` redirects in an effect, after hydration: a redirect in `beforeLoad`
  // would run before it, so the client's first render wouldn't match the prerendered navigation
  return <Navigate to={to} replace />;
}
