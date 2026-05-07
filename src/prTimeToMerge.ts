/**
 * Computes time-to-merge statistics: how long PRs sit open before being merged.
 */

export interface TimeToMergeInput {
  createdAt: string;
  mergedAt: string | null;
}

export interface TimeToMergeStats {
  count: number;
  avgHours: number;
  medianHours: number;
  minHours: number;
  maxHours: number;
  p75Hours: number;
  p90Hours: number;
}

export function hoursBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 3_600_000;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export function computeTimeToMergeStats(
  prs: TimeToMergeInput[]
): TimeToMergeStats | null {
  const hours = prs
    .filter((pr) => pr.mergedAt !== null)
    .map((pr) => hoursBetween(pr.createdAt, pr.mergedAt!))
    .filter((h) => h >= 0)
    .sort((a, b) => a - b);

  if (hours.length === 0) return null;

  const sum = hours.reduce((acc, h) => acc + h, 0);
  const mid = Math.floor(hours.length / 2);
  const median =
    hours.length % 2 === 0
      ? (hours[mid - 1] + hours[mid]) / 2
      : hours[mid];

  return {
    count: hours.length,
    avgHours: sum / hours.length,
    medianHours: median,
    minHours: hours[0],
    maxHours: hours[hours.length - 1],
    p75Hours: percentile(hours, 75),
    p90Hours: percentile(hours, 90),
  };
}

function fmtHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 24) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

export function formatTimeToMergeSummary(stats: TimeToMergeStats): string {
  return [
    `### ⏱ Time to Merge`,
    ``,
    `| Metric | Value |`,
    `|--------|-------|`,
    `| PRs measured | ${stats.count} |`,
    `| Average | ${fmtHours(stats.avgHours)} |`,
    `| Median | ${fmtHours(stats.medianHours)} |`,
    `| Min | ${fmtHours(stats.minHours)} |`,
    `| Max | ${fmtHours(stats.maxHours)} |`,
    `| p75 | ${fmtHours(stats.p75Hours)} |`,
    `| p90 | ${fmtHours(stats.p90Hours)} |`,
  ].join("\n");
}

export function appendTimeToMergeToMarkdown(
  markdown: string,
  prs: TimeToMergeInput[]
): string {
  const stats = computeTimeToMergeStats(prs);
  if (!stats) return markdown;
  return `${markdown}\n\n${formatTimeToMergeSummary(stats)}`;
}
