import { EnrichedPR } from "./prEnricher";

export interface MergeFrequencyStats {
  totalMerged: number;
  perDay: Record<string, number>;
  busiestDay: string | null;
  busiestDayCount: number;
  avgPerDay: number;
  daysActive: number;
}

export function computeMergeFrequency(prs: EnrichedPR[]): MergeFrequencyStats {
  if (prs.length === 0) {
    return {
      totalMerged: 0,
      perDay: {},
      busiestDay: null,
      busiestDayCount: 0,
      avgPerDay: 0,
      daysActive: 0,
    };
  }

  const perDay: Record<string, number> = {};

  for (const pr of prs) {
    const mergedAt = pr.mergedAt ?? pr.closedAt;
    if (!mergedAt) continue;
    const day = mergedAt.slice(0, 10); // YYYY-MM-DD
    perDay[day] = (perDay[day] ?? 0) + 1;
  }

  const days = Object.keys(perDay);
  const daysActive = days.length;

  let busiestDay: string | null = null;
  let busiestDayCount = 0;

  for (const [day, count] of Object.entries(perDay)) {
    if (count > busiestDayCount) {
      busiestDayCount = count;
      busiestDay = day;
    }
  }

  const totalMerged = prs.length;
  const avgPerDay = daysActive > 0 ? Math.round((totalMerged / daysActive) * 10) / 10 : 0;

  return { totalMerged, perDay, busiestDay, busiestDayCount, avgPerDay, daysActive };
}

export function formatMergeFrequencySummary(stats: MergeFrequencyStats): string {
  if (stats.totalMerged === 0) return "";

  const lines: string[] = [];
  lines.push("### 📅 Merge Frequency");
  lines.push("");
  lines.push(`- **Total merged:** ${stats.totalMerged} PR${stats.totalMerged !== 1 ? "s" : ""}`);
  lines.push(`- **Days with merges:** ${stats.daysActive}`);
  lines.push(`- **Average per active day:** ${stats.avgPerDay}`);

  if (stats.busiestDay) {
    lines.push(
      `- **Busiest day:** ${stats.busiestDay} (${stats.busiestDayCount} PR${stats.busiestDayCount !== 1 ? "s" : ""})`
    );
  }

  return lines.join("\n");
}

export function appendMergeFrequencyToMarkdown(
  markdown: string,
  stats: MergeFrequencyStats
): string {
  const section = formatMergeFrequencySummary(stats);
  if (!section) return markdown;
  return `${markdown}\n\n${section}`;
}
