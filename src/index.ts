import * as core from '@actions/core';
import * as github from '@actions/github';
import { fetchMergedPRs } from './github/fetchPRs';
import { summarizePRs } from './ai/summarize';
import { formatDigest } from './digest/format';
import { postDigest } from './output/post';

/**
 * Main entry point for the PR Digest GitHub Action.
 * Orchestrates fetching merged PRs, generating AI summaries,
 * formatting the digest, and posting the result.
 */
async function run(): Promise<void> {
  try {
    // Read inputs from action.yml
    const token = core.getInput('github-token', { required: true });
    const openaiApiKey = core.getInput('openai-api-key', { required: true });
    const lookbackDays = parseInt(core.getInput('lookback-days') || '7', 10);
    const outputMode = core.getInput('output-mode') || 'comment';
    const issueNumber = parseInt(core.getInput('issue-number') || '0', 10);
    const slackWebhookUrl = core.getInput('slack-webhook-url') || '';

    core.info(`Starting PR Digest generation for the last ${lookbackDays} day(s)...`);

    // Determine the date range for fetching PRs
    const since = new Date();
    since.setDate(since.getDate() - lookbackDays);

    const octokit = github.getOctokit(token);
    const { owner, repo } = github.context.repo;

    core.info(`Fetching merged PRs from ${owner}/${repo} since ${since.toISOString()}`);

    // Fetch merged PRs within the lookback window
    const mergedPRs = await fetchMergedPRs(octokit, owner, repo, since);

    if (mergedPRs.length === 0) {
      core.info('No merged PRs found in the specified time range. Exiting.');
      core.setOutput('pr-count', '0');
      core.setOutput('digest', '');
      return;
    }

    core.info(`Found ${mergedPRs.length} merged PR(s). Generating AI summaries...`);

    // Generate AI-powered summaries for each PR
    const summarizedPRs = await summarizePRs(mergedPRs, openaiApiKey);

    // Format the digest into a human-readable markdown document
    const digest = formatDigest(summarizedPRs, {
      owner,
      repo,
      since,
      lookbackDays,
    });

    core.info('Digest formatted. Posting output...');

    // Post the digest to the configured output destination
    await postDigest(digest, {
      mode: outputMode,
      octokit,
      owner,
      repo,
      issueNumber,
      slackWebhookUrl,
    });

    // Set action outputs
    core.setOutput('pr-count', String(mergedPRs.length));
    core.setOutput('digest', digest);

    core.info('PR Digest action completed successfully.');
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`PR Digest action failed: ${error.message}`);
    } else {
      core.setFailed('PR Digest action failed with an unknown error.');
    }
  }
}

run();
