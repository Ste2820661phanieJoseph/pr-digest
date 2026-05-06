import { CommentStatsInput, CommentStats, computeCommentStats, appendCommentStatsToMarkdown } from './prCommentStats';

export interface CommentSectionPR {
  number: number;
  title: string;
  author: string;
  mergedAt: string;
  comments?: { totalCount: number };
  reviewThreads?: { totalCount: number };
}

export function toCommentInput(pr: CommentSectionPR): CommentStatsInput {
  return {
    number: pr.number,
    title: pr.title,
    author: pr.author,
    mergedAt: pr.mergedAt,
    commentCount: pr.comments?.totalCount ?? 0,
    reviewCommentCount: pr.reviewThreads?.totalCount ?? 0,
  };
}

export function getCommentStats(prs: CommentSectionPR[]): CommentStats {
  return computeCommentStats(prs.map(toCommentInput));
}

export function buildCommentSection(prs: CommentSectionPR[]): string {
  const stats = getCommentStats(prs);
  const lines: string[] = [];

  if (stats.totalPRs === 0) return '';

  lines.push(`### 💬 Comment Activity`);
  lines.push(``);
  lines.push(`- **${stats.totalComments}** general comments across **${stats.totalPRs}** PRs (avg ${stats.avgCommentsPerPR}/PR)`);
  lines.push(`- **${stats.totalReviewComments}** review comments (avg ${stats.avgReviewCommentsPerPR}/PR)`);

  if (stats.mostDiscussedPR) {
    lines.push(`- Most discussed: **#${stats.mostDiscussedPR.number}** _${stats.mostDiscussedPR.title}_ (${stats.mostDiscussedPR.commentCount} comments)`);
  }

  if (stats.mostReviewedPR) {
    lines.push(`- Most reviewed: **#${stats.mostReviewedPR.number}** _${stats.mostReviewedPR.title}_ (${stats.mostReviewedPR.reviewCommentCount} review threads)`);
  }

  return lines.join('\n');
}

export function appendCommentSection(markdown: string, prs: CommentSectionPR[]): string {
  const stats = getCommentStats(prs);
  return appendCommentStatsToMarkdown(markdown, stats);
}
