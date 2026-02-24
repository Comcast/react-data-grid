# AGENTS.md

## Quick ref

```shell
npm install                  # setup (requires Node.js ≥ 22 for `node --run`)
node --run build             # library → lib/
node --run typecheck         # tsc --build
node --run eslint            # eslint --max-warnings 0
node --run eslint:fix        # eslint --fix
node --run format            # oxfmt
node --run test              # vitest (browser + node)
node --run test -- <path>    # single test, e.g. test/browser/rowHeight.test.ts
```

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
  browser/            # vitest browser-mode tests (Playwright, Chromium + Firefox)
  node/               # vitest SSR tests (Node.js)
  visual/             # vitest visual regression tests (CI-only — never run locally)
website/              # demo site (Vite + TanStack Router)
```

## Conventions

- **Public API** — all exports flow through `src/index.ts`. Keep `README.md` in sync with user-facing changes.
- **Docs** — keep `AGENTS.md` in sync with tooling, conventions, or architectural changes.
- **Default renderers** — `DataGridDefaultRenderersContext` allows overriding default renderers (`renderCheckbox`, `renderSortStatus`, `renderRow`, `renderCell`, `noRowsFallback`) without prop-drilling.
- **TypeScript strict** with `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `erasableSyntaxOnly`. Distinguish missing properties from `undefined` values.
- **`Maybe<T>`** (`T | undefined | null`) — used for all nullable column/render props. Do not use bare `T | undefined`.
- **`NoInfer<>`** — wrap callback parameters to prevent reverse type inference into component generics.
- **CSS layers** — all styles live in nested `@layer rdg.<Name>` sub-layers (e.g. `rdg.Cell`, `rdg.Row`; declared in `src/style/layers.css`). Use `ecij` `css` tagged templates (build-time extraction, not runtime CSS-in-JS). Co-locate styles in component files; `src/style/` is for shared styles.
- **Dual classnames** — components apply both a semantic class (`rdg-cell`) and a generated hash. Preserve both.
- **Light/dark mode** — handled via CSS `light-dark()` + `color-scheme`, not JS.
- **Accessibility first** — ARIA attributes (e.g. `aria-colindex`, `aria-rowindex`, `aria-selected`, roles) are required. Tests query by role.
- **Formatting** — oxfmt (not Prettier). **Linting** — ESLint (must pass with zero warnings).
- **Build** — Rolldown bundles library to `lib/`; `ecij` plugin prefixes classes with `rdg-{version}-` (dots→dashes) to avoid cross-version conflicts.

## Testing

- Browser tests use `vitest/browser` + Playwright. `test/setupBrowser.ts` configures `page.render()` via `vitest-browser-react` and registers custom locators via `locators.extend()` — prefer `page.getGrid()`, `page.getCell({ name })`, `page.getRow()`, `page.getHeaderCell()`, `page.getSelectedCell()`, etc. over raw `page.getByRole()`.
- Test helpers in `test/browser/utils.tsx`: `setup()`, `getRowWithCell()`, `getCellsAtRowIndex()`, `validateCellPosition()`, `scrollGrid()`, `tabIntoGrid()`, `testCount()`, `testRowCount()`.
- `test/failOnConsole.ts` fails tests on unexpected console warnings/errors.
- **Never run visual regression tests locally** — screenshots are CI-only and environment-dependent.

## Validation

Run before submitting changes: `node --run typecheck`, `node --run eslint`, `node --run format`, `node --run test`.
