import { sendSlackNotification, postGitHubComment } from './notify';
import { IncomingWebhook } from '@slack/webhook';

jest.mock('@actions/core', () => ({
  info: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
}));

jest.mock('@slack/webhook');

jest.mock('./retry', () => ({
  isRetryableError: jest.fn(() => false),
  delay: jest.fn(() => Promise.resolve()),
}));

const mockSend = jest.fn();
(IncomingWebhook as jest.Mock).mockImplementation(() => ({ send: mockSend }));

const dateRange = { from: new Date('2024-01-01'), to: new Date('2024-01-07') };

describe('sendSlackNotification', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns success when webhook send resolves', async () => {
    mockSend.mockResolvedValueOnce({});
    const result = await sendSlackNotification('https://hooks.slack.com/test', '## Digest', 'owner/repo', dateRange);
    expect(result.success).toBe(true);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('returns failure when send throws non-retryable error', async () => {
    mockSend.mockRejectedValueOnce(new Error('invalid_token'));
    const result = await sendSlackNotification('https://hooks.slack.com/test', '## Digest', 'owner/repo', dateRange);
    expect(result.success).toBe(false);
    expect(result.error).toContain('invalid_token');
  });

  it('retries on retryable errors', async () => {
    const { isRetryableError } = require('./retry');
    (isRetryableError as jest.Mock).mockReturnValue(true);
    mockSend.mockRejectedValueOnce(new Error('timeout')).mockResolvedValueOnce({});
    const result = await sendSlackNotification('https://hooks.slack.com/test', '## Digest', 'owner/repo', dateRange, 3);
    expect(result.success).toBe(true);
    expect(mockSend).toHaveBeenCalledTimes(2);
  });
});

describe('postGitHubComment', () => {
  it('creates a GitHub issue and returns success', async () => {
    const mockOctokit = { issues: { create: jest.fn().mockResolvedValueOnce({}) } } as any;
    const result = await postGitHubComment(mockOctokit, 'owner', 'repo', '## Digest');
    expect(result.success).toBe(true);
    expect(mockOctokit.issues.create).toHaveBeenCalledWith(
      expect.objectContaining({ owner: 'owner', repo: 'repo', labels: ['digest'] })
    );
  });

  it('returns failure when issue creation throws', async () => {
    const mockOctokit = { issues: { create: jest.fn().mockRejectedValueOnce(new Error('forbidden')) } } as any;
    const result = await postGitHubComment(mockOctokit, 'owner', 'repo', '## Digest');
    expect(result.success).toBe(false);
    expect(result.error).toBe('forbidden');
  });
});
