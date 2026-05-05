import { EnrichedPR } from "./prEnricher";

export interface FirstTimeContributorStats {
  newContributors: string[];
  count: number;
  prs: EnrichedPR[];
}

/**
 * Identifies first-time contributors by comparing current PR authors
 * against a known set of previous contributors.
 */
export function findFirstTimeContributors(
  currentPRs: EnrichedPR[],
  knownContributors: Set<string>
): FirstTimeContributorStats {
  const newContributorMap = new Map<string, EnrichedPR[]>();

  for (const pr of currentPRs) {
    const author = pr.author;
    if (!author || knownContributors.has(author)) continue;
    if (!newContributorMap.has(author)) {
      newContributorMap.set(author, []);
    }
    newContributorMap.get(author)!.push(pr);
  }

  const newContributors = Array.from(newContributorMap.keys()).sort();
  const prs = newContributors.flatMap((a) => newContributorMap.get(a)!);

  return { newContributors, count: newContributors.length, prs };
}

/**
 * Builds a set of known contributors from a list of historical PRs.
 */
export function buildKnownContributorSet(
  historicalPRs: Array<{ author?: string }>
): Set<string> {
  const set = new Set<string>();
  for (const pr of historicalPRs) {
    if (pr.author) set.add(pr.author);
  }
  return set;
}

/**
 * Formats a Markdown section highlighting first-time contributors.
 */
export function formatFirstTimeContributorSection(
  stats: FirstTimeContributorStats
): string {
  if (stats.count === 0) return "";

  const lines: string[] = [
    "## 🎉 First-Time Contributors",
    "",
    `Welcome to ${stats.count} new contributor${stats.count !== 1 ? "s" : ""} this week!`,
    "",
  ];

  for (const contributor of stats.newContributors) {
    const contributorPRs = stats.prs.filter((p) => p.author === contributor);
    const prLinks = contributorPRs
      .map((p) => `[#${p.number}](${p.url})`)
      .join(", ");
    lines.push(`- **@${contributor}** — ${prLinks}`);
  }

  lines.push("");
  return lines.join("\n");
}
