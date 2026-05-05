/**
 * prTimelineFormatter.ts
 * Renders a PR timeline as an ASCII bar chart for inclusion in digests.
 */

import { TimelineEntry } from "./prTimeline";

const BAR_CHAR = "█";
const MAX_BAR_WIDTH = 20;

/**
 * Renders a simple ASCII bar chart from timeline entries.
 * Returns a fenced code block suitable for Markdown.
 */
export function formatTimelineChart(entries: TimelineEntry[]): string {
  if (entries.length === 0) return "_No merged PRs in this period._";

  const maxCount = Math.max(...entries.map((e) => e.count));

  const lines = entries.map((entry) => {
    const barLen = maxCount > 0 ? Math.round((entry.count / maxCount) * MAX_BAR_WIDTH) : 0;
    const bar = BAR_CHAR.repeat(barLen).padEnd(MAX_BAR_WIDTH);
    const countStr = String(entry.count).padStart(3);
    return `${entry.label}  ${bar}  ${countStr}`;
  });

  return ["```", ...lines, "```"].join("\n");
}

/**
 * Renders a compact inline summary line, e.g.:
 * "📅 Timeline: 3 active days, peak on 2024-03-11 (5 PRs)"
 */
export function formatTimelineSummary(
  entries: TimelineEntry[],
  bucketLabel: string = "day"
): string {
  if (entries.length === 0) return "";
  const total = entries.reduce((s, e) => s + e.count, 0);
  const peak = entries.reduce((m, e) => (e.count > m.count ? e : m), entries[0]);
  const plural = entries.length === 1 ? bucketLabel : `${bucketLabel}s`;
  return (
    `📅 Timeline: ${entries.length} active ${plural}, ` +
    `peak on **${peak.label}** (${peak.count} PR${peak.count !== 1 ? "s" : ""}), ` +
    `${total} total`
  );
}
