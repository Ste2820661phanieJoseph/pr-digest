import { EnrichedPR } from "./prEnricher";
import {
  computeContributorStats,
  formatContributorTable,
  ContributorStatsResult,
} from "./prContributorStats";

export interface ContributorSectionOptions {
  maxContributors?: number;
  showSummaryLine?: boolean;
}

const DEFAULT_OPTIONS: Required<ContributorSectionOptions> = {
  maxContributors: 10,
  showSummaryLine: true,
};

export function buildContributorSection(
  prs: EnrichedPR[],
  options: ContributorSectionOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const stats = computeContributorStats(prs);

  const lines: string[] = ["## 👥 Contributors", ""];

  if (opts.showSummaryLine && stats.totalAuthors > 0) {
    const parts: string[] = [
      `**${stats.totalAuthors}** contributor${
        stats.totalAuthors !== 1 ? "s" : ""
      } merged **${prs.length}** PR${
        prs.length !== 1 ? "s" : ""
      } this week.`,
    ];
    if (stats.mostActiveAuthor) {
      parts.push(`Most active: @${stats.mostActiveAuthor}.`);
    }
    lines.push(parts.join(" "), "");
  }

  const sliced = {
    ...stats,
    contributors: stats.contributors.slice(0, opts.maxContributors),
  };

  lines.push(formatContributorTable(sliced));

  return lines.join("\n");
}

export function appendContributorSectionToMarkdown(
  markdown: string,
  prs: EnrichedPR[],
  options?: ContributorSectionOptions
): string {
  const section = buildContributorSection(prs, options);
  return `${markdown}\n\n${section}`;
}

export function getContributorStats(
  prs: EnrichedPR[]
): ContributorStatsResult {
  return computeContributorStats(prs);
}
