/**
 * prTimelineIntegration.ts
 * Wires timeline building + formatting into the digest pipeline.
 */

import { buildTimeline, peakEntry, TimeBucket } from "./prTimeline";
import { formatTimelineChart, formatTimelineSummary } from "./prTimelineFormatter";

export interface TimelineSection {
  summary: string;
  chart: string;
  peakLabel: string | null;
  peakCount: number;
  totalMerged: number;
  activeBuckets: number;
}

export interface PRWithMergeDate {
  number: number;
  merged_at: string | null;
}

/**
 * Builds a complete timeline section from a list of PRs.
 * Suitable for embedding in Markdown or Slack digests.
 */
export function buildTimelineSection(
  prs: PRWithMergeDate[],
  bucket: TimeBucket = "day"
): TimelineSection {
  const timeline = buildTimeline(prs, bucket);
  const peak = peakEntry(timeline);
  const totalMerged = timeline.reduce((s, e) => s + e.count, 0);

  return {
    summary: formatTimelineSummary(timeline, bucket),
    chart: formatTimelineChart(timeline),
    peakLabel: peak?.label ?? null,
    peakCount: peak?.count ?? 0,
    totalMerged,
    activeBuckets: timeline.length,
  };
}

/**
 * Appends the timeline section to an existing Markdown digest string.
 */
export function appendTimelineToMarkdown(
  markdown: string,
  prs: PRWithMergeDate[],
  bucket: TimeBucket = "day"
): string {
  const section = buildTimelineSection(prs, bucket);
  if (section.totalMerged === 0) return markdown;

  const heading = "## 📊 Merge Activity";
  const body = [section.summary, "", section.chart].join("\n");
  return [markdown.trimEnd(), "", heading, "", body, ""].join("\n");
}
