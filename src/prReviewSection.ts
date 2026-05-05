/**
 * Builds a markdown section summarizing PR review activity.
 */

import { computeReviewStats, formatReviewSummary, ReviewablePR } from "./prReviewStats";

export function buildReviewSection(prs: ReviewablePR[]): string {
  if (prs.length === 0) return "";

  const stats = computeReviewStats(prs);
  if (stats.totalReviews === 0 && stats.prsWithNoReview === 0) return "";

  const summary = formatReviewSummary(stats);

  return [
    "## 🔍 Review Activity",
    "",
    summary,
    "",
  ].join("\n");
}

export function appendReviewSectionToMarkdown(
  markdown: string,
  prs: ReviewablePR[]
): string {
  const section = buildReviewSection(prs);
  if (!section) return markdown;
  return markdown.trimEnd() + "\n\n" + section;
}

export function getReviewStats(prs: ReviewablePR[]) {
  return computeReviewStats(prs);
}
