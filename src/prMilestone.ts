/**
 * Detects milestone PRs (e.g. 100th, 500th merged PR) and formats
 * a celebratory callout for the digest.
 */

export interface MilestoneResult {
  hit: boolean;
  number: number;
  label: string;
}

const MILESTONES = [10, 25, 50, 100, 250, 500, 1000];

/**
 * Given the total number of PRs merged this week and a running
 * all-time total *before* this week, returns any milestone crossed.
 */
export function detectMilestone(
  previousTotal: number,
  weekCount: number
): MilestoneResult | null {
  const newTotal = previousTotal + weekCount;
  for (const m of MILESTONES) {
    if (previousTotal < m && newTotal >= m) {
      return { hit: true, number: m, label: formatMilestoneLabel(m) };
    }
  }
  return null;
}

export function formatMilestoneLabel(n: number): string {
  return `🎉 ${n}th merged PR milestone!`;
}

export function formatMilestoneSection(
  milestone: MilestoneResult
): string {
  return [
    `## ${milestone.label}`,
    ``,
    `The team just crossed **${milestone.number} merged pull requests**. `,
    `Thanks to everyone who contributed! 🚀`,
    ``,
  ].join("\n");
}

export function appendMilestoneToMarkdown(
  markdown: string,
  milestone: MilestoneResult | null
): string {
  if (!milestone) return markdown;
  return formatMilestoneSection(milestone) + markdown;
}
