import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { playwright, type PlaywrightProviderOptions } from '@vitest/browser-playwright';
import { ecij } from 'ecij/plugin';
import { Features } from 'lightningcss';
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
const dragFill: BrowserCommand<[from: string, to: string]> = async (
  { page, iframe, project },
  from,
  to
) => {
  await iframe.getByRole('gridcell', { name: from, exact: true }).click();
  await iframe.locator('.rdg-cell-drag-handle').hover();
  await page.mouse.down();
  await iframe.getByRole('gridcell', { name: to, exact: true }).hover();
  if (project.name.includes('webkit')) {
    // let React re-render after handleDragHandlePointerMove calls setDraggedOverRowIdx()
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
  }
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

export default defineConfig(({ isPreview }): ViteUserConfig => ({
  base: '/react-data-grid/',
  cacheDir: 'node_modules/.cache/vite',
  clearScreen: false,
  build: {
    chunkImportMap: true,
    modulePreload: { polyfill: false },
    sourcemap: true,
    rolldownOptions: {
      // TODO: remove
      // https://github.com/vitejs/vite/issues/23350
      experimental: {
        chunkImportMap: {
          baseUrl: '/react-data-grid/'
        }
      },
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'faker',
              test: '@faker-js/faker'
            }
          ]
        }
      }
    }
  },
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      // https://github.com/parcel-bundler/lightningcss/issues/873
      exclude: Features.Nesting | Features.LightDark
    }
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
        react({ compiler: true })
      ],
  server: {
    open: true
  },
  test: {
    dir: 'test',
    globals: true,
    injectCjsGlobals: false,
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
          screenshotDirectory: 'screenshots'
        }
      },
      instances: [
        {
          browser: 'chromium',
          provider: playwright({
            ...playwrightOptions,
            launchOptions: {
              channel: 'chromium',
              args: [
                '--disable-renderer-accessibility',
                '--disable-platform-accessibility-integration'
              ]
            }
          })
        },
        {
          browser: 'firefox',
          provider: playwright({
            ...playwrightOptions,
            launchOptions: {
              firefoxUserPrefs: {
                'accessibility.force_disabled': 1
              }
            }
          }),
          // TODO: remove when FF tests are stable
          fileParallelism: false
        },
        {
          browser: 'webkit',
          provider: playwright(playwrightOptions)
        }
      ]
    },
    projects: [
      {
        test: {
          name: 'browser',
          include: ['browser/**/*.test.*'],
          browser: { enabled: true },
          setupFiles: ['test/browser/styles.css', 'test/setupBrowser.ts', 'test/failOnConsole.ts']
        }
      },
      {
        test: {
          name: 'visual',
          include: ['visual/*.test.*'],
          browser: { enabled: true },
          setupFiles: ['test/setupBrowser.ts', 'test/failOnConsole.ts']
        }
      },
      {
        test: {
          name: 'node',
          include: ['node/**/*.test.*'],
          environment: 'node',
          setupFiles: ['test/failOnConsole.ts']
        }
      }
    ]
  }
}));
