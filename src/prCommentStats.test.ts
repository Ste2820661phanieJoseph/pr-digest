import { computeCommentStats, formatCommentStatsSummary, appendCommentStatsToMarkdown, CommentStatsInput } from './prCommentStats';

function makePR(overrides: Partial<CommentStatsInput> = {}): CommentStatsInput {
  return {
    number: 1,
    title: 'Test PR',
    author: 'alice',
    commentCount: 2,
    reviewCommentCount: 3,
    mergedAt: '2024-01-15T10:00:00Z',
    ...overrides,
  };
}

describe('computeCommentStats', () => {
  it('returns zero stats for empty array', () => {
    const stats = computeCommentStats([]);
    expect(stats.totalPRs).toBe(0);
    expect(stats.totalComments).toBe(0);
    expect(stats.mostDiscussedPR).toBeNull();
    expect(stats.mostReviewedPR).toBeNull();
  });

  it('computes totals and averages correctly', () => {
    const prs = [
      makePR({ number: 1, commentCount: 4, reviewCommentCount: 2 }),
      makePR({ number: 2, commentCount: 2, reviewCommentCount: 6 }),
    ];
    const stats = computeCommentStats(prs);
    expect(stats.totalPRs).toBe(2);
    expect(stats.totalComments).toBe(6);
    expect(stats.totalReviewComments).toBe(8);
    expect(stats.avgCommentsPerPR).toBe(3);
    expect(stats.avgReviewCommentsPerPR).toBe(4);
  });

  it('identifies most discussed PR', () => {
    const prs = [
      makePR({ number: 1, commentCount: 1 }),
      makePR({ number: 2, commentCount: 10 }),
      makePR({ number: 3, commentCount: 5 }),
    ];
    const stats = computeCommentStats(prs);
    expect(stats.mostDiscussedPR?.number).toBe(2);
  });

  it('identifies most reviewed PR', () => {
    const prs = [
      makePR({ number: 1, reviewCommentCount: 3 }),
      makePR({ number: 2, reviewCommentCount: 15 }),
    ];
    const stats = computeCommentStats(prs);
    expect(stats.mostReviewedPR?.number).toBe(2);
  });

  it('sets mostDiscussedPR to null when all have zero comments', () => {
    const prs = [makePR({ commentCount: 0 })];
    const stats = computeCommentStats(prs);
    expect(stats.mostDiscussedPR).toBeNull();
  });

  it('rounds averages to one decimal place', () => {
    const prs = [
      makePR({ commentCount: 1, reviewCommentCount: 1 }),
      makePR({ commentCount: 2, reviewCommentCount: 2 }),
      makePR({ commentCount: 2, reviewCommentCount: 2 }),
    ];
    const stats = computeCommentStats(prs);
    expect(stats.avgCommentsPerPR).toBe(1.7);
  });
});

describe('formatCommentStatsSummary', () => {
  it('returns empty string for zero PRs', () => {
    const stats = computeCommentStats([]);
    expect(formatCommentStatsSummary(stats)).toBe('');
  });

  it('includes header and table rows', () => {
    const prs = [makePR({ number: 42, commentCount: 5, reviewCommentCount: 8 })];
    const stats = computeCommentStats(prs);
    const output = formatCommentStatsSummary(stats);
    expect(output).toContain('💬 Comment Activity');
    expect(output).toContain('Total PR comments');
    expect(output).toContain('#42');
  });
});

describe('appendCommentStatsToMarkdown', () => {
  it('appends section to existing markdown', () => {
    const prs = [makePR({ commentCount: 3, reviewCommentCount: 2 })];
    const stats = computeCommentStats(prs);
    const result = appendCommentStatsToMarkdown('# Digest', stats);
    expect(result).toContain('# Digest');
    expect(result).toContain('💬 Comment Activity');
  });

  it('returns original markdown when no stats', () => {
    const stats = computeCommentStats([]);
    const result = appendCommentStatsToMarkdown('# Digest', stats);
    expect(result).toBe('# Digest');
  });
});
