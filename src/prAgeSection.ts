/**
 * Integration helpers: build a standalone age-stats section
 * and wire it into the full markdown digest.
 */

import {
  AgeStatsInput,
  PRAgeStats,
  computeAgeStats,
  formatAgeStatsSummary,
  appendAgeStatsToMarkdown,
} from "./prAgeStats";

export type AgeSectionInput = AgeStatsInput;

/** Convert any PR-like object to the minimal shape required. */
export function toAgeInput(pr: {
  created_at: string;
  merged_at: string | null | undefined;
}): AgeSectionInput {
  return {
    created_at: pr.created_at,
    merged_at: pr.merged_at ?? null,
  };
}

/** Compute stats from a list of PR-like objects. */
export function getAgeStats(prs: AgeSectionInput[]): PRAgeStats {
  return computeAgeStats(prs);
}

/**
 * Build a self-contained markdown section string.
 * Returns an empty string when there are no merged PRs.
 */
export function buildAgeSection(prs: AgeSectionInput[]): string {
  const stats = computeAgeStats(prs);
  if (stats.totalMerged === 0) return "";
  return `## PR Age at Merge\n\n${formatAgeStatsSummary(stats)}`;
}

/**
 * Append the age section to an existing markdown digest.
 * Skips appending when there is no data.
 */
export function appendAgeSectionToMarkdown(
  markdown: string,
  prs: AgeSectionInput[]
): string {
  const stats = computeAgeStats(prs);
  if (stats.totalMerged === 0) return markdown;
  return appendAgeStatsToMarkdown(markdown, stats);
}
