export interface CommentStatsInput {
  number: number;
  title: string;
  author: string;
  commentCount: number;
  reviewCommentCount: number;
  mergedAt: string;
}

export interface CommentStats {
  totalPRs: number;
  totalComments: number;
  totalReviewComments: number;
  avgCommentsPerPR: number;
  avgReviewCommentsPerPR: number;
  mostDiscussedPR: CommentStatsInput | null;
  mostReviewedPR: CommentStatsInput | null;
}

export function computeCommentStats(prs: CommentStatsInput[]): CommentStats {
  if (prs.length === 0) {
    return {
      totalPRs: 0,
      totalComments: 0,
      totalReviewComments: 0,
      avgCommentsPerPR: 0,
      avgReviewCommentsPerPR: 0,
      mostDiscussedPR: null,
      mostReviewedPR: null,
    };
  }

  const totalComments = prs.reduce((sum, pr) => sum + pr.commentCount, 0);
  const totalReviewComments = prs.reduce((sum, pr) => sum + pr.reviewCommentCount, 0);

  const mostDiscussedPR = prs.reduce((best, pr) =>
    pr.commentCount > best.commentCount ? pr : best
  );

  const mostReviewedPR = prs.reduce((best, pr) =>
    pr.reviewCommentCount > best.reviewCommentCount ? pr : best
  );

  return {
    totalPRs: prs.length,
    totalComments,
    totalReviewComments,
    avgCommentsPerPR: Math.round((totalComments / prs.length) * 10) / 10,
    avgReviewCommentsPerPR: Math.round((totalReviewComments / prs.length) * 10) / 10,
    mostDiscussedPR: mostDiscussedPR.commentCount > 0 ? mostDiscussedPR : null,
    mostReviewedPR: mostReviewedPR.reviewCommentCount > 0 ? mostReviewedPR : null,
  };
}

export function formatCommentStatsSummary(stats: CommentStats): string {
  if (stats.totalPRs === 0) return '';

  const lines: string[] = [
    `### 💬 Comment Activity`,
    ``,
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Total PR comments | ${stats.totalComments} |`,
    `| Total review comments | ${stats.totalReviewComments} |`,
    `| Avg comments / PR | ${stats.avgCommentsPerPR} |`,
    `| Avg review comments / PR | ${stats.avgReviewCommentsPerPR} |`,
  ];

  if (stats.mostDiscussedPR) {
    lines.push(`| Most discussed | #${stats.mostDiscussedPR.number} (${stats.mostDiscussedPR.commentCount} comments) |`);
  }

  if (stats.mostReviewedPR) {
    lines.push(`| Most reviewed | #${stats.mostReviewedPR.number} (${stats.mostReviewedPR.reviewCommentCount} review comments) |`);
  }

  return lines.join('\n');
}

export function appendCommentStatsToMarkdown(markdown: string, stats: CommentStats): string {
  const section = formatCommentStatsSummary(stats);
  if (!section) return markdown;
  return `${markdown}\n\n${section}`;
}
