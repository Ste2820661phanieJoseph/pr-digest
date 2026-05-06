/**
 * Builds a label-trends section and appends it to an existing markdown digest.
 */

import { computeLabelTrends, formatLabelTrendsTable, TrendablePR } from "./prLabelTrends";

export interface LabelTrendsSectionOptions {
  /** Maximum number of label rows to show (0 = unlimited). */
  maxRows?: number;
}

/**
 * Returns the raw label-trends result for use in outputs or Slack.
 */
export function getLabelTrendsStats(prs: TrendablePR[]) {
  return computeLabelTrends(prs);
}

/**
 * Builds a standalone markdown section for label trends.
 */
export function buildLabelTrendsSection(
  prs: TrendablePR[],
  options: LabelTrendsSectionOptions = {}
): string {
  const { maxRows = 0 } = options;
  let result = computeLabelTrends(prs);

  if (maxRows > 0 && result.entries.length > maxRows) {
    result = { ...result, entries: result.entries.slice(0, maxRows) };
  }

  const table = formatLabelTrendsTable(result);
  return `## 🏷️ Label Trends\n\n${table}`;
}

/**
 * Appends a label-trends section to an existing markdown string.
 */
export function appendLabelTrendsToMarkdown(
  markdown: string,
  prs: TrendablePR[],
  options: LabelTrendsSectionOptions = {}
): string {
  const section = buildLabelTrendsSection(prs, options);
  return `${markdown}\n${section}`;
}
