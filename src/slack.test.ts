import { buildSlackPayload, SlackPayload } from './slack';

describe('buildSlackPayload', () => {
  it('returns a payload with correct username and icon', () => {
    const payload: SlackPayload = buildSlackPayload('Hello world');
    expect(payload.username).toBe('PR Digest');
    expect(payload.icon_emoji).toBe(':newspaper:');
  });

  it('wraps content in a mrkdwn section block', () => {
    const content = '*Weekly Digest*\n- PR #1: Fix bug';
    const payload = buildSlackPayload(content);

    expect(payload.blocks).toBeDefined();
    expect(payload.blocks!.length).toBeGreaterThan(0);

    const firstBlock = payload.blocks![0];
    expect(firstBlock.type).toBe('section');
    expect(firstBlock.text?.type).toBe('mrkdwn');
    expect(firstBlock.text?.text).toBe(content);
  });

  it('handles empty string content', () => {
    const payload = buildSlackPayload('');
    expect(payload.blocks![0].text?.text).toBe('');
  });

  it('handles multiline content', () => {
    const content = 'Line 1\nLine 2\nLine 3';
    const payload = buildSlackPayload(content);
    expect(payload.blocks![0].text?.text).toBe(content);
  });

  it('returns blocks as an array', () => {
    const payload = buildSlackPayload('test');
    expect(Array.isArray(payload.blocks)).toBe(true);
  });
});

describe('postToSlack', () => {
  it('throws when webhook URL is invalid', async () => {
    const { postToSlack } = await import('./slack');
    await expect(
      postToSlack('not-a-valid-url', { text: 'test' })
    ).rejects.toThrow();
  });
});
