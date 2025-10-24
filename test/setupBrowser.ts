import { configure } from 'vitest-browser-react/pure';
import { locators } from 'vitest/browser';

// vitest-browser-react also automatically injects render method on the page
// need to import it so TypeScript can pick up types
import 'vitest-browser-react';

configure({
  reactStrictMode: true
});

locators.extend({
  getBySelector(selector: string) {
    return selector;
  }
});
