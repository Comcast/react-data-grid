import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { playwright, type PlaywrightProviderOptions } from '@vitest/browser-playwright';
import { ecij } from 'ecij/plugin';
import { defineConfig, type ViteUserConfig } from 'vitest/config';
import type { BrowserCommand } from 'vitest/node';

const isCI = process.env.CI === 'true';
const isTest = process.env.VITEST === 'true';

// TODO: remove when `userEvent.pointer` is supported
const resizeColumn: BrowserCommand<[name: string, resizeBy: number | readonly number[]]> = async (
  { page, iframe },
  name,
  resizeBy
) => {
  const resizeHandle = iframe
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
const dragFill: BrowserCommand<[from: string, to: string]> = async ({ page, iframe }, from, to) => {
  await iframe.getByRole('gridcell', { name: from, exact: true }).click();
  await iframe.locator('.rdg-cell-drag-handle').hover();
  await page.mouse.down();
  const toCell = iframe.getByRole('gridcell', { name: to, exact: true });
  await toCell.hover();
  await page.mouse.up();
};

const actionTimeout = 2000;
const viewport = { width: 1920, height: 1080 } as const;
const playwrightOptions: PlaywrightProviderOptions = {
  actionTimeout,
  contextOptions: {
    viewport
  }
};

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
      cssTarget: 'esnext'
    },
    plugins: isPreview
      ? []
      : [
          ecij(),
          !isTest &&
            tanstackRouter({
              target: 'react',
              generatedRouteTree: 'website/routeTree.gen.ts',
              routesDirectory: 'website/routes',
              autoCodeSplitting: true
            }),
          react()
        ],
    server: {
      open: true
    },
    test: {
      dir: 'test',
      globals: true,
      printConsoleTrace: true,
      env: {
        // @ts-expect-error
        CI: isCI
      },
      coverage: {
        provider: 'istanbul',
        enabled: isCI,
        include: ['src/**/*.{ts,tsx}'],
        reporter: ['json']
      },
      restoreMocks: true,
      sequence: {
        shuffle: {
          files: false,
          tests: true
        }
      },
      expect: {
        poll: {
          timeout: actionTimeout
        }
      },
      slowTestThreshold: 1000,
      browser: {
        headless: true,
        ui: false,
        viewport,
        commands: { resizeColumn, dragFill },
        expect: {
          toMatchScreenshot: {
            resolveScreenshotPath({
              root,
              testFileDirectory,
              testFileName,
              arg,
              browserName,
              platform,
              ext
            }) {
              return `${root}/${testFileDirectory}/screenshots/${testFileName}/${arg}-${browserName}-${platform}${ext}`;
            }
          }
        },
        instances: [
          {
            browser: 'chromium',
            provider: playwright({
              ...playwrightOptions,
              launchOptions: {
                channel: 'chromium'
              }
            })
          },
          {
            browser: 'firefox',
            provider: playwright(playwrightOptions),
            // TODO: remove when FF tests are stable
            fileParallelism: false
          }
        ]
      },
      projects: [
        {
          extends: true,
          test: {
            name: 'browser',
            include: ['browser/**/*.test.*'],
            browser: { enabled: true },
            setupFiles: ['test/browser/styles.css', 'test/setupBrowser.ts', 'test/failOnConsole.ts']
          }
        },
        {
          extends: true,
          test: {
            name: 'visual',
            include: ['visual/*.test.*'],
            browser: { enabled: true },
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
