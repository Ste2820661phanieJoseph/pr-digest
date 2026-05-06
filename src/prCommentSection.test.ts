import { toCommentInput, getCommentStats, buildCommentSection, appendCommentSection, CommentSectionPR } from './prCommentSection';

function makePR(overrides: Partial<CommentSectionPR> = {}): CommentSectionPR {
  return {
    number: 1,
    title: 'My PR',
    author: 'alice',
    mergedAt: '2024-01-15T12:00:00Z',
    comments: { totalCount: 3 },
    reviewThreads: { totalCount: 2 },
    ...overrides,
  };
}

describe('toCommentInput', () => {
  it('maps PR fields correctly', () => {
    const pr = makePR({ number: 7, comments: { totalCount: 5 }, reviewThreads: { totalCount: 4 } });
    const input = toCommentInput(pr);
    expect(input.number).toBe(7);
    expect(input.commentCount).toBe(5);
    expect(input.reviewCommentCount).toBe(4);
  });

  it('defaults missing counts to zero', () => {
    const pr = makePR({ comments: undefined, reviewThreads: undefined });
    const input = toCommentInput(pr);
    expect(input.commentCount).toBe(0);
    expect(input.reviewCommentCount).toBe(0);
  });
});

describe('getCommentStats', () => {
  it('returns aggregated stats for all PRs', () => {
    const prs = [
      makePR({ number: 1, comments: { totalCount: 4 }, reviewThreads: { totalCount: 1 } }),
      makePR({ number: 2, comments: { totalCount: 2 }, reviewThreads: { totalCount: 5 } }),
    ];
    const stats = getCommentStats(prs);
    expect(stats.totalComments).toBe(6);
    expect(stats.totalReviewComments).toBe(6);
    expect(stats.mostDiscussedPR?.number).toBe(1);
    expect(stats.mostReviewedPR?.number).toBe(2);
  });
});

describe('buildCommentSection', () => {
  it('returns empty string for no PRs', () => {
    expect(buildCommentSection([])).toBe('');
  });

  it('includes comment counts in output', () => {
    const prs = [makePR({ number: 10, comments: { totalCount: 6 }, reviewThreads: { totalCount: 3 } })];
    const section = buildCommentSection(prs);
    expect(section).toContain('💬 Comment Activity');
    expect(section).toContain('6');
    expect(section).toContain('#10');
  });

  it('omits most-discussed line when all comments are zero', () => {
    const prs = [makePR({ comments: { totalCount: 0 }, reviewThreads: { totalCount: 0 } })];
    const section = buildCommentSection(prs);
    expect(section).not.toContain('Most discussed');
  });
});

describe('appendCommentSection', () => {
  it('appends section to markdown', () => {
    const prs = [makePR()];
    const result = appendCommentSection('# Digest', prs);
    expect(result).toContain('# Digest');
    expect(result).toContain('💬 Comment Activity');
  });

  it('returns original markdown when no PRs', () => {
    const result = appendCommentSection('# Digest', []);
    expect(result).toBe('# Digest');
  });
});
