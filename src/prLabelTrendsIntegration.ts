/**
 * Integration helpers that wire label-trend data into the full digest pipeline.
 */

import { EnrichedPR } from "./prEnricher";
import {
  appendLabelTrendsToMarkdown,
  buildLabelTrendsSection,
  LabelTrendsSectionOptions,
} from "./prLabelTrendsSection";
import { getLabelTrendsStats } from "./prLabelTrendsSection";

export interface LabelTrendsConfig {
  enabled: boolean;
  maxRows?: number;
}

/**
 * Converts EnrichedPR array into the minimal shape expected by label-trends helpers.
 */
function toTrendable(prs: EnrichedPR[]) {
  return prs.map((pr) => ({ labels: pr.labels ?? [] }));
}

/**
 * Conditionally appends a label-trends section to a markdown digest.
 */
export function integrateLabelTrends(
  markdown: string,
  prs: EnrichedPR[],
  config: LabelTrendsConfig
): string {
  if (!config.enabled) return markdown;

  const options: LabelTrendsSectionOptions = { maxRows: config.maxRows ?? 10 };
  return appendLabelTrendsToMarkdown(markdown, toTrendable(prs), options);
}

/**
 * Returns a summary string suitable for action step outputs.
 */
export function labelTrendsSummary(prs: EnrichedPR[]): string {
  const stats = getLabelTrendsStats(toTrendable(prs));
  if (stats.total === 0) return "no label data";
  const top = stats.topLabel ? ` (top: ${stats.topLabel})` : "";
  return `${stats.entries.length} labels across ${stats.total} PRs${top}`;
}

/**
 * Builds a standalone section without needing a full markdown base.
 */
export function standaloneLabelTrendsSection(
  prs: EnrichedPR[],
  config: LabelTrendsConfig
): string {
  if (!config.enabled) return "";
  const options: LabelTrendsSectionOptions = { maxRows: config.maxRows ?? 10 };
  return buildLabelTrendsSection(toTrendable(prs), options);
}
