import { EnrichedPR } from "./prEnricher";
import {
  findFirstTimeContributors,
  buildKnownContributorSet,
  formatFirstTimeContributorSection,
  FirstTimeContributorStats,
} from "./prFirstTimeContributor";
import { readCache } from "./cache";

export interface FirstTimeContributorSectionOptions {
  cachePath?: string;
}

/**
 * Builds the first-time contributor stats by reading historical
 * contributors from cache and comparing against the current week's PRs.
 */
export async function buildFirstTimeContributorSection(
  currentPRs: EnrichedPR[],
  options: FirstTimeContributorSectionOptions = {}
): Promise<{ stats: FirstTimeContributorStats; markdown: string }> {
  const cachePath = options.cachePath ?? ".pr-digest-cache.json";

  let knownContributors = new Set<string>();
  try {
    const cache = await readCache(cachePath);
    if (cache?.contributors && Array.isArray(cache.contributors)) {
      knownContributors = buildKnownContributorSet(
        cache.contributors.map((c: string) => ({ author: c }))
      );
    }
  } catch {
    // Cache not available; treat all as potentially new
  }

  const stats = findFirstTimeContributors(currentPRs, knownContributors);
  const markdown = formatFirstTimeContributorSection(stats);

  return { stats, markdown };
}

/**
 * Appends the first-time contributor section to an existing Markdown digest.
 */
export function appendFirstTimeContributorSection(
  existingMarkdown: string,
  sectionMarkdown: string
): string {
  if (!sectionMarkdown) return existingMarkdown;
  return `${existingMarkdown.trimEnd()}\n\n${sectionMarkdown}`;
}

/**
 * Returns contributor stats without full section building (for testing/reuse).
 */
export function getFirstTimeContributorStats(
  currentPRs: EnrichedPR[],
  knownContributors: Set<string>
): FirstTimeContributorStats {
  return findFirstTimeContributors(currentPRs, knownContributors);
}
