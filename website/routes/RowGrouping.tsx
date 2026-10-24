import { useMemo, useState } from 'react';
import { faker } from '@faker-js/faker';
import { createFileRoute } from '@tanstack/react-router';
import { css } from 'ecij';

import { SelectColumn, TreeDataGrid, type Column } from '../../src';
import { compare } from '../utils';
import { useDirection } from '../directionContext';

export const Route = createFileRoute('/RowGrouping')({
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
  'Cross-Country Skiing',
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
  'Water Polo'
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
      return childRows.reduce((prev, { bronze }) => prev + bronze, 0);
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
  for (let i = 1; i < 10_000; i++) {
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

  return rows;
}

const options = ['country', 'year', 'sport', 'athlete'] as const;

type Option = (typeof options)[number];

// Groups are ordered by the first row that belongs to them,
// so the rows are sorted by the grouped columns, in order, to sort the groups at every level
function sortRows(rows: readonly Row[], groupBy: readonly Option[]): readonly Row[] {
  return rows.toSorted((r1, r2) => {
    for (const option of groupBy) {
      // countries are sorted in descending order, so the expanded United States group is near the top
      const result =
        option === 'country'
          ? compare(r2.country, r1.country)
          : compare(String(r1[option]), String(r2[option]));
      if (result !== 0) return result;
    }
    return 0;
  });
}

function RowGrouping() {
  const direction = useDirection();
  const [rawRows] = useState(createRows);
  const [selectedRows, setSelectedRows] = useState((): ReadonlySet<number> => new Set());
  const [selectedOptions, setSelectedOptions] = useState<readonly Option[]>([
    options[0],
    options[1]
  ]);
  const rows = useMemo(() => sortRows(rawRows, selectedOptions), [rawRows, selectedOptions]);
  const [expandedGroupIds, setExpandedGroupIds] = useState(
    (): ReadonlySet<unknown> =>
      new Set(['United States of America', 'United States of America__2015'])
  );

  function toggleOption(option: Option, enabled: boolean) {
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
        expandedGroupIds={expandedGroupIds}
        onExpandedGroupIdsChange={setExpandedGroupIds}
        defaultColumnOptions={{ resizable: true }}
        direction={direction}
      />
    </div>
  );
}
