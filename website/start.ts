import { createStart } from '@tanstack/react-start';

export const startInstance = createStart(() => ({
  // the demos generate random data and format it in the browser's locale,
  // so they render in the browser, and only the root route renders on the server
  defaultSsr: false
}));
