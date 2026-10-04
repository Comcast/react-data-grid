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

## Validation

Run `vp run ci` before submitting changes. It runs the same checks as CI, and skips any whose inputs haven't changed since they last passed.

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->
