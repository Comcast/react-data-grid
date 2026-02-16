import { isAbsolute } from 'node:path';
import { ecij } from 'ecij/plugin';
import { defineConfig } from 'rolldown';
import { dts } from 'rolldown-plugin-dts';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  input: './src/index.ts',
  output: {
    dir: 'lib',
    cssEntryFileNames: 'styles.css',
    sourcemap: true,
    cleanDir: true
  },
  platform: 'browser',
  external: (id) => !id.startsWith('.') && !isAbsolute(id),
  plugins: [
    ecij({
      // We add the package version as prefix to avoid style conflicts
      // between multiple versions of RDG on the same page
      classPrefix: `rdg-${pkg.version.replaceAll('.', '-')}-`
    }),
    dts({
      tsconfig: './tsconfig.lib.json'
    })
  ]
});
