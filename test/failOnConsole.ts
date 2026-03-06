let consoleErrorOrConsoleWarnWereCalled = false;

beforeAll(() => {
  // replace instead of mutating `console` to avoid infinite loops
  globalThis.console = {
    ...console,
    error(...params) {
      if (
        params[0] instanceof Error &&
        params[0].message === 'ResizeObserver loop completed with undelivered notifications.'
      ) {
        return;
      }

      consoleErrorOrConsoleWarnWereCalled = true;
      console.log(...params);
    },
    warn(...params) {
      consoleErrorOrConsoleWarnWereCalled = true;
      console.log(...params);
    }
  };
});

afterEach(() => {
  // Wait for both the test and `afterEach` hooks to complete to ensure all logs are caught
  onTestFinished(() => {
    // eslint-disable-next-line vitest/no-standalone-expect
    expect
      .soft(
        consoleErrorOrConsoleWarnWereCalled,
        'console.error() and/or console.warn() were called during the test'
      )
      .toBe(false);

    consoleErrorOrConsoleWarnWereCalled = false;
  });
});
