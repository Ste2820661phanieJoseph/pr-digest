/**
 * Identifies "hotspot" files/areas touched by the most PRs in the digest period.
 * Uses PR titles and labels as a heuristic when file lists are unavailable.
 */

export interface HotspotEntry {
  label: string;
  count: number;
  authors: string[];
  prs: number[];
}

export interface HotspotStats {
  entries: HotspotEntry[];
  totalPRs: number;
  topLabel: string | null;
}

export interface HotspotPR {
  number: number;
  title: string;
  labels: string[];
  author: string;
}

/** Compute hotspot stats by grouping PRs per label. */
export function computeHotspotStats(prs: HotspotPR[]): HotspotStats {
  const map = new Map<string, { authors: Set<string>; prs: number[] }>();

  for (const pr of prs) {
    const keys = pr.labels.length > 0 ? pr.labels : ["unlabeled"];
    for (const key of keys) {
      if (!map.has(key)) {
        map.set(key, { authors: new Set(), prs: [] });
      }
      const entry = map.get(key)!;
      entry.authors.add(pr.author);
      entry.prs.push(pr.number);
    }
  }

  const entries: HotspotEntry[] = Array.from(map.entries())
    .map(([label, { authors, prs }]) => ({
      label,
      count: prs.length,
      authors: Array.from(authors).sort(),
      prs,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  return {
    entries,
    totalPRs: prs.length,
    topLabel: entries.length > 0 ? entries[0].label : null,
  };
}

/** Format hotspot stats as a Markdown table section. */
export function formatHotspotSection(stats: HotspotStats): string {
  if (stats.entries.length === 0) return "";

  const rows = stats.entries
    .slice(0, 10)
    .map(
      (e) =>
        `| \`${e.label}\` | ${e.count} | ${e.authors.slice(0, 3).join(", ")}${e.authors.length > 3 ? ` +${e.authors.length - 3}` : ""} |`
    )
    .join("\n");

  return [
    "## 🔥 Hotspot Labels",
    "",
    "| Label | PRs | Top Authors |",
    "|-------|-----|-------------|",
    rows,
    "",
  ].join("\n");
}

/** Append hotspot section to existing Markdown digest. */
export function appendHotspotToMarkdown(
  markdown: string,
  stats: HotspotStats
): string {
  const section = formatHotspotSection(stats);
  return section ? `${markdown}\n${section}` : markdown;
}
