import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { ecij } from 'ecij/plugin';
import { defineConfig } from 'vite-plus';
import { playwright, type PlaywrightProviderOptions } from 'vite-plus/test/browser-playwright';
import type { BrowserCommand } from 'vite-plus/test/node';

import pkg from './package.json' with { type: 'json' };

const isCI = process.env.CI === 'true';
const isTest = process.env.VITEST === 'true';

// TODO: remove when `userEvent.pointer` is supported
const resizeColumn: BrowserCommand<[name: string, resizeBy: number | readonly number[]]> = async (
  // @ts-expect-error
  { page, iframe },
  name,
  resizeBy
) => {
  const resizeHandle = iframe
    .getByRole('columnheader', { name, exact: true })
    .locator('.rdg-resize-handle');
  const { x, y } = (await resizeHandle.boundingBox())! as { x: number; y: number };
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
// @ts-expect-error
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

export default defineConfig({
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
  plugins: [
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

  lint: {
    // TODO
  },

  fmt: {
    ignorePatterns: ['/website/routeTree.gen.ts'],
    singleQuote: true,
    trailingComma: 'none',
    sortImports: {
      customGroups: [
        {
          groupName: 'react',
          elementNamePattern: ['react', 'react/**', 'react-dom', 'react-dom/**']
        },
        {
          groupName: 'ecij',
          elementNamePattern: ['ecij']
        },
        {
          groupName: 'clsx',
          elementNamePattern: ['clsx']
        },
        {
          groupName: './src',
          elementNamePattern: ['**/src', '**/src/**']
        },
        {
          groupName: './renderers',
          elementNamePattern: ['**/renderers', '**/renderers/**']
        },
        {
          groupName: './components',
          elementNamePattern: ['**/components', '**/components/**']
        },
        {
          groupName: './hooks',
          elementNamePattern: ['**/hooks', '**/hooks/**']
        },
        {
          groupName: './utils',
          elementNamePattern: ['**/utils', '**/utils/**']
        },
        {
          groupName: './types',
          elementNamePattern: ['**/types', '**/types/**']
        }
      ],
      groups: [
        'side_effect_style',
        'side_effect',
        { newlinesBetween: true },
        'builtin',
        'react',
        'external',
        'ecij',
        'clsx',
        { newlinesBetween: true },
        './src',
        './renderers',
        './components',
        './hooks',
        './utils',
        './types',
        'index',
        'sibling',
        'parent',
        'unknown'
      ],
      newlinesBetween: false
    }
  },

  pack: {
    outDir: 'lib',
    platform: 'neutral',
    sourcemap: true,
    deps: {
      skipNodeModulesBundle: true
    },
    css: {
      fileName: 'styles.css'
    },
    dts: {
      build: true,
      tsconfig: './tsconfig.src.json'
    },
    plugins: [
      ecij({
        // We add the package version as prefix to avoid style conflicts
        // between multiple versions of RDG on the same page
        classPrefix: `rdg-${pkg.version.replaceAll('.', '-')}-`
      })
    ]
  },

  run: {
    tasks: {
      eslint: {
        command: 'eslint --max-warnings 0'
      },
      'eslint:fix': {
        command: 'eslint --fix',
        cache: false
      },
      typecheck: {
        command: 'tsgo --build'
      }
    }
  },

  staged: {
    '*': 'vp fmt'
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
        // @ts-expect-error
        toMatchScreenshot: {
          resolveScreenshotPath({
            // @ts-expect-error
            root,
            // @ts-expect-error
            testFileDirectory,
            // @ts-expect-error
            testFileName,
            // @ts-expect-error
            arg,
            // @ts-expect-error
            browserName,
            // @ts-expect-error
            platform,
            // @ts-expect-error
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
});
