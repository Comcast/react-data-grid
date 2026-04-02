import { ecij } from 'ecij/plugin';
import { defineConfig } from 'tsdown';

import pkg from './package.json' with { type: 'json' };

export default defineConfig({
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
});
