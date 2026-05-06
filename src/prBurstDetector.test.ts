import { computeBurstStats, formatBurstSummary, BurstInput } from './prBurstDetector';

function makePR(mergedAt: string, author: string): BurstInput {
  return { mergedAt, author };
}

describe('computeBurstStats', () => {
  it('returns empty stats for no PRs', () => {
    const stats = computeBurstStats([]);
    expect(stats.peakDate).toBeNull();
    expect(stats.peakCount).toBe(0);
    expect(stats.entries).toHaveLength(0);
    expect(stats.burstDays).toHaveLength(0);
  });

  it('computes peak date correctly', () => {
    const prs: BurstInput[] = [
      makePR('2024-03-01T10:00:00Z', 'alice'),
      makePR('2024-03-01T11:00:00Z', 'bob'),
      makePR('2024-03-01T12:00:00Z', 'carol'),
      makePR('2024-03-02T10:00:00Z', 'alice'),
    ];
    const stats = computeBurstStats(prs);
    expect(stats.peakDate).toBe('2024-03-01');
    expect(stats.peakCount).toBe(3);
  });

  it('identifies burst days above threshold', () => {
    const prs: BurstInput[] = [
      makePR('2024-03-01T10:00:00Z', 'alice'),
      makePR('2024-03-02T10:00:00Z', 'bob'),
      makePR('2024-03-02T11:00:00Z', 'carol'),
      makePR('2024-03-02T12:00:00Z', 'dave'),
      makePR('2024-03-02T13:00:00Z', 'eve'),
      makePR('2024-03-03T10:00:00Z', 'alice'),
    ];
    // avg = 6/3 = 2, threshold = ceil(2*2) = 4
    const stats = computeBurstStats(prs, 2);
    expect(stats.threshold).toBe(4);
    expect(stats.burstDays).toHaveLength(1);
    expect(stats.burstDays[0].date).toBe('2024-03-02');
  });

  it('returns no burst days when all days are below threshold', () => {
    const prs: BurstInput[] = [
      makePR('2024-03-01T10:00:00Z', 'alice'),
      makePR('2024-03-02T10:00:00Z', 'bob'),
      makePR('2024-03-03T10:00:00Z', 'carol'),
    ];
    const stats = computeBurstStats(prs, 3);
    // avg = 1, threshold = ceil(1*3) = 3, no day reaches 3
    expect(stats.burstDays).toHaveLength(0);
  });

  it('entries are sorted by date ascending', () => {
    const prs: BurstInput[] = [
      makePR('2024-03-03T10:00:00Z', 'carol'),
      makePR('2024-03-01T10:00:00Z', 'alice'),
      makePR('2024-03-02T10:00:00Z', 'bob'),
    ];
    const stats = computeBurstStats(prs);
    expect(stats.entries.map((e) => e.date)).toEqual(['2024-03-01', '2024-03-02', '2024-03-03']);
  });
});

describe('formatBurstSummary', () => {
  it('returns no-activity message when no burst days', () => {
    const stats = computeBurstStats([]);
    expect(formatBurstSummary(stats)).toContain('No burst activity');
  });

  it('marks peak date with flame emoji', () => {
    const prs: BurstInput[] = [
      makePR('2024-03-01T10:00:00Z', 'alice'),
      makePR('2024-03-01T11:00:00Z', 'bob'),
      makePR('2024-03-01T12:00:00Z', 'carol'),
      makePR('2024-03-01T13:00:00Z', 'dave'),
      makePR('2024-03-02T10:00:00Z', 'alice'),
    ];
    const stats = computeBurstStats(prs, 2);
    const output = formatBurstSummary(stats);
    expect(output).toContain('🔥 peak');
    expect(output).toContain('2024-03-01');
  });

  it('includes threshold in header', () => {
    const prs: BurstInput[] = [
      makePR('2024-03-01T10:00:00Z', 'alice'),
      makePR('2024-03-01T11:00:00Z', 'bob'),
      makePR('2024-03-01T12:00:00Z', 'carol'),
      makePR('2024-03-01T13:00:00Z', 'dave'),
      makePR('2024-03-02T10:00:00Z', 'alice'),
    ];
    const stats = computeBurstStats(prs, 2);
    const output = formatBurstSummary(stats);
    expect(output).toContain(`threshold: ≥${stats.threshold}`);
  });
});
