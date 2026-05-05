import { EnrichedPR } from "./prEnricher";

export interface ContributorStat {
  login: string;
  prCount: number;
  additions: number;
  deletions: number;
  linesChanged: number;
  labels: string[];
}

export interface ContributorStatsResult {
  contributors: ContributorStat[];
  totalAuthors: number;
  mostActiveAuthor: string | null;
  mostLinesAuthor: string | null;
}

export function computeContributorStats(
  prs: EnrichedPR[]
): ContributorStatsResult {
  const map = new Map<string, ContributorStat>();

  for (const pr of prs) {
    const login = pr.user?.login ?? "unknown";
    const existing = map.get(login);
    const additions = pr.additions ?? 0;
    const deletions = pr.deletions ?? 0;
    const labels = (pr.labels ?? []).map((l) =>
      typeof l === "string" ? l : l.name ?? ""
    );

    if (existing) {
      existing.prCount += 1;
      existing.additions += additions;
      existing.deletions += deletions;
      existing.linesChanged += additions + deletions;
      existing.labels = Array.from(new Set([...existing.labels, ...labels]));
    } else {
      map.set(login, {
        login,
        prCount: 1,
        additions,
        deletions,
        linesChanged: additions + deletions,
        labels,
      });
    }
  }

  const contributors = Array.from(map.values()).sort(
    (a, b) => b.prCount - a.prCount
  );

  const mostActiveAuthor = contributors[0]?.login ?? null;
  const mostLinesAuthor =
    contributors.length > 0
      ? contributors.reduce((a, b) =>
          a.linesChanged >= b.linesChanged ? a : b
        ).login
      : null;

  return {
    contributors,
    totalAuthors: contributors.length,
    mostActiveAuthor,
    mostLinesAuthor,
  };
}

export function formatContributorTable(stats: ContributorStatsResult): string {
  if (stats.contributors.length === 0) return "_No contributors this week._";

  const rows = stats.contributors
    .slice(0, 10)
    .map(
      (c) =>
        `| @${c.login} | ${c.prCount} | +${c.additions} / -${c.deletions} |`
    )
    .join("\n");

  return [
    "| Contributor | PRs | Lines |",
    "| --- | --- | --- |",
    rows,
  ].join("\n");
}
