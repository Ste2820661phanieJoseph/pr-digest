/**
 * Computes and formats a size distribution breakdown of merged PRs.
 * Size labels are produced by prEnricher: xs, s, m, l, xl
 */

export type SizeLabel = "xs" | "s" | "m" | "l" | "xl";

export interface SizeDistribution {
  xs: number;
  s: number;
  m: number;
  l: number;
  xl: number;
  total: number;
}

export interface PRWithSize {
  sizeLabel?: string;
}

const SIZE_ORDER: SizeLabel[] = ["xs", "s", "m", "l", "xl"];

const SIZE_EMOJI: Record<SizeLabel, string> = {
  xs: "🟢",
  s: "🔵",
  m: "🟡",
  l: "🟠",
  xl: "🔴",
};

export function computeSizeDistribution(prs: PRWithSize[]): SizeDistribution {
  const dist: SizeDistribution = { xs: 0, s: 0, m: 0, l: 0, xl: 0, total: prs.length };
  for (const pr of prs) {
    const label = pr.sizeLabel as SizeLabel | undefined;
    if (label && label in dist) {
      dist[label]++;
    }
  }
  return dist;
}

export function formatSizeBar(count: number, total: number, width = 20): string {
  if (total === 0) return "".padEnd(width, "░");
  const filled = Math.round((count / total) * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

export function formatSizeDistributionTable(dist: SizeDistribution): string {
  if (dist.total === 0) return "_No PRs to display._";

  const lines: string[] = [
    "### 📐 PR Size Distribution\n",
    "| Size | Count | % | Bar |",
    "|------|------:|--:|-----|",
  ];

  for (const size of SIZE_ORDER) {
    const count = dist[size];
    const pct = dist.total > 0 ? ((count / dist.total) * 100).toFixed(1) : "0.0";
    const bar = formatSizeBar(count, dist.total);
    const emoji = SIZE_EMOJI[size];
    lines.push(`| ${emoji} \`${size.toUpperCase()}\` | ${count} | ${pct}% | \`${bar}\` |`);
  }

  lines.push(`| **Total** | **${dist.total}** | | |`);
  return lines.join("\n");
}

export function appendSizeDistributionToMarkdown(
  markdown: string,
  prs: PRWithSize[]
): string {
  const dist = computeSizeDistribution(prs);
  const section = formatSizeDistributionTable(dist);
  return `${markdown}\n\n${section}`;
}
