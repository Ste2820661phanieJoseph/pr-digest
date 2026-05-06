/**
 * Computes statistics about draft vs ready PRs in the digest window.
 */

export interface DraftStats {
  total: number;
  drafts: number;
  ready: number;
  draftRatio: number; // 0–1
  convertedFromDraft: number; // merged PRs that were once drafts (title heuristic)
}

export interface DraftStatsPR {
  draft?: boolean;
  title?: string;
  labels?: string[];
}

/**
 * Detects if a PR title suggests it was converted from draft
 * (common convention: prefix like "[Draft]" or "WIP:").
 */
export function wasLikelyDraft(pr: DraftStatsPR): boolean {
  const title = (pr.title ?? "").toLowerCase();
  return (
    title.startsWith("[draft]") ||
    title.startsWith("draft:") ||
    title.startsWith("wip:") ||
    title.startsWith("[wip]")
  );
}

export function computeDraftStats(prs: DraftStatsPR[]): DraftStats {
  const total = prs.length;
  const drafts = prs.filter((pr) => pr.draft === true).length;
  const ready = total - drafts;
  const draftRatio = total === 0 ? 0 : drafts / total;
  const convertedFromDraft = prs.filter(
    (pr) => !pr.draft && wasLikelyDraft(pr)
  ).length;

  return { total, drafts, ready, draftRatio, convertedFromDraft };
}

export function formatDraftStatsSummary(stats: DraftStats): string {
  if (stats.total === 0) return "";

  const pct = (stats.draftRatio * 100).toFixed(0);
  const lines: string[] = [];

  lines.push(`**Draft vs Ready PRs**`);
  lines.push(
    `- Ready: ${stats.ready} | Draft: ${stats.drafts} (${pct}% of total)`
  );

  if (stats.convertedFromDraft > 0) {
    lines.push(
      `- ${stats.convertedFromDraft} PR(s) appear to have been converted from draft (WIP/Draft title prefix)`
    );
  }

  return lines.join("\n");
}

export function appendDraftStatsToMarkdown(
  markdown: string,
  prs: DraftStatsPR[]
): string {
  const stats = computeDraftStats(prs);
  if (stats.total === 0 || stats.drafts === 0) return markdown;
  const section = formatDraftStatsSummary(stats);
  return `${markdown}\n\n${section}`;
}
