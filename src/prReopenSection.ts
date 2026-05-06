/**
 * Integration layer: pulls reopen stats from enriched PRs and
 * builds a section ready to append to the digest markdown.
 */

import {
  computeReopenStats,
  formatReopenStatsSummary,
  appendReopenStatsToMarkdown,
  ReopenStats,
  ReopenInput,
} from "./prReopenStats";

export interface ReopenSectionPR {
  number: number;
  title: string;
  author: string;
  url: string;
  timelineEvents?: Array<{ event: string }>;
}

export function toReopenInput(pr: ReopenSectionPR): ReopenInput {
  return {
    number: pr.number,
    title: pr.title,
    author: pr.author,
    url: pr.url,
    timelineEvents: pr.timelineEvents ?? [],
  };
}

export function getReopenStats(prs: ReopenSectionPR[]): ReopenStats {
  return computeReopenStats(prs.map(toReopenInput));
}

export function buildReopenSection(prs: ReopenSectionPR[]): string {
  const stats = getReopenStats(prs);
  return formatReopenStatsSummary(stats);
}

export function appendReopenSection(
  markdown: string,
  prs: ReopenSectionPR[]
): string {
  const stats = getReopenStats(prs);
  return appendReopenStatsToMarkdown(markdown, stats);
}
