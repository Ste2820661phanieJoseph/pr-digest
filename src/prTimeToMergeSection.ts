/**
 * Section builder for time-to-merge stats, following the section pattern
 * used by other pr*Section modules in this project.
 */

import {
  computeTimeToMergeStats,
  formatTimeToMergeSummary,
  TimeToMergeInput,
  TimeToMergeStats,
} from "./prTimeToMerge";

export interface TimeToMergeSectionInput {
  createdAt: string;
  mergedAt: string | null;
}

export function toTimeToMergeInput(
  pr: TimeToMergeSectionInput
): TimeToMergeInput {
  return { createdAt: pr.createdAt, mergedAt: pr.mergedAt };
}

export function getTimeToMergeStats(
  prs: TimeToMergeSectionInput[]
): TimeToMergeStats | null {
  return computeTimeToMergeStats(prs.map(toTimeToMergeInput));
}

export function buildTimeToMergeSection(
  prs: TimeToMergeSectionInput[]
): string | null {
  const stats = getTimeToMergeStats(prs);
  if (!stats) return null;
  return formatTimeToMergeSummary(stats);
}

export function appendTimeToMergeSection(
  markdown: string,
  prs: TimeToMergeSectionInput[]
): string {
  const section = buildTimeToMergeSection(prs);
  if (!section) return markdown;
  return `${markdown}\n\n${section}`;
}
