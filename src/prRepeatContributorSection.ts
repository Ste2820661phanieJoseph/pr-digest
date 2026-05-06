/**
 * Integration helper: builds and appends the repeat-contributor section
 * to an existing markdown digest string.
 */

import {
  findRepeatContributors,
  formatRepeatContributorSection,
  MinimalPR,
  RepeatContributorStats,
} from "./prRepeatContributor";

export interface RepeatContributorSectionOptions {
  /** PRs merged in the current digest window */
  currentPRs: MinimalPR[];
  /** PRs from the previous period (e.g. loaded from cache) */
  previousPRs: MinimalPR[];
  /** Minimum total PRs across both periods to be included (default: 2) */
  minTotal?: number;
}

/**
 * Compute repeat contributor stats, applying an optional minimum threshold.
 */
export function getRepeatContributorStats(
  options: RepeatContributorSectionOptions
): RepeatContributorStats[] {
  const { currentPRs, previousPRs, minTotal = 2 } = options;
  const all = findRepeatContributors(currentPRs, previousPRs);
  return all.filter((s) => s.totalCount >= minTotal);
}

/**
 * Build a standalone markdown section for repeat contributors.
 */
export function buildRepeatContributorSection(
  options: RepeatContributorSectionOptions
): string {
  const stats = getRepeatContributorStats(options);
  return formatRepeatContributorSection(stats);
}

/**
 * Append the repeat-contributor section to an existing markdown string.
 * Returns the original markdown unchanged if there are no repeat contributors.
 */
export function appendRepeatContributorSection(
  markdown: string,
  options: RepeatContributorSectionOptions
): string {
  const section = buildRepeatContributorSection(options);
  if (!section) return markdown;
  return `${markdown.trimEnd()}\n\n${section}`;
}
