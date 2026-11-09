import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad() {
    throw Route.redirect({ to: '/CommonFeatures', replace: true });
  }
});
