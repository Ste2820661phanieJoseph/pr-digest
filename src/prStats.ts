import { PullRequest } from "./github";

export interface PRStats {
  total: number;
  byAuthor: Record<string, number>;
  byLabel: Record<string, number>;
  totalChangedFiles: number;
  averageChangedFiles: number;
  dateRange: { earliest: string; latest: string } | null;
}

export function computePRStats(prs: PullRequest[]): PRStats {
  if (prs.length === 0) {
    return {
      total: 0,
      byAuthor: {},
      byLabel: {},
      totalChangedFiles: 0,
      averageChangedFiles: 0,
      dateRange: null,
    };
  }

  const byAuthor: Record<string, number> = {};
  const byLabel: Record<string, number> = {};
  let totalChangedFiles = 0;
  let earliest = prs[0].merged_at ?? "";
  let latest = prs[0].merged_at ?? "";

  for (const pr of prs) {
    const author = pr.user?.login ?? "unknown";
    byAuthor[author] = (byAuthor[author] ?? 0) + 1;

    for (const label of pr.labels ?? []) {
      byLabel[label.name] = (byLabel[label.name] ?? 0) + 1;
    }

    totalChangedFiles += pr.changed_files ?? 0;

    if (pr.merged_at) {
      if (pr.merged_at < earliest) earliest = pr.merged_at;
      if (pr.merged_at > latest) latest = pr.merged_at;
    }
  }

  return {
    total: prs.length,
    byAuthor,
    byLabel,
    totalChangedFiles,
    averageChangedFiles: Math.round(totalChangedFiles / prs.length),
    dateRange: earliest ? { earliest, latest } : null,
  };
}

export function topContributors(
  stats: PRStats,
  limit = 3
): Array<{ login: string; count: number }> {
  return Object.entries(stats.byAuthor)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([login, count]) => ({ login, count }));
}
