/**
 * Groups and sorts PRs by label, applying sort options per group.
 */

import { SortOptions, SortablePR, sortPRs } from "./prSorter";

export interface GroupedPRs<T extends SortablePR> {
  label: string;
  prs: T[];
}

export interface GroupSortConfig {
  defaultSort: SortOptions;
  labelOverrides?: Record<string, SortOptions>;
}

export function groupAndSort<T extends SortablePR>(
  groups: Record<string, T[]>,
  labelOrder: string[],
  config: GroupSortConfig
): GroupedPRs<T>[] {
  return labelOrder
    .filter((label) => groups[label] && groups[label].length > 0)
    .map((label) => {
      const sortOptions = config.labelOverrides?.[label] ?? config.defaultSort;
      return {
        label,
        prs: sortPRs(groups[label], sortOptions),
      };
    });
}

export function flattenGroups<T extends SortablePR>(
  grouped: GroupedPRs<T>[]
): T[] {
  return grouped.flatMap((g) => g.prs);
}

export function countByGroup<T extends SortablePR>(
  grouped: GroupedPRs<T>[]
): Record<string, number> {
  return Object.fromEntries(grouped.map((g) => [g.label, g.prs.length]));
}
