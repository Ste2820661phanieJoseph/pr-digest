import { getLastWeekRange, groupPRsByLabel } from './github';

describe('getLastWeekRange', () => {
  it('returns a range of 7 days ending at the current date', () => {
    const now = new Date('2024-06-10T12:00:00Z');
    jest.useFakeTimers().setSystemTime(now);

    const { from, to } = getLastWeekRange();

    expect(to.toISOString()).toBe(now.toISOString());
    const expectedFrom = new Date('2024-06-03T12:00:00Z');
    expect(from.toISOString()).toBe(expectedFrom.toISOString());

    jest.useRealTimers();
  });

  it('returns Date objects', () => {
    const { from, to } = getLastWeekRange();
    expect(from).toBeInstanceOf(Date);
    expect(to).toBeInstanceOf(Date);
  });
});

describe('groupPRsByLabel', () => {
  const makePR = (labels: string[]) => ({
    number: Math.floor(Math.random() * 1000),
    title: 'Test PR',
    html_url: 'https://github.com/org/repo/pull/1',
    merged_at: '2024-06-07T10:00:00Z',
    user: { login: 'octocat' },
    labels: labels.map((name) => ({ name })),
    body: 'PR body',
  });

  it('groups PRs by their first matching label', () => {
    const prs = [
      makePR(['feature']),
      makePR(['bugfix']),
      makePR(['feature']),
    ];

    const grouped = groupPRsByLabel(prs as any);

    expect(grouped['feature']).toHaveLength(2);
    expect(grouped['bugfix']).toHaveLength(1);
  });

  it('places PRs with no labels under "uncategorized"', () => {
    const prs = [makePR([]), makePR([])];
    const grouped = groupPRsByLabel(prs as any);
    expect(grouped['uncategorized']).toHaveLength(2);
  });

  it('uses the first label when a PR has multiple labels', () => {
    const pr = makePR(['hotfix', 'bugfix']);
    const grouped = groupPRsByLabel([pr] as any);
    expect(grouped['hotfix']).toHaveLength(1);
    expect(grouped['bugfix']).toBeUndefined();
  });

  it('returns an empty object when given an empty array', () => {
    const grouped = groupPRsByLabel([]);
    expect(grouped).toEqual({});
  });
});
