import { useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  loader({ location }) {
    // the website used to have hash URLs, like `/#/CommonFeatures`;
    // browsers don't send the hash to the server, so they all lead here
    return location.hash.startsWith('/') ? location.hash : '/CommonFeatures';
  },
  component: Index
});

function Index() {
  const href = Route.useLoaderData();
  const navigate = useNavigate();

  // redirect after hydration: a redirect in `beforeLoad` would run before it,
  // so the client's first render wouldn't match the prerendered navigation
  useEffect(() => {
    navigate({ href, replace: true });
  }, [href, navigate]);

  return null;
}
