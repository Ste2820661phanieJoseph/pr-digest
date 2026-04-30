import { PullRequest } from "./github";

export interface PRFilterOptions {
  excludeDrafts?: boolean;
  excludeBots?: boolean;
  botLogins?: string[];
  minChangedFiles?: number;
  requiredLabels?: string[];
}

const DEFAULT_BOT_LOGINS = ["dependabot[bot]", "renovate[bot]", "github-actions[bot]"];

export function filterPRs(
  prs: PullRequest[],
  options: PRFilterOptions = {}
): PullRequest[] {
  const {
    excludeDrafts = true,
    excludeBots = false,
    botLogins = DEFAULT_BOT_LOGINS,
    minChangedFiles,
    requiredLabels,
  } = options;

  return prs.filter((pr) => {
    if (excludeDrafts && pr.draft) return false;

    if (excludeBots && botLogins.includes(pr.user?.login ?? "")) return false;

    if (
      minChangedFiles !== undefined &&
      (pr.changed_files ?? 0) < minChangedFiles
    )
      return false;

    if (requiredLabels && requiredLabels.length > 0) {
      const prLabelNames = (pr.labels ?? []).map((l) => l.name);
      const hasRequired = requiredLabels.some((rl) => prLabelNames.includes(rl));
      if (!hasRequired) return false;
    }

    return true;
  });
}

export function partitionBotPRs(
  prs: PullRequest[],
  botLogins: string[] = DEFAULT_BOT_LOGINS
): { human: PullRequest[]; bot: PullRequest[] } {
  const human: PullRequest[] = [];
  const bot: PullRequest[] = [];
  for (const pr of prs) {
    if (botLogins.includes(pr.user?.login ?? "")) {
      bot.push(pr);
    } else {
      human.push(pr);
    }
  }
  return { human, bot };
}
