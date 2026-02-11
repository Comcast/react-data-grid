import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { ecij } from 'ecij/plugin';
import { defineConfig, type ViteUserConfig } from 'vitest/config';
import type { BrowserCommand, BrowserInstanceOption } from 'vitest/node';

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

// vitest modifies the instance objects, so we cannot rely on static objects
function getInstances(): BrowserInstanceOption[] {
  return [
    {
      browser: 'chromium',
      provider: playwright({
        actionTimeout: 1000,
        contextOptions: {
          viewport
        },
        launchOptions: {
          channel: 'chromium'
        }
      })
    },
    {
      browser: 'firefox',
      provider: playwright({
        actionTimeout: 1000,
        contextOptions: {
          viewport
        }
      }),
      // TODO: remove when FF tests are stable
      fileParallelism: false
    }
  ];
}

export default defineConfig(
  ({ isPreview }): ViteUserConfig => ({
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
      ecij(),
      (!isTest || isPreview) &&
        tanstackRouter({
          target: 'react',
          generatedRouteTree: 'website/routeTree.gen.ts',
          routesDirectory: 'website/routes',
          autoCodeSplitting: true,
          verboseFileRoutes: false
        }),
      react({
        exclude: ['./.cache/**/*', './node_modules/**/*', './website/routeTree.gen.ts']
      })
    ],
    server: {
      open: true
    },
    test: {
      dir: 'test',
      globals: true,
      printConsoleTrace: true,
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
          define: {
            __IS_CI__: JSON.stringify(isCI)
          },
          test: {
            name: 'browser',
            include: ['browser/**/*.test.*'],
            browser: {
              ui: false,
              enabled: true,
              trace: {
                mode: isCI ? 'off' : 'retain-on-failure'
              },
              instances: getInstances(),
              commands: { resizeColumn, dragFill, scrollGrid },
              viewport,
              headless: true,
              screenshotFailures: !isCI
            },
            setupFiles: ['test/setupBrowser.ts', 'test/failOnConsole.ts']
          }
        },
        {
          extends: true,
          test: {
            name: 'visual',
            include: ['visual/*.test.*'],
            browser: {
              enabled: true,
              instances: getInstances(),
              viewport,
              headless: true,
              screenshotFailures: false
            },
            setupFiles: ['test/setupBrowser.ts', 'test/failOnConsole.ts']
          }
        },
        {
          extends: true,
          test: {
            name: 'node',
            include: ['node/**/*.test.*'],
            environment: 'node',
            setupFiles: ['test/failOnConsole.ts']
          }
        }
      ]
    }
  })
);
