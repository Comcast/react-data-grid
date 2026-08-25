# Proposed changes

## Summary

1. **Per-cell custom styling** — `column.styleCellClass(row, column)` and
   `column.myCellStyle` (object or `(row, colIdx) => style`) added to
   `Column` in `src/types.ts`, wired into `src/Cell.tsx`.
2. **`fixTop` / `fixLeft` navigation bounds** — new `DataGrid` props that
   stop keyboard navigation/selection from moving above `fixTop` data rows
   or left of `fixLeft` columns (without affecting pointer-driven selection
   or header-row navigation). Implemented in `src/DataGrid.tsx` (see
   `minNavRowIdx`, `fixLeft` usage in `getNextPosition`/`navigate`) and
   `src/utils/activePositionUtils.ts` (`canExitGrid` gained `minColIdx`,
   `getNextActivePosition`'s `CHANGE_ROW` column-wrap respects `minColIdx`).
3. **Row spanning** — new `column.rowSpan(args)` returning
   `[spanIndex, totalSpan]`; only the `spanIndex === 1` "master" cell
   renders and visually covers the following rows via CSS
   `grid-row-end: span N`. New file `src/utils/rowSpanUtils.ts`
   (`getRowSpan`, `isRowSpanCovered`), wired into `src/Row.tsx` (filters
   out covered cells, computes span for the master, and stretches the
   row's own grid track to match the largest span it contains so the
   `subgrid` row template has enough tracks to span into) and `src/Cell.tsx`
   / `src/utils/styleUtils.ts` (`getCellStyle` gained a `rowSpan` param).
   Demo: `website/routes/RowSpanning.tsx`, linked in `website/Nav.tsx`.
4. **Enter-to-advance in cell editor** ("Excel-like" — commit + move down
   one row). `src/DataGrid.tsx`'s `getNextPosition` gained an `'Enter'`
   case (same as `ArrowDown`) reached only via the editor's own
   `navigate(event)` call, not the normal active-cell key handler.
   `src/EditCell.tsx`'s `handleKeyDown` now calls `onClose(true, false)`
   then `navigate(event)` on Enter.

## Verification done

- `npm run build` (tsdown, library) — clean
- `npm run build:website` (vite) — clean
- `npm run typecheck` (`tsc --build`) — clean
- `npm run eslint` — 0 errors, 0 warnings
- `npm run format:check` (oxfmt) — clean
- Row spanning and Enter-to-advance were visually verified live in a
  headless-Chromium browser (Playwright) against the Vite dev server.

## Known gaps / things to watch

- `npm test` (vitest) has one pre-existing failing test
  (`test/browser/column/renderEditCell.test.tsx`, "should open and commit
  changes on enter") that asserts the old behavior — focus staying on the
  same cell after committing an edit with Enter. This is superseded by the
  new Enter-to-advance behavior (item 4 above) and the test needs updating
  to match.
- No changes were made to `EditCell.tsx`'s styling to account for
  `rowSpan` while editing a spanned cell — only `Cell.tsx` got
  span-aware styling.
