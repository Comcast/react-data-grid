// TEMPORARY: WebKit stall experiment, records the page's main-thread stalls and test timings
// with wall-clock times, so stalls can be compared across pages and with memory samples
import { server } from 'vite-plus/test/browser';

const INTERVAL = 5;
const THRESHOLD = 100;

let file = '';
let currentTest = '(before the first test)';
let testStart = 0;
let tests: { name: string; start: number; end: number }[] = [];
let stalls: { start: number; end: number; test: string }[] = [];
let last = performance.now();

setInterval(() => {
  const now = performance.now();
  if (now - last - INTERVAL > THRESHOLD) {
    const end = Date.now();
    stalls.push({ start: Math.round(end - (now - last)), end, test: currentTest });
  }
  last = now;
}, INTERVAL);

// registered before the other setup files' hooks, so it runs first
beforeEach(({ task }) => {
  file = task.file.name;
  currentTest = task.name;
  testStart = Date.now();
});

afterEach(({ task }) => {
  tests.push({ name: task.name, start: testStart, end: Date.now() });
  currentTest = `(after ${task.name})`;
});

// one log per file, so the experiment doesn't flood the console
afterAll(() => {
  // oxlint-disable-next-line eslint/no-console
  console.info(`STALLS ${JSON.stringify({ browser: server.browser, file, tests, stalls })}`);
  tests = [];
  stalls = [];
});
