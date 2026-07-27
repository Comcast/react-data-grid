import markdown from '@eslint/markdown';
import { defineConfig, globalIgnores } from 'eslint/config';

// ESLint is only kept for markdown linting. Everything else has moved to oxlint (`.oxlintrc.json`).
// `@eslint/markdown` is built on ESLint's language plugin API, which oxlint does not support.
export default defineConfig([
  globalIgnores([
    '.agents',
    '.cache',
    '.claude',
    '.nitro',
    '.output',
    '.tanstack',
    'coverage',
    'dist',
    'lib',
    // linted by oxlint
    '**/*.{js,ts,tsx}'
  ]),

  {
    linterOptions: {
      reportUnusedInlineConfigs: 'warn'
    }
  },

  {
    name: 'markdown',
    files: ['**/*.md'],
    plugins: {
      markdown
    },
    language: 'markdown/gfm',
    rules: {
      // `@eslint/markdown` rules
      // https://github.com/eslint/markdown/blob/main/README.md#rules
      /*
// copy all the rules from the rules table for easy pasting
copy(
  Iterator.from(
    document
      // select rules table
      .querySelector('.markdown-heading:has(> a[href="#rules"]) ~ markdown-accessiblity-table tbody')
      // select all rule links
      .querySelectorAll(':any-link')
  )
    // map link to rule declaration
    .map((link) => `'markdown/${link.textContent}': 1,`)
    .toArray()
    .join('\n')
);
      */
      'markdown/fenced-code-language': 1,
      'markdown/fenced-code-meta': 0,
      'markdown/heading-increment': 1,
      'markdown/no-bare-urls': 1,
      'markdown/no-duplicate-definitions': 1,
      'markdown/no-duplicate-headings': [1, { checkSiblingsOnly: true }],
      'markdown/no-empty-definitions': 1,
      'markdown/no-empty-images': 1,
      'markdown/no-empty-links': 1,
      'markdown/no-html': [1, { allowed: ['br', 'kbd'] }],
      'markdown/no-invalid-label-refs': 1,
      'markdown/no-missing-atx-heading-space': 1,
      'markdown/no-missing-label-refs': 1,
      'markdown/no-missing-link-fragments': 1,
      'markdown/no-multiple-h1': 1,
      'markdown/no-reference-like-urls': 1,
      'markdown/no-reversed-media-syntax': 1,
      'markdown/no-space-in-emphasis': 1,
      'markdown/no-unused-definitions': 1,
      'markdown/require-alt-text': 1,
      'markdown/table-column-count': 1
    }
  }
]);
