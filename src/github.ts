import * as github from '@actions/github';
import * as core from '@actions/core';

export interface PullRequest {
  number: number;
  title: string;
  body: string | null;
  url: string;
  author: string;
  mergedAt: string;
  labels: string[];
  additions: number;
  deletions: number;
  changedFiles: number;
}

/**
 * Fetches merged pull requests from the repository within the given date range.
 *
 * @param token - GitHub token for authentication
 * @param owner - Repository owner (org or user)
 * @param repo - Repository name
 * @param since - ISO 8601 date string for the start of the range
 * @param until - ISO 8601 date string for the end of the range
 * @returns Array of merged pull requests
 */
export async function getMergedPullRequests(
  token: string,
  owner: string,
  repo: string,
  since: string,
  until: string
): Promise<PullRequest[]> {
  const octokit = github.getOctokit(token);
  const pullRequests: PullRequest[] = [];

  core.info(`Fetching merged PRs for ${owner}/${repo} from ${since} to ${until}`);

  try {
    // Use paginated search to find merged PRs in the date range
    const iterator = octokit.paginate.iterator(octokit.rest.pulls.list, {
      owner,
      repo,
      state: 'closed',
      sort: 'updated',
      direction: 'desc',
      per_page: 100,
    });

    for await (const { data: prs } of iterator) {
      let reachedBefore = false;

      for (const pr of prs) {
        if (!pr.merged_at) continue;

        const mergedAt = new Date(pr.merged_at);
        const sinceDate = new Date(since);
        const untilDate = new Date(until);

        // Stop paginating if we've gone past our range
        if (mergedAt < sinceDate) {
          reachedBefore = true;
          break;
        }

        if (mergedAt >= sinceDate && mergedAt <= untilDate) {
          pullRequests.push({
            number: pr.number,
            title: pr.title,
            body: pr.body ?? null,
            url: pr.html_url,
            author: pr.user?.login ?? 'unknown',
            mergedAt: pr.merged_at,
            labels: pr.labels.map((l) => l.name ?? '').filter(Boolean),
            additions: pr.additions ?? 0,
            deletions: pr.deletions ?? 0,
            changedFiles: pr.changed_files ?? 0,
          });
        }
      }

      if (reachedBefore) break;
    }
  } catch (error) {
    core.error(`Failed to fetch pull requests: ${error}`);
    throw error;
  }

  core.info(`Found ${pullRequests.length} merged PR(s) in the specified range.`);
  return pullRequests;
}

/**
 * Returns the default date range for the past week.
 */
export function getLastWeekRange(): { since: string; until: string } {
  const until = new Date();
  const since = new Date();
  since.setDate(until.getDate() - 7);

  return {
    since: since.toISOString(),
    until: until.toISOString(),
  };
}
