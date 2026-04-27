import { formatMarkdownDigest, formatSlackDigest, DigestOptions } from './formatter';
import { PullRequest } from './github';

const mockPR = (overrides: Partial<PullRequest> = {}): PullRequest => ({
  number: 42,
  title: 'Add new feature',
  url: 'https://github.com/org/repo/pull/42',
  author: 'alice',
  mergedAt: '2024-01-15T10:00:00Z',
  body: 'This adds a new feature.',
  labels: [],
  ...overrides,
});

const baseOptions = (): DigestOptions => ({
  repoName: 'org/repo',
  startDate: new Date('2024-01-08'),
  endDate: new Date('2024-01-14'),
  sections: [
    {
      title: '🚀 Features',
      prs: [mockPR()],
      summary: 'One new feature was added this week.',
    },
    {
      title: '🐛 Bug Fixes',
      prs: [mockPR({ number: 43, title: 'Fix critical bug', author: 'bob' })],
      summary: 'A critical bug was resolved.',
    },
  ],
});

describe('formatMarkdownDigest', () => {
  it('includes repo name in heading', () => {
    const result = formatMarkdownDigest(baseOptions());
    expect(result).toContain('org/repo');
  });

  it('includes date range', () => {
    const result = formatMarkdownDigest(baseOptions());
    expect(result).toContain('2024-01-08');
    expect(result).toContain('2024-01-14');
  });

  it('lists all PRs with links', () => {
    const result = formatMarkdownDigest(baseOptions());
    expect(result).toContain('#42');
    expect(result).toContain('#43');
    expect(result).toContain('https://github.com/org/repo/pull/42');
  });

  it('shows total PR count', () => {
    const result = formatMarkdownDigest(baseOptions());
    expect(result).toContain('Total PRs merged:** 2');
  });

  it('skips empty sections', () => {
    const opts = baseOptions();
    opts.sections[1].prs = [];
    const result = formatMarkdownDigest(opts);
    expect(result).not.toContain('🐛 Bug Fixes');
  });

  it('includes section summaries as blockquotes', () => {
    const result = formatMarkdownDigest(baseOptions());
    expect(result).toContain('> One new feature was added this week.');
  });
});

describe('formatSlackDigest', () => {
  it('formats PR links as Slack hyperlinks', () => {
    const result = formatSlackDigest(baseOptions());
    expect(result).toContain('<https://github.com/org/repo/pull/42|#42>');
  });

  it('includes repo name', () => {
    const result = formatSlackDigest(baseOptions());
    expect(result).toContain('org/repo');
  });

  it('shows total merged count', () => {
    const result = formatSlackDigest(baseOptions());
    expect(result).toContain('2 PRs merged');
  });
});
