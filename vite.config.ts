import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import wyw from '@wyw-in-js/vite';
import { defineConfig, type ViteUserConfig } from 'vitest/config';
import type { BrowserCommand } from 'vitest/node';

const isCI = process.env.CI === 'true';
const isTest = process.env.NODE_ENV === 'test';

// TODO: remove when `userEvent.pointer` is supported
const resizeColumn: BrowserCommand<[name: string, resizeBy: number | readonly number[]]> = async (
  context,
  name,
  resizeBy
) => {
  const page = context.page;
  const frame = await context.frame();
  const resizeHandle = frame
    .getByRole('columnheader', { name, exact: true })
    .locator('.rdg-resize-handle');
  const { x, y } = (await resizeHandle.boundingBox())!;
  await page.mouse.move(x + 5, y + 5);
  await page.mouse.down();
  resizeBy = Array.isArray(resizeBy) ? resizeBy : [resizeBy];
  let newX = x + 5;
  for (const value of resizeBy) {
    newX += value;
    await page.mouse.move(newX, y + 5);
  }
  await page.mouse.up();
};

// TODO: remove when `userEvent.pointer` is supported
const dragFill: BrowserCommand<[from: string, to: string]> = async (context, from, to) => {
  const page = context.page;
  const frame = await context.frame();
  await frame.getByRole('gridcell', { name: from }).click();
  await frame.locator('.rdg-cell-drag-handle').hover();
  await page.mouse.down();
  const toCell = frame.getByRole('gridcell', { name: to });
  await toCell.hover();
  await page.mouse.up();
};

const scrollGrid: BrowserCommand<[{ scrollLeft?: number; scrollTop?: number }]> = async (
  context,
  { scrollLeft, scrollTop }
) => {
  const frame = await context.frame();
  await frame.getByRole('grid').evaluate(
    (grid: HTMLDivElement, { scrollLeft, scrollTop }) => {
      if (scrollLeft !== undefined) {
        grid.scrollLeft = scrollLeft;
      }
      if (scrollTop !== undefined) {
        grid.scrollTop = scrollTop;
      }
    },
    { scrollLeft, scrollTop }
  );
};

const viewport = { width: 1920, height: 1080 } as const;

export default defineConfig(
  ({ command, isPreview }): ViteUserConfig => ({
    base: '/react-data-grid/',
    cacheDir: '.cache/vite',
    clearScreen: false,
    build: {
      modulePreload: { polyfill: false },
      sourcemap: true,
      reportCompressedSize: false,
      // https://github.com/parcel-bundler/lightningcss/issues/873
      cssMinify: 'esbuild'
    },
    plugins: [
      (!isTest || isPreview) &&
        tanstackRouter({
          target: 'react',
          generatedRouteTree: 'website/routeTree.gen.ts',
          routesDirectory: 'website/routes',
          autoCodeSplitting: true,
          verboseFileRoutes: false
        }),
      react({
        exclude: ['./.cache/**/*']
      }),
      wyw({
        exclude: ['./.cache/**/*', '**/*.d.ts', '**/*.gen.ts'],
        preprocessor: 'none',
        displayName: command === 'serve'
      })
    ],
    server: {
      open: true
    },
    test: {
      globals: true,
      coverage: {
        provider: 'istanbul',
        enabled: isCI,
        include: ['src/**/*.{ts,tsx}'],
        reporter: ['json']
      },
      restoreMocks: true,
      sequence: {
        shuffle: true
      },
      slowTestThreshold: 1000,
      projects: [
        {
          extends: true,
          test: {
            name: 'browser',
            include: ['test/browser/**/*.test.*'],
            browser: {
              ui: false,
              // TODO: remove when FF tests are stable
              fileParallelism: false,
              enabled: true,
              provider: playwright({
                contextOptions: {
                  viewport
                }
              }),
              trace: {
                mode: isCI ? 'off' : 'retain-on-failure'
              },
              instances: [{ browser: 'chromium' }, { browser: 'firefox' }],
              commands: { resizeColumn, dragFill, scrollGrid },
              viewport,
              headless: true,
              screenshotFailures: !isCI
            },
            setupFiles: ['test/setupBrowser.ts']
          }
        },
        {
          extends: true,
          test: {
            name: 'visual',
            include: ['test/visual/*.test.*'],
            browser: {
              enabled: true,
              provider: playwright({
                contextOptions: {
                  viewport
                }
              }),
              instances: [{ browser: 'chromium' }, { browser: 'firefox' }],
              viewport,
              headless: true,
              screenshotFailures: false
            },
            setupFiles: ['test/setupBrowser.ts']
          }
        },
        {
          extends: true,
          test: {
            name: 'node',
            include: ['test/node/**/*.test.*'],
            environment: 'node'
          }
        }
      ]
    }
  })
);
