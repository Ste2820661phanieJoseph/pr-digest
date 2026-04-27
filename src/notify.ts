import * as core from '@actions/core';
import { IncomingWebhook } from '@slack/webhook';
import { buildSlackPayload } from './slack';
import { isRetryableError, delay } from './retry';

export interface NotifyResult {
  success: boolean;
  channel?: string;
  error?: string;
}

export async function sendSlackNotification(
  webhookUrl: string,
  markdownDigest: string,
  repoName: string,
  dateRange: { from: Date; to: Date },
  maxRetries = 3
): Promise<NotifyResult> {
  const webhook = new IncomingWebhook(webhookUrl);
  const payload = buildSlackPayload(markdownDigest, repoName, dateRange);

  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const response = await webhook.send(payload);
      core.info(`Slack notification sent successfully (attempt ${attempt + 1})`);
      return { success: true };
    } catch (err: unknown) {
      attempt++;
      const error = err as Error;
      core.warning(`Slack send attempt ${attempt} failed: ${error.message}`);

      if (!isRetryableError(error) || attempt >= maxRetries) {
        return { success: false, error: error.message };
      }

      const backoff = Math.pow(2, attempt) * 500;
      core.info(`Retrying in ${backoff}ms...`);
      await delay(backoff);
    }
  }

  return { success: false, error: 'Max retries exceeded' };
}

export async function postGitHubComment(
  octokit: import('@octokit/rest').Octokit,
  owner: string,
  repo: string,
  body: string
): Promise<NotifyResult> {
  try {
    await octokit.issues.create({ owner, repo, title: 'Weekly PR Digest', body, labels: ['digest'] });
    core.info('GitHub digest issue created successfully');
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    core.error(`Failed to create GitHub issue: ${error.message}`);
    return { success: false, error: error.message };
  }
}
