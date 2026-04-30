/**
 * Deduplicates PRs by number, keeping the most recently updated entry.
 * Also provides utilities to diff cached vs. fetched PR sets.
 */

export interface MinimalPR {
  number: number;
  updatedAt: string;
  [key: string]: unknown;
}

/**
 * Given an array of PRs (possibly containing duplicates by number),
 * return a map keyed by PR number with the most-recently-updated entry.
 */
export function deduplicatePRs<T extends MinimalPR>(prs: T[]): Map<number, T> {
  const seen = new Map<number, T>();
  for (const pr of prs) {
    const existing = seen.get(pr.number);
    if (!existing || new Date(pr.updatedAt) > new Date(existing.updatedAt)) {
      seen.set(pr.number, pr);
    }
  }
  return seen;
}

/**
 * Returns PRs from `incoming` whose number is not present in `cached`,
 * or whose updatedAt is strictly newer than the cached version.
 */
export function findNewOrUpdatedPRs<T extends MinimalPR>(
  incoming: T[],
  cached: Map<number, T>
): T[] {
  return incoming.filter((pr) => {
    const cachedPR = cached.get(pr.number);
    if (!cachedPR) return true;
    return new Date(pr.updatedAt) > new Date(cachedPR.updatedAt);
  });
}

/**
 * Merges a fresh batch of PRs into an existing deduplicated map,
 * returning a new map with updates applied.
 */
export function mergePRMaps<T extends MinimalPR>(
  base: Map<number, T>,
  updates: T[]
): Map<number, T> {
  const result = new Map(base);
  for (const pr of updates) {
    const existing = result.get(pr.number);
    if (!existing || new Date(pr.updatedAt) >= new Date(existing.updatedAt)) {
      result.set(pr.number, pr);
    }
  }
  return result;
}

/** Convert a PR map back to a sorted array (ascending by PR number). */
export function prMapToArray<T extends MinimalPR>(map: Map<number, T>): T[] {
  return Array.from(map.values()).sort((a, b) => a.number - b.number);
}
