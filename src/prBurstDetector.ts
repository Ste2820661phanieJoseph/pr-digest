/**
 * Detects "burst" periods where an unusually high number of PRs were merged
 * in a short time window (e.g. a single day).
 */

export interface BurstEntry {
  date: string; // ISO date YYYY-MM-DD
  count: number;
  authors: string[];
}

export interface BurstStats {
  entries: BurstEntry[];
  peakDate: string | null;
  peakCount: number;
  burstDays: BurstEntry[]; // days exceeding the burst threshold
  threshold: number;
}

export interface BurstInput {
  mergedAt: string;
  author: string;
}

/** Default multiplier over average daily merges to qualify as a burst. */
const DEFAULT_BURST_MULTIPLIER = 2;

export function computeBurstStats(
  prs: BurstInput[],
  burstMultiplier = DEFAULT_BURST_MULTIPLIER
): BurstStats {
  if (prs.length === 0) {
    return { entries: [], peakDate: null, peakCount: 0, burstDays: [], threshold: 0 };
  }

  const countByDay = new Map<string, Set<string>>();

  for (const pr of prs) {
    const date = pr.mergedAt.slice(0, 10);
    if (!countByDay.has(date)) countByDay.set(date, new Set());
    countByDay.get(date)!.add(pr.author);
  }

  const entries: BurstEntry[] = Array.from(countByDay.entries())
    .map(([date, authors]) => ({ date, count: authors.size, authors: Array.from(authors) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Use PR count per day (not unique authors) for burst detection
  const dayCounts = new Map<string, number>();
  for (const pr of prs) {
    const date = pr.mergedAt.slice(0, 10);
    dayCounts.set(date, (dayCounts.get(date) ?? 0) + 1);
  }

  const totalDays = dayCounts.size;
  const avgPerDay = prs.length / totalDays;
  const threshold = Math.ceil(avgPerDay * burstMultiplier);

  let peakDate: string | null = null;
  let peakCount = 0;
  for (const [date, count] of dayCounts.entries()) {
    if (count > peakCount) {
      peakCount = count;
      peakDate = date;
    }
  }

  const burstDays = entries.filter((e) => {
    const dayTotal = dayCounts.get(e.date) ?? 0;
    return dayTotal >= threshold;
  });

  return { entries, peakDate, peakCount, burstDays, threshold };
}

export function formatBurstSummary(stats: BurstStats): string {
  if (!stats.peakDate || stats.burstDays.length === 0) {
    return '_No burst activity detected this period._';
  }

  const lines: string[] = [
    `**Burst Activity** (threshold: ≥${stats.threshold} PRs/day)`,
    '',
  ];

  for (const day of stats.burstDays) {
    const marker = day.date === stats.peakDate ? ' 🔥 peak' : '';
    lines.push(`- **${day.date}**: ${day.count} contributor(s)${marker}`);
  }

  return lines.join('\n');
}
