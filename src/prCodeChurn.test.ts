import { computeChurnStats, formatChurnSummary, appendChurnStatsToMarkdown, ChurnInput } from './prCodeChurn';

function makePR(overrides: Partial<ChurnInput> = {}): ChurnInput {
  return {
    additions: 50,
    deletions: 20,
    title: 'Default PR',
    author: 'dev',
    mergedAt: '2024-01-15T10:00:00Z',
    ...overrides,
  };
}

describe('computeChurnStats', () => {
  it('returns zeros for empty list', () => {
    const stats = computeChurnStats([]);
    expect(stats.prCount).toBe(0);
    expect(stats.totalAdditions).toBe(0);
    expect(stats.totalDeletions).toBe(0);
    expect(stats.churnRatio).toBe(0);
    expect(stats.topChurnPR).toBeNull();
  });

  it('computes totals correctly', () => {
    const prs = [
      makePR({ additions: 100, deletions: 40 }),
      makePR({ additions: 60, deletions: 20 }),
    ];
    const stats = computeChurnStats(prs);
    expect(stats.totalAdditions).toBe(160);
    expect(stats.totalDeletions).toBe(60);
    expect(stats.totalChangedLines).toBe(220);
    expect(stats.prCount).toBe(2);
  });

  it('computes averages correctly', () => {
    const prs = [
      makePR({ additions: 100, deletions: 50 }),
      makePR({ additions: 200, deletions: 150 }),
    ];
    const stats = computeChurnStats(prs);
    expect(stats.avgAdditionsPerPR).toBe(150);
    expect(stats.avgDeletionsPerPR).toBe(100);
  });

  it('computes churn ratio', () => {
    const prs = [makePR({ additions: 75, deletions: 25 })];
    const stats = computeChurnStats(prs);
    expect(stats.churnRatio).toBe(0.25);
  });

  it('identifies top churn PR by total changed lines', () => {
    const small = makePR({ additions: 10, deletions: 5, title: 'Small' });
    const large = makePR({ additions: 500, deletions: 300, title: 'Large' });
    const stats = computeChurnStats([small, large]);
    expect(stats.topChurnPR?.title).toBe('Large');
  });

  it('handles single PR', () => {
    const pr = makePR({ additions: 30, deletions: 10 });
    const stats = computeChurnStats([pr]);
    expect(stats.topChurnPR).toEqual(pr);
    expect(stats.avgAdditionsPerPR).toBe(30);
  });
});

describe('formatChurnSummary', () => {
  it('returns empty string for zero PRs', () => {
    const stats = computeChurnStats([]);
    expect(formatChurnSummary(stats)).toBe('');
  });

  it('includes churn ratio and top PR', () => {
    const prs = [
      makePR({ additions: 300, deletions: 100, title: 'Big refactor', author: 'alice' }),
    ];
    const stats = computeChurnStats(prs);
    const output = formatChurnSummary(stats);
    expect(output).toContain('### 🔁 Code Churn');
    expect(output).toContain('25.0% deletions');
    expect(output).toContain('Big refactor');
    expect(output).toContain('@alice');
  });

  it('formats numbers with toLocaleString', () => {
    const prs = [makePR({ additions: 1000, deletions: 500 })];
    const stats = computeChurnStats(prs);
    const output = formatChurnSummary(stats);
    expect(output).toContain('1,500');
  });
});

describe('appendChurnStatsToMarkdown', () => {
  it('appends section to existing markdown', () => {
    const prs = [makePR({ additions: 80, deletions: 20 })];
    const stats = computeChurnStats(prs);
    const result = appendChurnStatsToMarkdown('# Digest', stats);
    expect(result).toContain('# Digest');
    expect(result).toContain('### 🔁 Code Churn');
  });

  it('returns original markdown when no PRs', () => {
    const stats = computeChurnStats([]);
    const result = appendChurnStatsToMarkdown('# Digest', stats);
    expect(result).toBe('# Digest');
  });
});
