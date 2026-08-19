beforeEach(({ onTestFinished }) => {
  vi.spyOn(console, 'warn').mockName('console.warn');
  vi.spyOn(console, 'error').mockName('console.error');

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
        console.error,
        'console.error() was called during the test; please resolve unexpected errors'
      )
      .toHaveBeenCalledTimes(0);
  });
});
