/**
 * Computes statistics about the age of PRs at merge time
 * (how long they were open before being merged).
 */

export interface AgeStatsInput {
  created_at: string;
  merged_at: string | null;
}

export interface PRAgeBucket {
  label: string;
  count: number;
  pct: number;
}

export interface PRAgeStats {
  totalMerged: number;
  avgAgeHours: number;
  medianAgeHours: number;
  buckets: PRAgeBucket[];
}

const BUCKETS: Array<{ label: string; maxHours: number }> = [
  { label: "< 1 hour", maxHours: 1 },
  { label: "1–4 hours", maxHours: 4 },
  { label: "4–24 hours", maxHours: 24 },
  { label: "1–3 days", maxHours: 72 },
  { label: "3–7 days", maxHours: 168 },
  { label: "> 7 days", maxHours: Infinity },
];

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

export function computeAgeStats(prs: AgeStatsInput[]): PRAgeStats {
  const merged = prs.filter((p) => p.merged_at != null);
  const ages = merged.map((p) => hoursBetween(p.created_at, p.merged_at!));

  const total = ages.length;
  const avgAgeHours = total > 0 ? ages.reduce((s, v) => s + v, 0) / total : 0;
  const medianAgeHours = median(ages);

  const counts = new Array<number>(BUCKETS.length).fill(0);
  for (const age of ages) {
    const idx = BUCKETS.findIndex((b) => age < b.maxHours);
    counts[idx === -1 ? BUCKETS.length - 1 : idx]++;
  }

  const buckets: PRAgeBucket[] = BUCKETS.map((b, i) => ({
    label: b.label,
    count: counts[i],
    pct: total > 0 ? Math.round((counts[i] / total) * 100) : 0,
  }));

  return { totalMerged: total, avgAgeHours, medianAgeHours, buckets };
}

export function formatAgeStatsSummary(stats: PRAgeStats): string {
  if (stats.totalMerged === 0) return "_No merged PRs to analyse._";
  const fmt = (h: number) =>
    h < 24 ? `${h.toFixed(1)}h` : `${(h / 24).toFixed(1)}d`;
  const lines = [
    `**PR Age at Merge** (${stats.totalMerged} PRs)`,
    `- Avg age: **${fmt(stats.avgAgeHours)}**  |  Median: **${fmt(stats.medianAgeHours)}**`,
    "",
    "| Age bucket | Count | % |",
    "|---|---:|---:|",
    ...stats.buckets
      .filter((b) => b.count > 0)
      .map((b) => `| ${b.label} | ${b.count} | ${b.pct}% |`),
  ];
  return lines.join("\n");
}

export function appendAgeStatsToMarkdown(
  markdown: string,
  stats: PRAgeStats
): string {
  const section = formatAgeStatsSummary(stats);
  return `${markdown}\n\n## PR Age at Merge\n\n${section}`;
}
