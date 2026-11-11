import { useId, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { css } from 'ecij';

import type { Direction } from '../src';
import { Route as AllFeaturesRoute } from './routes/AllFeatures';
import { Route as AnimationRoute } from './routes/Animation';
import { Route as CellNavigationRoute } from './routes/CellNavigation';
import { Route as ColumnGroupingRoute } from './routes/ColumnGrouping';
import { Route as ColumnSpanningRoute } from './routes/ColumnSpanning';
import { Route as ColumnsReorderingRoute } from './routes/ColumnsReordering';
import { Route as CommonFeaturesRoute } from './routes/CommonFeatures';
import { Route as ContextMenuRoute } from './routes/ContextMenu';
import { Route as CustomizableRenderersRoute } from './routes/CustomizableRenderers';
import { Route as HeaderFiltersRoute } from './routes/HeaderFilters';
import { Route as InfiniteScrollingRoute } from './routes/InfiniteScrolling';
import { Route as MasterDetailRoute } from './routes/MasterDetail';
import { Route as MillionCellsRoute } from './routes/MillionCells';
import { Route as NoRowsRoute } from './routes/NoRows';
import { Route as ResizableGridRoute } from './routes/ResizableGrid';
import { Route as RowGroupingRoute } from './routes/RowGrouping';
import { Route as RowsReorderingRoute } from './routes/RowsReordering';
import { Route as ScrollToCellRoute } from './routes/ScrollToCell';
import { Route as TreeViewRoute } from './routes/TreeView';
import { Route as VariableRowHeightRoute } from './routes/VariableRowHeight';

const demoRoutes = [
  CommonFeaturesRoute,
  AllFeaturesRoute,
  CellNavigationRoute,
  ColumnSpanningRoute,
  ColumnGroupingRoute,
  ColumnsReorderingRoute,
  ContextMenuRoute,
  CustomizableRenderersRoute,
  RowGroupingRoute,
  HeaderFiltersRoute,
  InfiniteScrollingRoute,
  MasterDetailRoute,
  MillionCellsRoute,
  NoRowsRoute,
  ResizableGridRoute,
  RowsReorderingRoute,
  ScrollToCellRoute,
  TreeViewRoute,
  VariableRowHeightRoute,
  AnimationRoute
];

const headerClassname = css`
  border-inline-start: 4px solid light-dark(hsl(210deg 50% 80%), hsl(210deg 50% 40%));

  h1 {
    font-size: 24px;
  }

  h1,
  h2 {
    margin: 8px;
  }
`;

const navClassname = css`
  display: flex;
  flex-direction: column;
  white-space: nowrap;

  a {
    color: inherit;
    font-size: 14px;
    line-height: 22px;
    text-decoration: none;
    padding-block: 2px;
    padding-inline: 16px;
    transition: 0.1s background-color;

    &:hover {
      background-color: light-dark(hsl(210deg 50% 90%), hsl(210deg 50% 30%));
    }

    &[aria-current='page'] {
      font-weight: 500;
      background-color: light-dark(hsl(210deg 50% 80%), hsl(210deg 50% 40%));

      &:hover {
        background-color: light-dark(hsl(210deg 50% 70%), hsl(210deg 50% 50%));
      }

      @media (forced-colors: active) {
        &,
        &:hover {
          background-color: SelectedItem;
        }
      }
    }
  }
`;

const labelClassname = css`
  padding-inline-start: 8px;
`;

export type Theme = 'light' | 'dark' | 'system';

interface Props {
  direction: Direction;
  onDirectionChange: (direction: Direction) => void;
}

export default function Nav({ direction, onDirectionChange }: Props) {
  const demosNavId = useId();
  const linksNavId = useId();
  const [theme, setTheme] = useState<Theme>('system');

  function onThemeChange(theme: Theme) {
    document.startViewTransition(() => {
      setTheme(theme);
    });
  }

  return (
    <header className={headerClassname}>
      <h1>react-data-grid</h1>

      <label className={labelClassname}>
        Theme{' '}
        <select value={theme} onChange={(e) => onThemeChange(e.target.value as Theme)}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </label>

      <nav aria-labelledby={demosNavId} className={navClassname}>
        <h2 id={demosNavId}>Demos</h2>
        {demoRoutes.map(({ to, options }) => (
          <Link key={to} to={to}>
            {options.staticData?.title}
          </Link>
        ))}
      </nav>

      <nav aria-labelledby={linksNavId} className={navClassname}>
        <h2 id={linksNavId}>Links</h2>
        <a
          href="https://github.com/Comcast/react-data-grid/blob/main/README.md"
          target="_blank"
          rel="noreferrer"
        >
          Documentation
        </a>
        <a
          href="https://github.com/Comcast/react-data-grid/releases"
          target="_blank"
          rel="noreferrer"
        >
          Releases
        </a>
        <a
          href="https://github.com/Comcast/react-data-grid/discussions"
          target="_blank"
          rel="noreferrer"
        >
          Discussions
        </a>
        <a
          href="https://github.com/Comcast/react-data-grid/issues"
          target="_blank"
          rel="noreferrer"
        >
          Issues
        </a>
      </nav>

      <h2>Direction</h2>
      <label className={labelClassname}>
        <input
          type="checkbox"
          checked={direction === 'rtl'}
          onChange={() => onDirectionChange(direction === 'rtl' ? 'ltr' : 'rtl')}
        />
        Right to left
      </label>
    </header>
  );
}
