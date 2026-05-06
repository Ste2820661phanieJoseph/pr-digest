/**
 * Computes label usage trends across PRs for a given period.
 */

export interface LabelTrendEntry {
  label: string;
  count: number;
  percentage: number;
}

export interface LabelTrendsResult {
  total: number;
  entries: LabelTrendEntry[];
  topLabel: string | null;
}

export interface TrendablePR {
  labels: string[];
}

/**
 * Counts how many PRs carry each label and returns sorted trend entries.
 */
export function computeLabelTrends(prs: TrendablePR[]): LabelTrendsResult {
  const total = prs.length;
  if (total === 0) {
    return { total: 0, entries: [], topLabel: null };
  }

  const counts = new Map<string, number>();
  for (const pr of prs) {
    for (const label of pr.labels) {
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }

  const entries: LabelTrendEntry[] = Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  const topLabel = entries.length > 0 ? entries[0].label : null;

  return { total, entries, topLabel };
}

/**
 * Formats label trends as a markdown table section.
 */
export function formatLabelTrendsTable(result: LabelTrendsResult): string {
  if (result.entries.length === 0) {
    return "_No label data available._\n";
  }

  const header = "| Label | PRs | Share |\n|-------|-----|-------|";
  const rows = result.entries
    .map((e) => `| \`${e.label}\` | ${e.count} | ${e.percentage}% |`)
    .join("\n");

  return `${header}\n${rows}\n`;
}
