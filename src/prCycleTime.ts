/**
 * PR Cycle Time: measures time from first commit / PR open to merge.
 * Cycle time complements velocity (open→merge) by also tracking
 * how long a PR sat in review vs. was actively developed.
 */

export interface CycleTimeInput {
  number: number;
  title: string;
  author: string;
  createdAt: string;
  mergedAt: string | null;
  /** ISO string of the first review submitted, if available */
  firstReviewAt?: string | null;
}

export interface CycleTimeEntry {
  number: number;
  title: string;
  author: string;
  /** Total hours from open to merge */
  totalHours: number;
  /** Hours from open to first review (pre-review phase) */
  preReviewHours: number | null;
  /** Hours from first review to merge (review phase) */
  reviewHours: number | null;
}

export interface CycleTimeStats {
  entries: CycleTimeEntry[];
  avgTotalHours: number;
  medianTotalHours: number;
  avgPreReviewHours: number | null;
  avgReviewHours: number | null;
  longestCycle: CycleTimeEntry | null;
}

function hoursBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 3_600_000;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export function computeCycleTimeStats(prs: CycleTimeInput[]): CycleTimeStats {
  const merged = prs.filter((p) => p.mergedAt !== null);

  const entries: CycleTimeEntry[] = merged.map((pr) => {
    const totalHours = hoursBetween(pr.createdAt, pr.mergedAt!);
    const preReviewHours =
      pr.firstReviewAt != null
        ? hoursBetween(pr.createdAt, pr.firstReviewAt)
        : null;
    const reviewHours =
      pr.firstReviewAt != null
        ? hoursBetween(pr.firstReviewAt, pr.mergedAt!)
        : null;
    return { number: pr.number, title: pr.title, author: pr.author, totalHours, preReviewHours, reviewHours };
  });

  const totals = entries.map((e) => e.totalHours);
  const preReviews = entries.map((e) => e.preReviewHours).filter((v): v is number => v !== null);
  const reviews = entries.map((e) => e.reviewHours).filter((v): v is number => v !== null);

  const longestCycle = entries.length
    ? entries.reduce((best, e) => (e.totalHours > best.totalHours ? e : best))
    : null;

  return {
    entries,
    avgTotalHours: avg(totals),
    medianTotalHours: median(totals),
    avgPreReviewHours: preReviews.length ? avg(preReviews) : null,
    avgReviewHours: reviews.length ? avg(reviews) : null,
    longestCycle,
  };
}

export function formatCycleTimeSummary(stats: CycleTimeStats): string {
  if (stats.entries.length === 0) return "";
  const fmt = (h: number) => h < 24 ? `${h.toFixed(1)}h` : `${(h / 24).toFixed(1)}d`;
  const lines: string[] = [
    `### ⏱️ Cycle Time`,
    `- **Avg cycle time:** ${fmt(stats.avgTotalHours)}`,
    `- **Median cycle time:** ${fmt(stats.medianTotalHours)}`,
  ];
  if (stats.avgPreReviewHours !== null) {
    lines.push(`- **Avg pre-review wait:** ${fmt(stats.avgPreReviewHours)}`);
  }
  if (stats.avgReviewHours !== null) {
    lines.push(`- **Avg review duration:** ${fmt(stats.avgReviewHours)}`);
  }
  if (stats.longestCycle) {
    lines.push(`- **Longest cycle:** [#${stats.longestCycle.number}](https://github.com) — ${fmt(stats.longestCycle.totalHours)} by @${stats.longestCycle.author}`);
  }
  return lines.join("\n");
}

export function appendCycleTimeToMarkdown(markdown: string, stats: CycleTimeStats): string {
  const section = formatCycleTimeSummary(stats);
  if (!section) return markdown;
  return `${markdown}\n\n${section}`;
}
