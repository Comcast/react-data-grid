import { configure } from 'vitest-browser-react/pure';

// `test/setupBrowser.ts` enables Strict Mode, which would render everything twice
configure({
  reactStrictMode: false
});

// Vitest only provides `bench` as a test fixture, so each benchmark runs in its own test
export function bench(name: string, fn: () => unknown) {
  test(name, async ({ bench }) => {
    await bench(name, fn).run();
  });
}
