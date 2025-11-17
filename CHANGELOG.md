# Changelog

## v7.0.0-canary.48

- Fixed an edge case where clicking outside the grid wouldn't close and commit an open editor quickly enough, resulting in the previous rows state being used by parent components in `click` handlers. ([PR](https://github.com/Comcast/react-data-grid/pull/2415))
- Support for filters has been removed, along with: ([PR](https://github.com/Comcast/react-data-grid/pull/2412))
  - The `<DataGrid />` props: `headerFiltersHeight`, `filters`, `onFiltersChange`, `enableFilterRow`
  - `Column.filterRenderer`
  - The exports: `FilterRendererProps`, `Filters`
- Optional `Column` props can now also be `null` in addition to `undefined`. ([PR](https://github.com/Comcast/react-data-grid/pull/2409))

## v7.0.0-canary.47

- Added a third, optional generic on `<DataGrid />` to specify the row key type. ([PR](https://github.com/Comcast/react-data-grid/pull/2311))
- Added the `useRowSelection` hook for custom cell renderers to access `isRowSelected` and `onRowSelectionChange`. ([PR](https://github.com/Comcast/react-data-grid/pull/2338))
- `HeaderRendererProps.allRowsSelected` tweaks, affecting the `SelectColumn`: ([PR](https://github.com/Comcast/react-data-grid/pull/2402))
  - It will now be `false` when `rows.length === 0` instead of `true`.
  - `selectedRows` must contain all the row keys for `allRowsSelected` to be `true`, instead of naively comparing the `size` and `length`.
- Optional props on `<DataGrid />` can now also be `null` in addition to `undefined`. ([PR](https://github.com/Comcast/react-data-grid/pull/2406))

## v7.0.0-canary.46

- Optimize onRowsChange: only update changed rows ([PR](https://github.com/Comcast/react-data-grid/pull/2390))

## v7.0.0-canary.45

- Fixed issue where the scrollbars would flicker in edge cases ([PR](https://github.com/Comcast/react-data-grid/pull/2389))

## v7.0.0-canary.44

- Use aria-selected to style selected cell/rows ([PR](https://github.com/Comcast/react-data-grid/pull/2386))
- Add support for variable row heights ([PR](https://github.com/Comcast/react-data-grid/pull/2384))

## v7.0.0-canary.43

- Fix `aria-readonly` ([PR](https://github.com/Comcast/react-data-grid/pull/2380))

## v7.0.0-canary.42

- Add missing `aria-colspan` ([PR](https://github.com/Comcast/react-data-grid/pull/2374))
- Add `aria-readonly` to readonly cells ([PR](https://github.com/Comcast/react-data-grid/pull/2379))

## v7.0.0-canary.41

- Fix summary row colSpan ([PR](https://github.com/Comcast/react-data-grid/pull/2372))
- HeaderCell: Add missing event parameter to onPointerUp, fix #2305 ([PR](https://github.com/Comcast/react-data-grid/pull/2371))

## v7.0.0-canary.40

- Add `column.colSpan` prop to merge cells ([PR](https://github.com/Comcast/react-data-grid/pull/2356))
- Removed prefixed css properties from the generated style file ([PR](https://github.com/Comcast/react-data-grid/pull/2370))

## v7.0.0-canary.39

- Add `enableVirtualization` prop ([PR](https://github.com/Comcast/react-data-grid/pull/2355)). Grid renders all the rows/columns when it is set to false.

## v7.0.0-canary.38

- Fix summary row position ([PR](https://github.com/Comcast/react-data-grid/pull/2335))

## v7.0.0-canary.37

- Add `summaryRowHeight` prop ([PR](https://github.com/Comcast/react-data-grid/pull/2325))
- Rollup type definitions ([PR](https://github.com/Comcast/react-data-grid/pull/2301))

## v7.0.0-canary.36

- Fixed column headers not showing when grid is horizontally scrolled ([PR](https://github.com/Comcast/react-data-grid/pull/2297))

## v7.0.0-canary.35

- Migrate to css-in-js with linaria ([PR](https://github.com/Comcast/react-data-grid/pull/2256)). RDG now internally uses [linaria](https://github.com/callstack/linaria) to manage styles. The stylesheets are automatically injected and there is no stylesheet to manually import anymore.
- Expose data grid root element reference ([PR](https://github.com/Comcast/react-data-grid/pull/2258)).
- (Bug fix) Tabbing into the grid should initiate keyboard navigation ([PR](https://github.com/Comcast/react-data-grid/pull/2289)).

## v7.0.0-canary.34

- Only show the vertical scrollbar when necessary ([PR](https://github.com/Comcast/react-data-grid/pull/2231))
- Fix `editorPortalTarget` default value for server-side rendering ([PR](https://github.com/Comcast/react-data-grid/pull/2245))
- Use grid layout for rows, split column metrics from compute columns ([PR](https://github.com/Comcast/react-data-grid/pull/2272)). Resizing columns no longer recreates columns so less re-renders
- Augment `onRowsChange` with `indexes` and `column` data ([PR](https://github.com/Comcast/react-data-grid/pull/2278))

## v7.0.0-canary.33

- (Bug) Commit changes before exiting grid ([PR](https://github.com/Comcast/react-data-grid/pull/2224))

## v7.0.0-canary.32

- Fix importing rdg with webpack 4 ([PR](https://github.com/Comcast/react-data-grid/pull/2221))

## v7.0.0-canary.31

- (Breaking) Remove some exports from the grid ([PR](https://github.com/Comcast/react-data-grid/pull/2210))
- Use a pseudo-element for header resizer ([PR](https://github.com/Comcast/react-data-grid/pull/2217))
- (new) Formatters now receive a new onRowChange prop ([PR](https://github.com/Comcast/react-data-grid/pull/2220))
- (new) Change `column.name` type from `string` to `string/ReactElement` ([PR](https://github.com/Comcast/react-data-grid/pull/2220))
- Publish bundles instead of modules, use babel only for transpilation ([PR](https://github.com/Comcast/react-data-grid/pull/2214))
- Use the new jsx runtime ([PR](https://github.com/Comcast/react-data-grid/pull/2184)). The minimum supported react version is 16.14 now.

## v7.0.0-canary.30

- Forward sorting props to `headerRenderer` ([PR](https://github.com/Comcast/react-data-grid/pull/2204))
- Disable cell navigation while editing. This behavior can be controlled using the new `column.editorOptions.onNavigation` option ([PR](https://github.com/Comcast/react-data-grid/pull/2196))

## v7.0.0-canary.29

- Fix crash when `rows` are `undefined` ([PR](https://github.com/Comcast/react-data-grid/pull/2197))
- Fix a scrolling bug caused by `scroll-behavior: smooth` ([PR](https://github.com/Comcast/react-data-grid/pull/2200))

## v7.0.0-canary.28

- (Breaking) Removed `onRowsUpdate`, `enableCellCopyPaste`, and `enableCellDragAndDrop` props. Added 2 new props (`onFill` and `onPaste`) ([PR](https://github.com/Comcast/react-data-grid/pull/2194))
- (Breaking) Rename `enableFilters` to `enableFilterRow` ([PR](https://github.com/Comcast/react-data-grid/pull/2195))

## v7.0.0-canary.27

- (Breaking) Removed old editor API ([PR](https://github.com/Comcast/react-data-grid/pull/2149))
- (Breaking) Removed `onCheckCellIsEditable` prop ([PR](https://github.com/Comcast/react-data-grid/pull/2016)). Use `column.editable` instead.
  = (Breaking) Replaced rowKey prop with rowKeyGetter ([PR](https://github.com/Comcast/react-data-grid/pull/2190))

## v7.0.0-canary.26

- Fixed Copy & Paste events not working properly in non-English keyboards ([PR](https://github.com/Comcast/react-data-grid/pull/2097))

## v7.0.0-canary.25

- Added support for webpack 5 ([PR](https://github.com/Comcast/react-data-grid/pull/2178))

## v7.0.0-canary.24

- Fixed a bug where grid was getting scrolled on cell focus

## v7.0.0-canary.23

- Minor style fixes

## v7.0.0-canary.22

- Add Grouping ([PR](https://github.com/Comcast/react-data-grid/pull/2106)). Check the new [example](https://comcast.github.io/react-data-grid/#/grouping).
- (Breaking) Removed `height` and `width` props and added new `className` and `style` props. We are now using `ResizeObserver` to calculate all the grid dimensions ([PR](https://github.com/Comcast/react-data-grid/pull/2130))
- (Breaking) Removed formatterOptions. Grid now handles formatter focus internally so this prop is no longer required ([PR](https://github.com/Comcast/react-data-grid/pull/2138))
- Added support for React 17

## v7.0.0-canary.21

- Editor2 bug fixes ([PR](https://github.com/Comcast/react-data-grid/pull/2126))
- `formatterOptions.focusable` can be a function now so different rows can have different focus behavior for the same column
- Grid now internally uses `ResizeObserver` API to calculate the available width ([PR](https://github.com/Comcast/react-data-grid/pull/2129))

## v7.0.0-canary.20

- A new editor api that does not require a ref ([PR](https://github.com/Comcast/react-data-grid/pull/2102))
- A new `columnDefaultOptions` prop. This replaces `minColumnWidth` and `defaultFormatter` props ([PR](https://github.com/Comcast/react-data-grid/pull/2117))

## v7.0.0-canary.19

- Allow setting ref on `Cell/Row` renderers ([PR](https://github.com/Comcast/react-data-grid/pull/2111))

## v7.0.0-canary.18

- Accessibility improvements. Added various aria attributes. ([PR](https://github.com/Comcast/react-data-grid/pull/2084))
- Removed enableCellAutoFocus prop ([PR](https://github.com/Comcast/react-data-grid/pull/2073))
- Removed InteractionMasks component. This is an internal change to prepare for grouping and it fixes a few selected cell position bugs
- Improved focus for custom formatters using the new formatterOptions ([PR](https://github.com/Comcast/react-data-grid/pull/2104))

## v7.0.0-canary.17

- Performance improvements ([PR](https://github.com/Comcast/react-data-grid/pull/2015))
- A new rowClass prop ([PR](https://github.com/Comcast/react-data-grid/pull/2058))

## `alpha` to `canary`

- **Added:**
  - **Props:**
    - `className`
    - `style`
    - `onRowsChange`
    - `onFill`
    - `onPaste`
    - `onSelectedCellChange`
      - ⚠️ This replaces the `onCellSelected` and `onCellDeSelected` props
    - `enableFilterRow`
      - ⚠️ This replaces the `enableHeaderFilters` and `column.filterable` props
    - `filters`
    - `onFiltersChange`
    - `rows`
      - ⚠️ This replace the `rowGetter` and `rowsCount` props
    - `rowClass`
    - `defaultColumnOptions`
      - ⚠️ This replaces the `minColumnWidth` and `defaultFormatter` props
    - `groupBy`
    - `rowGrouper`
      - More info in [#2106](https://github.com/Comcast/react-data-grid/pull/2106)
  - `column.cellClass(row)` function support:
    - `column = { ..., cellClass(row) { return string; } }`
  - `column.minWidth`
  - `column.maxWidth`
  - `column.headerCellClass`
  - `column.editor`
    - New API
  - `column.editorOptions`
    - More info in [#2102](https://github.com/Comcast/react-data-grid/pull/2102)
  - `column.groupFormatter`
    - More info in [#2106](https://github.com/Comcast/react-data-grid/pull/2106)
  - `scrollToRow` method
    - ⚠️ This replaces the `scrollToRowIndex` prop
  - Dark mode support
    - Dark mode is automatically applied following user preference
    - Light and dark modes can be forced by setting the `rdg-light` or `rdg-dark` class names.
- **Removed:**
  - **Support:**
    - ⚠️ IE11
  - **Packages:**
    - ⚠️ `react-data-grid-addons`
  - **Props:**
    - ⚠️ `width`
    - ⚠️ `height`
    - ⚠️ `cellContentRenderer`
    - ⚠️ `contextMenu`
      - Check the [Context Menu](https://comcast.github.io/react-data-grid/#/context-menu) example
    - ⚠️ `enableCellSelect`
    - ⚠️ `enableCellAutoFocus`
    - ⚠️ `getValidFilterValues`
    - ⚠️ `onCellCopyPaste`
    - ⚠️ `onSelectedCellRangeChange`
    - ⚠️ `onCheckCellIsEditable`
      - Use `column.editable` instead.
    - ⚠️ `onGridKeyDown`
    - ⚠️ `onGridKeyUp`
    - ⚠️ `onRowDoubleClick`
    - ⚠️ `onRowsUpdate`
      - Use `onRowsChange`, `onFill`, and `onPaste` instead.
    - ⚠️ `onHeaderDrop`
    - ⚠️ `draggableHeaderCell`
      - Check [#2007](https://github.com/Comcast/react-data-grid/pull/2007) on how to migrate
    - ⚠️ `rowGroupRenderer`
    - ⚠️ `onRowExpandToggle`
      - Check [#2012](https://github.com/Comcast/react-data-grid/pull/2012) on how to migrate
    - ⚠️ `rowsContainer`
    - ⚠️ Subrow props: `getSubRowDetails`, `onCellExpand`, `onDeleteSubRow`, and `onAddSubRow`
      - Check [#1853](https://github.com/Comcast/react-data-grid/pull/1853) on how to migrate
    - ⚠️ `cellMetaData` (from `Row` and `Cell` props)
    - ⚠️ `value` (from `column.formatter` props)
  - **Ref handlers:**
    - ⚠️ `openCellEditor`, use `selectCell` instead.
  - ⚠️ React elements are no longer supported, please use components instead.
    - For example:
    ```diff
    const column = {
      key: 'example',
      name: 'Example',
    - formatter: <CustomFormatter length={5} />
    + formatter: (props) => <CustomFormatter {...props} length={5} />
    };
    ```
  - ⚠️ `column.events`
  - ⚠️ `column.getCellActions`
    - Check [#1845](https://github.com/Comcast/react-data-grid/pull/1845) on how to migrate
  - ⚠️ `column.getRowMetaData`
  - ⚠️ `column.minColumnWidth`
  - ⚠️ `column.filterable`
  - ⚠️ `column.draggable`
  - ⚠️ `cellRangeSelection.{onStart,onUpdate,onEnd}`
  - ⚠️ `fromRowId`, `toRowId`, and `fromRowData` from `onRowsUpdate` argument
  - ⚠️ Stopped exporting `HeaderCell`
- **Renamed:**
  - ⚠️ `minHeight` to `height`
  - ⚠️ `minWidth` to `width`
  - ⚠️ `onGridSort` to `onSort`
  - ⚠️ `emptyRowsView` to `emptyRowsRenderer`
  - ⚠️ `rowKey` to `rowKeyGetter`
  - ⚠️ `rowData` to `row`
  - ⚠️ `fromRowData` to `fromRow`
  - ⚠️ `idx` to `rowIdx` in `Row` renderer
- **Changed:**
  - ⚠️ Started publishing ES2019/ESM modules instead of ES5/CommonJS modules.
    - Using [`@babel/preset-env`](https://www.npmjs.com/package/@babel/preset-env) with [`core-js`](https://www.npmjs.com/package/core-js) is recommended to enable compatibility for the browsers your project aims to support.
  - ⚠️ Improved support for summary rows:
    - `summaryRows` types are now independent from `rows`
    - Added `column.summaryCellClass` and `column.summaryFormatter` props
    - `column.formatter` isn't used anymore to render summary row cells.
  - Only visible headers cells are now rendered. [#1837](https://github.com/Comcast/react-data-grid/pull/1837)
  - ⚠️ the `rowKeyGetter` prop is now required for row selection.
  - ⚠️ `column.cellClass` does not affect header cells anymore.
  - ⚠️ `onScroll` will directly pass the UIEvent rather than the scrollLeft and scrollRight only.
  - ⚠️ The stylesheets are now automatically injected, there is no stylsheet to manually import anymore.

## `main` to `alpha`

- **Added:**
  - TypeScript declaration files
  - `column.cellContentRenderer`
    - More info in this [gist](https://gist.github.com/nstepien/090298c3c2d94324cb332c33d82fdcfb)
  - `summaryRows` prop [#1773](https://github.com/Comcast/react-data-grid/pull/1773)
  - `sortColumn` and `sortDirection` props
    - ⚠️ The internal sort states have been removed.
    - Check [#1768](https://github.com/Comcast/react-data-grid/pull/1768) on how to migrate.
  - `selectedRows` and `onSelectedRowsChange` props
    - ⚠️ Row selection has been reimplemented.
    - A new `SelectColumn` is now available to import and add a row selection column.
    - Check [#1762](https://github.com/Comcast/react-data-grid/pull/1762) on how to migrate.
- **Removed:**
  - **Packages:**
    - `react-data-grid-examples`
      - Use the website as reference, or clone the repo locally and run `npm install` + `npm start`
  - **Props:**
    - ⚠️ `onCellsDragged`
    - ⚠️ `onDragHandleDoubleClick`
    - ⚠️ `onRows`
    - ⚠️ `onRowUpdated`
    - ⚠️ `rowScrollTimeout`
    - ⚠️ `toolbar`
      - Check [#1769](https://github.com/Comcast/react-data-grid/pull/1769) on how to migrate
    - ⚠️ `isScrolling` (from `column.formatter` props)
  - ⚠️ `ContainerEditorWrapper`
  - ⚠️ `EditorBase`
  - ⚠️ `setScrollLeft` from `Row` and `Cell` renderers
    - `setScrollLeft` instance method was previously required on custom Cell and Row renderers and it can be safely removed now.
    - More info in [#1793](https://github.com/Comcast/react-data-grid/pull/1793)
  - ⚠️ Dropped ImmutableJS support.
  - ⚠️ Dropped dynamic height row support.
    - This was not officially supported, but it was still possible to implement dynamic rows via custom Row renderer. This was a buggy feature so it has been removed.
  - ⚠️ Removed row reordering support.
- **Renamed:**
  - `ReactDataGrid` to `DataGrid`
- **Changed:**
  - ⚠️ The stylesheets are now bundled separately:
    - `react-data-grid/dist/react-data-grid.css`
  - ⚠️ Reimplemented stylesheets, renamed various class names [#1780](https://github.com/Comcast/react-data-grid/pull/1780)
    - No longer depends on bootstrap
  - Resizing a column now immediately resizes all its cells instead of just its header.
  - Improved performance across the board.

### react-data-grid-addons

- ⚠️ `react-data-grid-addons` has no default export anymore
  - Use `import * as DataGridAddons from 'react-data-grid-addons';` instead
- ⚠️ The stylesheets are now bundled separately:
  - `react-data-grid-addons/dist/react-data-grid-addons.css`
- **Removed:**
  - ⚠️ `AutoComplete` editor
  - ⚠️ `Utils`

## 5.0.5 (Dec 6, 2018)

- **Bugfix:** fix: draggable resizing col jumps to right ([1421](https://github.com/Comcast/react-data-grid/pull/1421))
- **Bugfix:** Cell Tooltip - Focus Issues ([1422](https://github.com/Comcast/react-data-grid/pull/1422))

## 6.0.1 (Nov 30, 2018)

- **Bugfix:** Fix formatter exports ([1409](https://github.com/Comcast/react-data-grid/pull/1409))

## 6.0.0 (Nov 30, 2018)

- **Bugfix:** Fix outside click logic for committing changes ([1404](https://github.com/Comcast/react-data-grid/pull/1404))
- **TechDebt** Add ESLint Rules ([1396](https://github.com/Comcast/react-data-grid/pull/1396) [1397](https://github.com/Comcast/react-data-grid/pull/1397) [1396](https://github.com/Comcast/react-data-grid/pull/1398) [1399](https://github.com/Comcast/react-data-grid/pull/1399))
- **TechDebt:** Upgrade build tools to latest versions ([1350](https://github.com/Comcast/react-data-grid/pull/1350))
- **Feature:** Cleanup zIndex logic ([1393](https://github.com/Comcast/react-data-grid/pull/1393))
- **Breaking** Use react portals for cell editors ([1369](https://github.com/Comcast/react-data-grid/pull/1369))
- **TechDebt:** Upgrade build tools to latest versions ([1350](https://github.com/Comcast/react-data-grid/pull/1350))

## 5.0.4 (Nov 14, 2018)

- **Bugfix:** Custom Formatters Example - Styling Fix ([1364](https://github.com/Comcast/react-data-grid/pull/1364))
- **Bugfix:** Fix website publishing and remove ImmutableJS dependency ([1366](https://github.com/Comcast/react-data-grid/pull/1366))
- **Bugfix:** Remove react-data-grid dependency from the addons package ([1354](https://github.com/Comcast/react-data-grid/pull/1354))
- **Bugfix:** Fix drag fill in IE 11 ([1359](https://github.com/Comcast/react-data-grid/pull/1359))
- **Bugfix:** Ensure webpack uses correct common js external ref ([1370](https://github.com/Comcast/react-data-grid/pull/1370))
- **Feature:** Move DropTargetRowContainer static styles to CSS class for user customization ([1308](https://github.com/Comcast/react-data-grid/pull/1308))
- **Bugfix:** Replace use of i for column index which is no longer passed in ([1344](https://github.com/Comcast/react-data-grid/pull/1344))
- **Bugfix:** Remove utils from documentation as an exported module ([1374](https://github.com/Comcast/react-data-grid/pull/1374))
- **TechDebt:** Upgrade eslint packages ([1376](https://github.com/Comcast/react-data-grid/pull/1376))
- **Bugfix:** Cleanup DraggableContainer and fix styles ([1379](https://github.com/Comcast/react-data-grid/pull/1379))

## 5.0.3 (Nov 1, 2018)

- **Bugfix:** Fix frozen-columns source url ([1355](https://github.com/Comcast/react-data-grid/pull/1355))
- **TechDebt:** Defining the ref callback as a bound method ([1353](https://github.com/Comcast/react-data-grid/pull/1353))
- **Bugfix:** Fix cell focusing logic ([1352](https://github.com/Comcast/react-data-grid/pull/1352))
- **Bugfix:** RDG Tree Cell Expand Styling Issues ([1316](https://github.com/Comcast/react-data-grid/pull/1316))

## 5.0.2 (Oct 30, 2018)

- **Bugfix:** Fix grouping example ([1311](https://github.com/Comcast/react-data-grid/pull/1311))
- **Bugfix:** Remove contain layout css ([1346](https://github.com/Comcast/react-data-grid/pull/1346))
- **Bugfix:** Preserve window scroll position on cell selection ([1349](https://github.com/Comcast/react-data-grid/pull/1346))

## 5.0.1 (Oct 22, 2018)

### React-Data-Grid

- **Bugfix:** Fix CopyMask columns ([1289](https://github.com/Comcast/react-data-grid/pull/1272))

## 5.0.0 (Oct 22, 2018)

### React-Data-Grid

- **Feature:** Improve Cell navigation Performance ([1123](https://github.com/Comcast/react-data-grid/pull/1123))
- **Feature:** Scrolling improvements ([1254](https://github.com/Comcast/react-data-grid/pull/1254))
- **Feature:** Remove react-data-grid dependency from react-data-grid-addons bundle ([1272](https://github.com/Comcast/react-data-grid/pull/1272))

## 4.0.8 (May 10, 2018)

### React-Data-Grid

- **Bugfix:** Fix editor refs ([#1183](https://github.com/Comcast/react-data-grid/pull/1183))

## 4.0.7 (April 19, 2018)

### React-Data-Grid

- **Feature:** Support `React v16` ([#1116](https://github.com/Comcast/react-data-grid/pull/1116))
- **Feature:** Set sort column and direction with props ([#649](https://github.com/Comcast/react-data-grid/pull/649))
- **Bugfix:** Filtering should ignore null values ([#1147](https://github.com/Comcast/react-data-grid/pull/1147))
- **Bugfix:** Resize column doesnt work on firefox when also draggable ([#1121](https://github.com/Comcast/react-data-grid/pull/1121))

### React-Data-Grid-Addons

- **Breaking:** Migrate to `react-context-menu 2.9.2` ([#1081](https://github.com/Comcast/react-data-grid/pull/1081))
