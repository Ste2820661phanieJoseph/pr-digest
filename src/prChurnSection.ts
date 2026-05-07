/**
 * Integrates code churn stats into the digest pipeline.
 */

import { computeChurnStats, appendChurnStatsToMarkdown, ChurnInput, ChurnStats } from './prCodeChurn';

export interface ChurnablePR {
  additions: number;
  deletions: number;
  title: string;
  author: string;
  mergedAt: string;
}

export function toChurnInput(pr: ChurnablePR): ChurnInput {
  return {
    additions: pr.additions,
    deletions: pr.deletions,
    title: pr.title,
    author: pr.author,
    mergedAt: pr.mergedAt,
  };
}

export function getChurnStats(prs: ChurnablePR[]): ChurnStats {
  return computeChurnStats(prs.map(toChurnInput));
}

export function buildChurnSection(prs: ChurnablePR[]): string {
  const stats = getChurnStats(prs);
  if (stats.prCount === 0) return '';

  const lines: string[] = [
    '### 🔁 Code Churn',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Total additions | +${stats.totalAdditions.toLocaleString()} |`,
    `| Total deletions | −${stats.totalDeletions.toLocaleString()} |`,
    `| Total changed lines | ${stats.totalChangedLines.toLocaleString()} |`,
    `| Avg additions/PR | +${stats.avgAdditionsPerPR.toLocaleString()} |`,
    `| Avg deletions/PR | −${stats.avgDeletionsPerPR.toLocaleString()} |`,
    `| Churn ratio | ${(stats.churnRatio * 100).toFixed(1)}% |`,
  ];

  if (stats.topChurnPR) {
    const top = stats.topChurnPR;
    const total = top.additions + top.deletions;
    lines.push(
      '',
      `> 🏆 **Largest PR:** [${top.title}] by @${top.author} — ${total.toLocaleString()} lines changed (+${top.additions}/−${top.deletions})`
    );
  }

  return lines.join('\n');
}

export function appendChurnSection(
  markdown: string,
  prs: ChurnablePR[]
): string {
  const stats = getChurnStats(prs);
  return appendChurnStatsToMarkdown(markdown, stats);
}
