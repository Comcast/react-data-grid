let consoleErrorOrConsoleWarnWereCalled = false;

beforeAll(() => {
  // replace instead of mutating `console` to avoid infinite loops
  globalThis.console = {
    ...console,
    error(...params) {
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
  if (!consoleErrorOrConsoleWarnWereCalled) {
    return;
  }

  consoleErrorOrConsoleWarnWereCalled = false;

  // Errors thrown in `afterEach` will short-circuit subsequent `afterEach` hooks,
  // thus preventing tests from being cleaned up properly and affecting other tests.
  // We must therefore wait for tests to "finish" before throwing the error.
  onTestFinished(() => {
    throw new Error('console.error() and/or console.warn() were called during the test');
  });
});
