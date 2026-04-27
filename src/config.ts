import * as core from '@actions/core';

export interface ActionConfig {
  githubToken: string;
  repo: string;
  owner: string;
  slackWebhookUrl: string | undefined;
  openaiApiKey: string;
  labelFilter: string[];
  outputFormat: 'markdown' | 'slack' | 'both';
  daysBack: number;
}

export function loadConfig(): ActionConfig {
  const githubToken = core.getInput('github-token', { required: true });
  const openaiApiKey = core.getInput('openai-api-key', { required: true });
  const repository = core.getInput('repository') ||
    process.env.GITHUB_REPOSITORY ||
    '';

  if (!repository.includes('/')) {
    throw new Error(`Invalid repository format: "${repository}". Expected "owner/repo".`);
  }

  const [owner, repo] = repository.split('/');

  const slackWebhookUrl = core.getInput('slack-webhook-url') || undefined;

  const labelFilterRaw = core.getInput('label-filter');
  const labelFilter = labelFilterRaw
    ? labelFilterRaw.split(',').map((l) => l.trim()).filter(Boolean)
    : [];

  const outputFormatRaw = core.getInput('output-format') || 'markdown';
  if (!['markdown', 'slack', 'both'].includes(outputFormatRaw)) {
    throw new Error(`Invalid output-format: "${outputFormatRaw}". Must be markdown, slack, or both.`);
  }

  const daysBackRaw = core.getInput('days-back') || '7';
  const daysBack = parseInt(daysBackRaw, 10);
  if (isNaN(daysBack) || daysBack < 1) {
    throw new Error(`Invalid days-back value: "${daysBackRaw}". Must be a positive integer.`);
  }

  return {
    githubToken,
    openaiApiKey,
    owner,
    repo,
    slackWebhookUrl,
    labelFilter,
    outputFormat: outputFormatRaw as ActionConfig['outputFormat'],
    daysBack,
  };
}
