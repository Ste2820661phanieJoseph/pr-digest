import { differenceInHours, parseISO } from "date-fns";

export interface VelocityPR {
  number: number;
  title: string;
  createdAt: string;
  mergedAt: string;
  author: string;
}

export interface VelocityStats {
  avgMergeTimeHours: number;
  medianMergeTimeHours: number;
  fastestPR: VelocityPR & { mergeTimeHours: number };
  slowestPR: VelocityPR & { mergeTimeHours: number };
  totalMerged: number;
}

export function computeMergeTime(pr: VelocityPR): number {
  return differenceInHours(parseISO(pr.mergedAt), parseISO(pr.createdAt));
}

export function computeVelocityStats(prs: VelocityPR[]): VelocityStats | null {
  if (prs.length === 0) return null;

  const withTimes = prs.map((pr) => ({
    ...pr,
    mergeTimeHours: computeMergeTime(pr),
  }));

  const times = withTimes.map((p) => p.mergeTimeHours);
  const total = times.reduce((sum, t) => sum + t, 0);
  const avgMergeTimeHours = Math.round(total / times.length);

  const sorted = [...times].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const medianMergeTimeHours =
    sorted.length % 2 === 0
      ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
      : sorted[mid];

  const sortedPRs = [...withTimes].sort(
    (a, b) => a.mergeTimeHours - b.mergeTimeHours
  );

  return {
    avgMergeTimeHours,
    medianMergeTimeHours,
    fastestPR: sortedPRs[0],
    slowestPR: sortedPRs[sortedPRs.length - 1],
    totalMerged: prs.length,
  };
}

export function formatVelocitySummary(stats: VelocityStats): string {
  const lines: string[] = [
    `### ⚡ Merge Velocity`,
    `- **Total merged:** ${stats.totalMerged}`,
    `- **Avg merge time:** ${stats.avgMergeTimeHours}h`,
    `- **Median merge time:** ${stats.medianMergeTimeHours}h`,
    `- **Fastest:** [#${stats.fastestPR.number}](https://github.com) — ${stats.fastestPR.mergeTimeHours}h`,
    `- **Slowest:** [#${stats.slowestPR.number}](https://github.com) — ${stats.slowestPR.mergeTimeHours}h`,
  ];
  return lines.join("\n");
}
