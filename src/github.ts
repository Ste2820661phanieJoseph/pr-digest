import * as core from '@actions/core';
import { Octokit } from '@octokit/rest';

export interface PullRequest {
  number: number;
  title: string;
  url: string;
  author: string | null;
  mergedAt: string;
  body: string | null;
  labels: string[];
}

export function getLastWeekRange(): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 7);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export async function fetchMergedPRs(
  octokit: Octokit,
  owner: string,
  repo: string,
  since: Date,
  until: Date
): Promise<PullRequest[]> {
  const prs: PullRequest[] = [];
  let page = 1;

  while (true) {
    const { data } = await octokit.pulls.list({
      owner,
      repo,
      state: 'closed',
      sort: 'updated',
      direction: 'desc',
      per_page: 100,
      page,
    });

    if (data.length === 0) break;

    let reachedBefore = false;

    for (const pr of data) {
      if (!pr.merged_at) continue;

      const mergedAt = new Date(pr.merged_at);

      if (mergedAt < since) {
        reachedBefore = true;
        break;
      }

      if (mergedAt > until) continue;

      prs.push({
        number: pr.number,
        title: pr.title,
        url: pr.html_url,
        author: pr.user?.login ?? null,
        mergedAt: pr.merged_at,
        body: pr.body ?? null,
        labels: pr.labels.map((l) => (typeof l === 'string' ? l : l.name ?? '')),
      });
    }

    if (reachedBefore) break;
    page++;
  }

  core.info(`Fetched ${prs.length} merged PRs from ${owner}/${repo}`);
  return prs;
}

export function groupPRsByLabel(
  prs: PullRequest[],
  labelGroups: Record<string, string[]>
): Record<string, PullRequest[]> {
  const result: Record<string, PullRequest[]> = {};

  for (const [groupName] of Object.entries(labelGroups)) {
    result[groupName] = [];
  }
  result['other'] = [];

  for (const pr of prs) {
    let matched = false;
    for (const [groupName, labels] of Object.entries(labelGroups)) {
      if (pr.labels.some((l) => labels.includes(l))) {
        result[groupName].push(pr);
        matched = true;
        break;
      }
    }
    if (!matched) {
      result['other'].push(pr);
    }
  }

  return result;
}
