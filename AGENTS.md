# AGENTS.md

## Quick ref

```shell
npm install                  # setup (requires Node.js ≥ 22 for `node --run`)
node --run build             # library → lib/
node --run typecheck         # tsgo --build
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
- **Build** — tsdown bundles library to `lib/`; `ecij` plugin prefixes classes with `rdg-{version}-` (dots→dashes) to avoid cross-version conflicts.

## Testing

- Browser tests use `vitest/browser` + Playwright. `test/setupBrowser.ts` configures `page.render()` via `vitest-browser-react` and registers custom locators via `locators.extend()` — prefer `page.getGrid()`, `page.getCell({ name })`, `page.getRow()`, `page.getHeaderCell()`, `page.getActiveCell()`, etc. over raw `page.getByRole()`.
- Test helpers in `test/browser/utils.tsx`: `setup()`, `getRowWithCell()`, `getCellsAtRowIndex()`, `validateCellPosition()`, `scrollGrid()`, `safeTab()`, `testCount()`, `testRowCount()`.
- `test/failOnConsole.ts` fails tests on unexpected console warnings/errors.
- **Never run visual regression tests** — screenshots are environment-dependent so visual regression tests must run in CI only.

## Validation

Run before submitting changes: `node --run typecheck`, `node --run eslint`, `node --run format`, `node --run test`.

<!-- TODO: review -->
<!--VITE PLUS START-->

<!-- # Using Vite+, the Unified Toolchain for the Web -->

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, but it invokes Vite through `vp dev` and `vp build`.

## Vite+ Workflow

`vp` is a global binary that handles the full development lifecycle. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

### Start

- create - Create a new project from a template
- migrate - Migrate an existing project to Vite+
- config - Configure hooks and agent integration
- staged - Run linters on staged files
- install (`i`) - Install dependencies
- env - Manage Node.js versions

### Develop

- dev - Run the development server
- check - Run format, lint, and TypeScript type checks
- lint - Lint code
- fmt - Format code
- test - Run tests

### Execute

- run - Run monorepo tasks
- exec - Execute a command from local `node_modules/.bin`
- dlx - Execute a package binary without installing it as a dependency
- cache - Manage the task cache

### Build

- build - Build for production
- pack - Build libraries
- preview - Preview production build

### Manage Dependencies

Vite+ automatically detects and wraps the underlying package manager such as pnpm, npm, or Yarn through the `packageManager` field in `package.json` or package manager-specific lockfiles.

- add - Add packages to dependencies
- remove (`rm`, `un`, `uninstall`) - Remove packages from dependencies
- update (`up`) - Update packages to latest versions
- dedupe - Deduplicate dependencies
- outdated - Check for outdated packages
- list (`ls`) - List installed packages
- why (`explain`) - Show why a package is installed
- info (`view`, `show`) - View package information from the registry
- link (`ln`) / unlink - Manage local package links
- pm - Forward a command to the package manager

### Maintain

- upgrade - Update `vp` itself to the latest version

These commands map to their corresponding tools. For example, `vp dev --port 3000` runs Vite's dev server and works the same as Vite. `vp test` runs JavaScript tests through the bundled Vitest. The version of all tools can be checked using `vp --version`. This is useful when researching documentation, features, and bugs.

## Common Pitfalls

- **Using the package manager directly:** Do not use pnpm, npm, or Yarn directly. Vite+ can handle all package manager operations.
- **Always use Vite commands to run tools:** Don't attempt to run `vp vitest` or `vp oxlint`. They do not exist. Use `vp test` and `vp lint` instead.
- **Running scripts:** Vite+ built-in commands (`vp dev`, `vp build`, `vp test`, etc.) always run the Vite+ built-in tool, not any `package.json` script of the same name. To run a custom script that shares a name with a built-in command, use `vp run <script>`. For example, if you have a custom `dev` script that runs multiple services concurrently, run it with `vp run dev`, not `vp dev` (which always starts Vite's dev server).
- **Do not install Vitest, Oxlint, Oxfmt, or tsdown directly:** Vite+ wraps these tools. They must not be installed directly. You cannot upgrade these tools by installing their latest versions. Always use Vite+ commands.
- **Use Vite+ wrappers for one-off binaries:** Use `vp dlx` instead of package-manager-specific `dlx`/`npx` commands.
- **Import JavaScript modules from `vite-plus`:** Instead of importing from `vite` or `vitest`, all modules should be imported from the project's `vite-plus` dependency. For example, `import { defineConfig } from 'vite-plus';` or `import { expect, test, vi } from 'vite-plus/test';`. You must not install `vitest` to import test utilities.
- **Type-Aware Linting:** There is no need to install `oxlint-tsgolint`, `vp lint --type-aware` works out of the box.

## CI Integration

For GitHub Actions, consider using [`voidzero-dev/setup-vp`](https://github.com/voidzero-dev/setup-vp) to replace separate `actions/setup-node`, package-manager setup, cache, and install steps with a single action.

```yaml
- uses: voidzero-dev/setup-vp@v1
  with:
    cache: true
- run: vp check
- run: vp test
```

## Review Checklist for Agents

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to validate changes.
<!--VITE PLUS END-->
