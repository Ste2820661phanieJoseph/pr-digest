/**
 * Identifies repeat contributors — authors who have merged PRs in both
 * the current digest window and a prior period stored in cache.
 */

export interface MinimalPR {
  author: string;
  mergedAt: string;
}

export interface RepeatContributorStats {
  author: string;
  currentCount: number;
  previousCount: number;
  totalCount: number;
}

/**
 * Build a frequency map of author -> PR count from a list of PRs.
 */
export function buildAuthorFrequency(prs: MinimalPR[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const pr of prs) {
    freq.set(pr.author, (freq.get(pr.author) ?? 0) + 1);
  }
  return freq;
}

/**
 * Find authors present in both current and previous PR sets,
 * returning stats sorted by totalCount descending.
 */
export function findRepeatContributors(
  current: MinimalPR[],
  previous: MinimalPR[]
): RepeatContributorStats[] {
  const currentFreq = buildAuthorFrequency(current);
  const previousFreq = buildAuthorFrequency(previous);

  const results: RepeatContributorStats[] = [];

  for (const [author, currentCount] of currentFreq.entries()) {
    const previousCount = previousFreq.get(author) ?? 0;
    if (previousCount > 0) {
      results.push({
        author,
        currentCount,
        previousCount,
        totalCount: currentCount + previousCount,
      });
    }
  }

  return results.sort((a, b) => b.totalCount - a.totalCount);
}

/**
 * Format a markdown section listing repeat contributors.
 */
export function formatRepeatContributorSection(
  stats: RepeatContributorStats[]
): string {
  if (stats.length === 0) return "";

  const rows = stats
    .map(
      (s) =>
        `| @${s.author} | ${s.currentCount} | ${s.previousCount} | ${s.totalCount} |`
    )
    .join("\n");

  return [
    "## 🔁 Repeat Contributors",
    "",
    "| Author | This Week | Last Week | Total |",
    "|--------|-----------|-----------|-------|",
    rows,
    "",
  ].join("\n");
}
