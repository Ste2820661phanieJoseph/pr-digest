/**
 * Tracks PRs that were closed and then reopened before being merged.
 * Useful for identifying PRs that had a rocky path to merge.
 */

export interface ReopenedPR {
  number: number;
  title: string;
  author: string;
  reopenCount: number;
  url: string;
}

export interface ReopenStats {
  totalReopened: number;
  reopenRate: number; // percentage of all PRs
  topReopened: ReopenedPR[];
}

export interface ReopenInput {
  number: number;
  title: string;
  author: string;
  url: string;
  timelineEvents?: Array<{ event: string }>;
}

export function computeReopenStats(
  prs: ReopenInput[],
  topN = 5
): ReopenStats {
  const reopened: ReopenedPR[] = [];

  for (const pr of prs) {
    const events = pr.timelineEvents ?? [];
    const reopenCount = events.filter((e) => e.event === "reopened").length;
    if (reopenCount > 0) {
      reopened.push({
        number: pr.number,
        title: pr.title,
        author: pr.author,
        reopenCount,
        url: pr.url,
      });
    }
  }

  const totalReopened = reopened.length;
  const reopenRate = prs.length > 0 ? (totalReopened / prs.length) * 100 : 0;

  const topReopened = [...reopened]
    .sort((a, b) => b.reopenCount - a.reopenCount)
    .slice(0, topN);

  return { totalReopened, reopenRate, topReopened };
}

export function formatReopenStatsSummary(stats: ReopenStats): string {
  if (stats.totalReopened === 0) {
    return "_No PRs were reopened this week._";
  }

  const lines: string[] = [
    `**Reopened PRs:** ${stats.totalReopened} (${stats.reopenRate.toFixed(1)}% of merged PRs)`,
    "",
    "| PR | Author | Reopened |",
    "|---|---|---|",
  ];

  for (const pr of stats.topReopened) {
    const times = pr.reopenCount === 1 ? "1 time" : `${pr.reopenCount} times`;
    lines.push(`| [#${pr.number} ${pr.title}](${pr.url}) | @${pr.author} | ${times} |`);
  }

  return lines.join("\n");
}

export function appendReopenStatsToMarkdown(
  markdown: string,
  stats: ReopenStats
): string {
  if (stats.totalReopened === 0) return markdown;
  const section = `\n\n## 🔄 Reopened PRs\n\n${formatReopenStatsSummary(stats)}`;
  return markdown + section;
}
