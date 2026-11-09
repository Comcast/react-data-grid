import { createFileRoute, Navigate } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Index
});

function Index() {
  // `Navigate` redirects in an effect, after hydration: a redirect in `beforeLoad`
  // would run before it, so the client's first render wouldn't match the prerendered page
  return <Navigate to="/CommonFeatures" replace />;
}
