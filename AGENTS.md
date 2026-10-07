# AGENTS.md

## Architecture

react-data-grid is a data grid with **zero `dependencies`** (peer dependency: React 19.2+). It uses CSS Grid for layout and implements row/column virtualization in JS.

```text
src/
  index.ts            # public API surface; all exports go through here
  DataGrid.tsx        # main <DataGrid> component (generic: <R, SR, K>)
  TreeDataGrid.tsx    # wraps DataGrid, adds row grouping (role="treegrid")
  types.ts            # shared type definitions (e.g. Column, CalculatedColumn, render props, events)
  hooks/              # shared custom React hooks
  utils/              # pure utilities (e.g. keyboard, DOM, events, colSpan, style)
  style/              # build-time CSS via ecij tagged templates; layers.css declares @layer order
  cellRenderers/      # default cell renderers (e.g. checkbox, toggleGroup, value)
  editors/            # default editors (renderTextEditor)
test/
  browser/            # vitest browser-mode tests (Playwright: Chromium, Firefox, WebKit)
  node/               # vitest SSR tests (Node.js)
  visual/             # vitest visual regression tests (CI-only — never run locally)
website/              # demo site (Vite + TanStack Router)
```

## Conventions

- **Public API** — all exports flow through `src/index.ts`. Keep `README.md` in sync with user-facing changes.
- **Docs** — keep `AGENTS.md` in sync with tooling, conventions, or architectural changes.
- **Default renderers** — `DataGridRenderersContext` allows overriding default renderers (`renderCheckbox`, `renderSortStatus`, `renderRow`, `renderCell`, `noRowsFallback`) without prop-drilling.
- **TypeScript strict** with `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `erasableSyntaxOnly`. Distinguish missing properties from `undefined` values.
- **`Maybe<T>`** (`T | undefined | null`) — used for all nullable column/render props. Do not use bare `T | undefined`.
- **`NoInfer<>`** — wrap callback parameters to prevent reverse type inference into component generics.
- **CSS layers** — all styles live in nested `@layer rdg.<Name>` sub-layers (e.g. `rdg.Cell`, `rdg.Row`; declared in `src/style/layers.css`). Use `ecij` `css` tagged templates (build-time extraction, not runtime CSS-in-JS). Co-locate styles in component files; `src/style/` is for shared styles.
- **Dual classnames** — components apply both a semantic class (`rdg-cell`) and a generated hash. Preserve both.
- **Light/dark mode** — handled via CSS `light-dark()` + `color-scheme`, not JS.
- **Accessibility first** — ARIA attributes (e.g. `aria-colindex`, `aria-rowindex`, `aria-selected`, roles) are required. Tests query by role.
- **Build** — `vp pack` bundles the library to `lib/`; `ecij` plugin prefixes classes with `rdg-{version}-` (dots→dashes) to avoid cross-version conflicts.

## Testing

- Browser tests use `vite-plus/test/browser` + Playwright. `test/setupBrowser.ts` configures `page.render()` via `vitest-browser-react` and registers custom locators via `locators.extend()` — prefer `page.getGrid()`, `page.getCell({ name })`, `page.getRow()`, `page.getHeaderCell()`, `page.getActiveCell()`, etc. over raw `page.getByRole()`.
- Test helpers in `test/browser/utils.tsx`: `setup()`, `getRowWithCell()`, `getCellsAtRowIndex()`, `validateCellPosition()`, `scrollGrid()`, `safeTab()`, `testCount()`, `testRowCount()`.
- `test/failOnConsole.ts` fails tests on unexpected console warnings/errors.
- **Never run visual regression tests** — screenshots are environment-dependent so visual regression tests must run in CI only.

## Tooling

The project uses [Vite+](https://viteplus.dev/guide/), whose global `vp` CLI wraps Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Run `vp` directly, not through `npx`. Its docs are in `node_modules/vite-plus/docs`.

- `vp <command>` runs a built-in command, e.g. `vp dev`, `vp check`, `vp test`, `vp pack`, `vp build`.
- `vp run <task>` runs a task from `vite.config.ts`, e.g. `vp run typecheck`, `vp run eslint`, `vp run ci`.
- Run `vp install` after pulling changes.

## Validation

Run `vp run ci` before submitting changes. It runs the same checks as CI, and skips any whose inputs haven't changed since they last passed.

While iterating, run individual checks instead. The static checks take seconds, so run them before tests:

- `vp run typecheck` type checks with `tsc --build`; `vp check` does not type check.
- `vp check --fix` formats and lints, fixing what it can. Without `--fix`, a formatting error stops it before linting.
- `vp run eslint` lints Markdown files.
- `vp test <files>` runs specific test files, e.g. `vp test test/browser/sorting.test.tsx`. Add `--project "browser (chromium)"` to test in a single browser, or `--project node` to run the SSR test. The full suite takes about a minute.
