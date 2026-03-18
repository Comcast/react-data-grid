let consoleErrorOrConsoleWarnWereCalled = false;

beforeAll(() => {
  console.error = (...params) => {
    consoleErrorOrConsoleWarnWereCalled = true;
    console.log(...params);
  };

  console.warn = (...params) => {
    consoleErrorOrConsoleWarnWereCalled = true;
    console.log(...params);
  };
});

afterEach(({ task, signal }) => {
  // Wait for the test and all `afterEach` hooks to complete to ensure all logs are caught
  onTestFinished(() => {
    // avoid failing test runs twice
    if (task.result!.state !== 'fail' || signal.aborted) {
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
