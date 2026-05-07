/**
 * Computes code churn metrics: additions, deletions, and churn ratio per PR.
 */

export interface ChurnInput {
  additions: number;
  deletions: number;
  title: string;
  author: string;
  mergedAt: string;
}

export interface ChurnStats {
  totalAdditions: number;
  totalDeletions: number;
  totalChangedLines: number;
  avgAdditionsPerPR: number;
  avgDeletionsPerPR: number;
  churnRatio: number; // deletions / (additions + deletions)
  topChurnPR: ChurnInput | null;
  prCount: number;
}

export function computeChurnStats(prs: ChurnInput[]): ChurnStats {
  if (prs.length === 0) {
    return {
      totalAdditions: 0,
      totalDeletions: 0,
      totalChangedLines: 0,
      avgAdditionsPerPR: 0,
      avgDeletionsPerPR: 0,
      churnRatio: 0,
      topChurnPR: null,
      prCount: 0,
    };
  }

  const totalAdditions = prs.reduce((s, p) => s + p.additions, 0);
  const totalDeletions = prs.reduce((s, p) => s + p.deletions, 0);
  const totalChangedLines = totalAdditions + totalDeletions;

  const churnRatio =
    totalChangedLines > 0
      ? Math.round((totalDeletions / totalChangedLines) * 100) / 100
      : 0;

  const topChurnPR = prs.reduce<ChurnInput | null>((top, pr) => {
    const prTotal = pr.additions + pr.deletions;
    const topTotal = top ? top.additions + top.deletions : -1;
    return prTotal > topTotal ? pr : top;
  }, null);

  return {
    totalAdditions,
    totalDeletions,
    totalChangedLines,
    avgAdditionsPerPR: Math.round(totalAdditions / prs.length),
    avgDeletionsPerPR: Math.round(totalDeletions / prs.length),
    churnRatio,
    topChurnPR,
    prCount: prs.length,
  };
}

export function formatChurnSummary(stats: ChurnStats): string {
  if (stats.prCount === 0) return '';

  const lines: string[] = [
    '### 🔁 Code Churn',
    '',
    `- **Total lines added:** ${stats.totalAdditions.toLocaleString()}`,
    `- **Total lines deleted:** ${stats.totalDeletions.toLocaleString()}`,
    `- **Total changed lines:** ${stats.totalChangedLines.toLocaleString()}`,
    `- **Avg additions/PR:** ${stats.avgAdditionsPerPR.toLocaleString()}`,
    `- **Avg deletions/PR:** ${stats.avgDeletionsPerPR.toLocaleString()}`,
    `- **Churn ratio:** ${(stats.churnRatio * 100).toFixed(1)}% deletions`,
  ];

  if (stats.topChurnPR) {
    const top = stats.topChurnPR;
    const total = top.additions + top.deletions;
    lines.push(
      `- **Largest PR:** "${top.title}" by @${top.author} (+${top.additions}/−${top.deletions}, ${total} lines)`
    );
  }

  return lines.join('\n');
}

export function appendChurnStatsToMarkdown(
  markdown: string,
  stats: ChurnStats
): string {
  const section = formatChurnSummary(stats);
  if (!section) return markdown;
  return `${markdown}\n\n${section}`;
}
