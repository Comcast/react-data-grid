let consoleErrorOrConsoleWarnWereCalled = false;

beforeAll(() => {
  console.error = (...params) => {
    if (
      params[0] instanceof Error &&
      params[0].message === 'ResizeObserver loop completed with undelivered notifications.'
    ) {
      return;
    }

    consoleErrorOrConsoleWarnWereCalled = true;
    console.log(...params);
  };

  console.warn = (...params) => {
    consoleErrorOrConsoleWarnWereCalled = true;
    console.log(...params);
  };
});

afterEach(() => {
  // Wait for the test and all `afterEach` hooks to complete to ensure all logs are caught
  onTestFinished(({ task, signal }) => {
    // avoid failing test runs twice
    if (task.result!.state !== 'fail' && !signal.aborted) {
      expect
        .soft(
          consoleErrorOrConsoleWarnWereCalled,
          'errors/warnings were logged to the console during the test'
        )
        .toBe(false);
    }

    consoleErrorOrConsoleWarnWereCalled = false;
  });
});
