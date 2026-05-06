import { CommentSectionPR, buildCommentSection, appendCommentSection, getCommentStats } from './prCommentSection';
import { CommentStats } from './prCommentStats';

export interface CommentIntegrationResult {
  section: string;
  stats: CommentStats;
  hasMeaningfulActivity: boolean;
}

/**
 * Determines whether comment activity is worth surfacing in the digest.
 * Requires at least one PR with comments or review threads.
 */
export function hasMeaningfulCommentActivity(prs: CommentSectionPR[]): boolean {
  return prs.some(
    (pr) =>
      (pr.comments?.totalCount ?? 0) > 0 ||
      (pr.reviewThreads?.totalCount ?? 0) > 0
  );
}

export function integrateCommentStats(prs: CommentSectionPR[]): CommentIntegrationResult {
  const stats = getCommentStats(prs);
  const hasMeaningfulActivity = hasMeaningfulCommentActivity(prs);
  const section = hasMeaningfulActivity ? buildCommentSection(prs) : '';

  return { section, stats, hasMeaningfulActivity };
}

export function commentStatsSummary(prs: CommentSectionPR[]): string {
  const stats = getCommentStats(prs);
  if (stats.totalPRs === 0) return 'No PRs this period.';
  return (
    `${stats.totalComments} comments and ${stats.totalReviewComments} review threads ` +
    `across ${stats.totalPRs} PRs.`
  );
}

export function standaloneCommentSection(prs: CommentSectionPR[]): string {
  if (!hasMeaningfulCommentActivity(prs)) return '';
  return appendCommentSection('', prs).trimStart();
}
