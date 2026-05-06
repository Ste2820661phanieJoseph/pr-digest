/**
 * Computes statistics about stale PRs — those that were open for a long time
 * before being merged, or that had long periods of inactivity.
 */

export interface StaleStatsInput {
  number: number;
  title: string;
  author: string;
  createdAt: string;
  mergedAt: string;
  updatedAt: string;
}

export interface StalePR {
  number: number;
  title: string;
  author: string;
  openDays: number;
  inactiveDays: number;
}

export interface StaleStats {
  total: number;
  staleCount: number;
  stalePRs: StalePR[];
  avgOpenDays: number;
  longestOpenDays: number;
}

const STALE_THRESHOLD_DAYS = 7;

function daysBetween(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

export function computeStaleStats(prs: StaleStatsInput[]): StaleStats {
  if (prs.length === 0) {
    return { total: 0, staleCount: 0, stalePRs: [], avgOpenDays: 0, longestOpenDays: 0 };
  }

  const enriched: StalePR[] = prs.map((pr) => ({
    number: pr.number,
    title: pr.title,
    author: pr.author,
    openDays: daysBetween(pr.createdAt, pr.mergedAt),
    inactiveDays: daysBetween(pr.updatedAt, pr.mergedAt),
  }));

  const stalePRs = enriched.filter((pr) => pr.openDays >= STALE_THRESHOLD_DAYS);
  const totalOpenDays = enriched.reduce((sum, pr) => sum + pr.openDays, 0);
  const longestOpenDays = Math.max(...enriched.map((pr) => pr.openDays));

  return {
    total: prs.length,
    staleCount: stalePRs.length,
    stalePRs: stalePRs.sort((a, b) => b.openDays - a.openDays),
    avgOpenDays: Math.round(totalOpenDays / prs.length),
    longestOpenDays,
  };
}

export function formatStaleStatsSummary(stats: StaleStats): string {
  if (stats.total === 0) return '';

  const pct = Math.round((stats.staleCount / stats.total) * 100);
  const lines: string[] = [
    `### 🕰️ Stale PR Stats`,
    ``,
    `- **Total PRs:** ${stats.total}`,
    `- **Stale (≥${STALE_THRESHOLD_DAYS}d open):** ${stats.staleCount} (${pct}%)`,
    `- **Avg open time:** ${stats.avgOpenDays}d`,
    `- **Longest open:** ${stats.longestOpenDays}d`,
  ];

  if (stats.stalePRs.length > 0) {
    lines.push(``, `**Top stale PRs:**`);
    stats.stalePRs.slice(0, 5).forEach((pr) => {
      lines.push(`- #${pr.number} \`${pr.title}\` by @${pr.author} — ${pr.openDays}d open`);
    });
  }

  return lines.join('\n');
}

export function appendStaleStatsToMarkdown(markdown: string, stats: StaleStats): string {
  const section = formatStaleStatsSummary(stats);
  if (!section) return markdown;
  return `${markdown}\n\n${section}`;
}
