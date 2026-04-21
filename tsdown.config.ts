import { ecij } from 'ecij/plugin';
import { Features } from 'lightningcss';
import { defineConfig } from 'tsdown';

import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  outDir: 'lib',
  target: ['baseline-widely-available', 'node24.0.0'],
  platform: 'neutral',
  sourcemap: true,
  deps: {
    skipNodeModulesBundle: true
  },
  css: {
    fileName: 'styles.css',
    lightningcss: {
      // https://github.com/parcel-bundler/lightningcss/issues/873
      exclude: Features.Nesting | Features.LightDark
    }
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
});
