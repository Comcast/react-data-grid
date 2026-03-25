beforeEach(({ onTestFinished }) => {
  vi.spyOn(console, 'warn').mockName('console.warn');

  // use split mocks to not increase the calls count when ignoring undesired logs
  const errorMock = vi.fn(console.error).mockName('console.error');
  vi.spyOn(console, 'error').mockImplementation(function error(...params) {
    // https://github.com/vitest-dev/vitest/blob/0685b6f027576589464fc6109ddc071ef0079f16/packages/browser/src/client/public/error-catcher.js#L34-L38
    // https://github.com/vitest-dev/vitest/blob/0685b6f027576589464fc6109ddc071ef0079f16/test/browser/fixtures/unhandled-non-error/basic.test.ts
    if (
      params[0] instanceof Error &&
      params[0].message === 'ResizeObserver loop completed with undelivered notifications.'
    ) {
      return;
    }

    return errorMock(...params);
  });

  // Wait for the test and all `afterEach` hooks to complete to ensure all logs are caught
  onTestFinished(({ expect, task, signal }) => {
    // avoid failing test runs twice
    if (task.result?.state === 'fail' || signal.aborted) return;

    expect
      .soft(
        console.warn,
        'console.warn() was called during the test; please resolve unexpected warnings'
      )
      .toHaveBeenCalledTimes(0);
    expect
      .soft(
        errorMock,
        'console.error() was called during the test; please resolve unexpected errors'
      )
      .toHaveBeenCalledTimes(0);
  });
});
