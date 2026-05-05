/**
 * prTimeline.ts
 * Groups PRs into time buckets (day/week) for timeline visualization.
 */

export type TimeBucket = "day" | "week";

export interface TimelineEntry {
  label: string; // e.g. "2024-01-15" or "2024-W03"
  date: Date;
  count: number;
  prNumbers: number[];
}

export interface MinimalPR {
  number: number;
  merged_at: string | null;
}

/**
 * Returns ISO week string like "2024-W03".
 */
export function getISOWeekLabel(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/**
 * Returns ISO date string like "2024-01-15".
 */
export function getDayLabel(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Builds a sorted timeline of PR activity grouped by the given bucket size.
 */
export function buildTimeline(
  prs: MinimalPR[],
  bucket: TimeBucket = "day"
): TimelineEntry[] {
  const bucketMap = new Map<string, TimelineEntry>();

  for (const pr of prs) {
    if (!pr.merged_at) continue;
    const date = new Date(pr.merged_at);
    const label = bucket === "week" ? getISOWeekLabel(date) : getDayLabel(date);
    const bucketDate = bucket === "week"
      ? new Date(date.getFullYear(), date.getMonth(), date.getDate() - (date.getDay() || 7) + 1)
      : new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (!bucketMap.has(label)) {
      bucketMap.set(label, { label, date: bucketDate, count: 0, prNumbers: [] });
    }
    const entry = bucketMap.get(label)!;
    entry.count += 1;
    entry.prNumbers.push(pr.number);
  }

  return Array.from(bucketMap.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
}

/**
 * Returns the peak activity entry from a timeline.
 */
export function peakEntry(timeline: TimelineEntry[]): TimelineEntry | null {
  if (timeline.length === 0) return null;
  return timeline.reduce((max, e) => (e.count > max.count ? e : max), timeline[0]);
}
