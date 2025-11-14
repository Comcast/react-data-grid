import { useState } from 'react';
import { faker } from '@faker-js/faker';
import { css } from '@nstep/ecis';

import { SelectColumn, TreeDataGrid, type Column } from '../../src';
import { useDirection } from '../directionContext';

export const Route = createFileRoute({
  component: RowGrouping
});

const groupingClassname = css`
  display: flex;
  flex-direction: column;
  block-size: 100%;
  gap: 8px;

  > .rdg {
    flex: 1;
  }
`;

const optionsClassname = css`
  display: flex;
  gap: 8px;
  text-transform: capitalize;
`;

interface Row {
  id: number;
  country: string;
  year: number;
  sport: string;
  athlete: string;
  gold: number;
  silver: number;
  bronze: number;
}

const sports = [
  'Swimming',
  'Gymnastics',
  'Speed Skating',
  'Cross Country Skiing',
  'Short-Track Speed Skating',
  'Diving',
  'Cycling',
  'Biathlon',
  'Alpine Skiing',
  'Ski Jumping',
  'Nordic Combined',
  'Athletics',
  'Table Tennis',
  'Tennis',
  'Synchronized Swimming',
  'Shooting',
  'Rowing',
  'Fencing',
  'Equestrian',
  'Canoeing',
  'Bobsleigh',
  'Badminton',
  'Archery',
  'Wrestling',
  'Weightlifting',
  'Waterpolo',
  'Wrestling',
  'Weightlifting'
];

const columns: readonly Column<Row>[] = [
  SelectColumn,
  {
    key: 'country',
    name: 'Country'
  },
  {
    key: 'year',
    name: 'Year'
  },
  {
    key: 'sport',
    name: 'Sport'
  },
  {
    key: 'athlete',
    name: 'Athlete'
  },
  {
    key: 'gold',
    name: 'Gold',
    renderGroupCell({ childRows }) {
      return childRows.reduce((prev, { gold }) => prev + gold, 0);
    }
  },
  {
    key: 'silver',
    name: 'Silver',
    renderGroupCell({ childRows }) {
      return childRows.reduce((prev, { silver }) => prev + silver, 0);
    }
  },
  {
    key: 'bronze',
    name: 'Bronze',
    renderGroupCell({ childRows }) {
      return childRows.reduce((prev, { silver }) => prev + silver, 0);
    }
  },
  {
    key: 'total',
    name: 'Total',
    renderCell({ row }) {
      return row.gold + row.silver + row.bronze;
    },
    renderGroupCell({ childRows }) {
      return childRows.reduce((prev, row) => prev + row.gold + row.silver + row.bronze, 0);
    }
  }
];

function rowKeyGetter(row: Row) {
  return row.id;
}

function createRows(): readonly Row[] {
  const rows: Row[] = [];
  for (let i = 1; i < 10000; i++) {
    rows.push({
      id: i,
      year: 2015 + faker.number.int(3),
      country: faker.location.country(),
      sport: sports[faker.number.int(sports.length - 1)],
      athlete: faker.person.fullName(),
      gold: faker.number.int(5),
      silver: faker.number.int(5),
      bronze: faker.number.int(5)
    });
  }

  return rows.sort((r1, r2) => r2.country.localeCompare(r1.country));
}

const options = ['country', 'year', 'sport', 'athlete'] as const;

function RowGrouping() {
  const direction = useDirection();
  const [rows] = useState(createRows);
  const [selectedRows, setSelectedRows] = useState((): ReadonlySet<number> => new Set());
  const [selectedOptions, setSelectedOptions] = useState<readonly string[]>([
    options[0],
    options[1]
  ]);
  const [expandedGroupIds, setExpandedGroupIds] = useState(
    (): ReadonlySet<unknown> =>
      new Set<unknown>(['United States of America', 'United States of America__2015'])
  );

  function toggleOption(option: string, enabled: boolean) {
    const index = selectedOptions.indexOf(option);
    if (enabled) {
      if (index === -1) {
        setSelectedOptions((options) => [...options, option]);
      }
    } else if (index !== -1) {
      setSelectedOptions((options) => {
        return options.toSpliced(index, 1);
      });
    }
    setExpandedGroupIds(new Set());
  }

  return (
    <div className={groupingClassname}>
      <b>Group by columns:</b>
      <div className={optionsClassname}>
        {options.map((option) => (
          <label key={option}>
            <input
              type="checkbox"
              checked={selectedOptions.includes(option)}
              onChange={(event) => toggleOption(option, event.target.checked)}
            />{' '}
            {option}
          </label>
        ))}
      </div>

      <TreeDataGrid
        aria-label="Row Grouping Example"
        columns={columns}
        rows={rows}
        rowKeyGetter={rowKeyGetter}
        selectedRows={selectedRows}
        onSelectedRowsChange={setSelectedRows}
        groupBy={selectedOptions}
        rowGrouper={rowGrouper}
        expandedGroupIds={expandedGroupIds}
        onExpandedGroupIdsChange={setExpandedGroupIds}
        defaultColumnOptions={{ resizable: true }}
        direction={direction}
      />
    </div>
  );
}

function rowGrouper(rows: readonly Row[], columnKey: string) {
  // @ts-expect-error
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return Object.groupBy(rows, (r) => r[columnKey]) as Record<string, readonly R[]>;
}
