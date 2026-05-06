import { computeStaleStats, formatStaleStatsSummary, appendStaleStatsToMarkdown } from './prStaleStats';

function makePR(overrides: Partial<{
  number: number;
  title: string;
  author: string;
  createdAt: string;
  mergedAt: string;
  updatedAt: string;
}> = {}) {
  return {
    number: 1,
    title: 'Test PR',
    author: 'alice',
    createdAt: '2024-01-01T00:00:00Z',
    mergedAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-09T00:00:00Z',
    ...overrides,
  };
}

describe('computeStaleStats', () => {
  it('returns empty stats for no PRs', () => {
    const stats = computeStaleStats([]);
    expect(stats.total).toBe(0);
    expect(stats.staleCount).toBe(0);
    expect(stats.stalePRs).toEqual([]);
    expect(stats.avgOpenDays).toBe(0);
    expect(stats.longestOpenDays).toBe(0);
  });

  it('identifies stale PRs (open >= 7 days)', () => {
    const prs = [
      makePR({ number: 1, mergedAt: '2024-01-10T00:00:00Z' }), // 9 days
      makePR({ number: 2, mergedAt: '2024-01-03T00:00:00Z' }), // 2 days — not stale
    ];
    const stats = computeStaleStats(prs);
    expect(stats.staleCount).toBe(1);
    expect(stats.stalePRs[0].number).toBe(1);
  });

  it('computes average open days', () => {
    const prs = [
      makePR({ mergedAt: '2024-01-11T00:00:00Z' }), // 10 days
      makePR({ mergedAt: '2024-01-05T00:00:00Z' }), // 4 days
    ];
    const stats = computeStaleStats(prs);
    expect(stats.avgOpenDays).toBe(7);
  });

  it('finds the longest open PR', () => {
    const prs = [
      makePR({ mergedAt: '2024-01-21T00:00:00Z' }), // 20 days
      makePR({ mergedAt: '2024-01-06T00:00:00Z' }), // 5 days
    ];
    const stats = computeStaleStats(prs);
    expect(stats.longestOpenDays).toBe(20);
  });

  it('sorts stale PRs by openDays descending', () => {
    const prs = [
      makePR({ number: 1, mergedAt: '2024-01-09T00:00:00Z' }), // 8 days
      makePR({ number: 2, mergedAt: '2024-01-16T00:00:00Z' }), // 15 days
      makePR({ number: 3, mergedAt: '2024-01-12T00:00:00Z' }), // 11 days
    ];
    const stats = computeStaleStats(prs);
    expect(stats.stalePRs.map((p) => p.number)).toEqual([2, 3, 1]);
  });
});

describe('formatStaleStatsSummary', () => {
  it('returns empty string for zero total', () => {
    const stats = computeStaleStats([]);
    expect(formatStaleStatsSummary(stats)).toBe('');
  });

  it('includes stale count and percentage', () => {
    const prs = [
      makePR({ number: 1, mergedAt: '2024-01-10T00:00:00Z' }),
      makePR({ number: 2, mergedAt: '2024-01-03T00:00:00Z' }),
    ];
    const stats = computeStaleStats(prs);
    const output = formatStaleStatsSummary(stats);
    expect(output).toContain('Stale PR Stats');
    expect(output).toContain('50%');
  });

  it('lists top stale PRs', () => {
    const prs = [makePR({ number: 42, title: 'Big refactor', author: 'bob', mergedAt: '2024-01-20T00:00:00Z' })];
    const stats = computeStaleStats(prs);
    const output = formatStaleStatsSummary(stats);
    expect(output).toContain('#42');
    expect(output).toContain('@bob');
  });
});

describe('appendStaleStatsToMarkdown', () => {
  it('appends section to existing markdown', () => {
    const prs = [makePR({ mergedAt: '2024-01-10T00:00:00Z' })];
    const stats = computeStaleStats(prs);
    const result = appendStaleStatsToMarkdown('# Digest', stats);
    expect(result).toContain('# Digest');
    expect(result).toContain('Stale PR Stats');
  });

  it('returns original markdown when no stats', () => {
    const stats = computeStaleStats([]);
    const result = appendStaleStatsToMarkdown('# Digest', stats);
    expect(result).toBe('# Digest');
  });
});
