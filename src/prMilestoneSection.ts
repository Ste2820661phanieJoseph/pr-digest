/**
 * High-level integration: resolves the milestone for the current run
 * and appends the section to the markdown digest.
 */

import { checkAndPersistMilestone } from "./prMilestoneTracker";
import { appendMilestoneToMarkdown, MilestoneResult } from "./prMilestone";

export interface MilestoneSectionOptions {
  cachePath: string;
  weekCount: number;
  enabled: boolean;
}

export async function resolveMilestone(
  opts: MilestoneSectionOptions
): Promise<MilestoneResult | null> {
  if (!opts.enabled) return null;
  return checkAndPersistMilestone(opts.cachePath, opts.weekCount);
}

export async function appendMilestoneSectionToMarkdown(
  markdown: string,
  opts: MilestoneSectionOptions
): Promise<string> {
  const milestone = await resolveMilestone(opts);
  return appendMilestoneToMarkdown(markdown, milestone);
}

export function getMilestoneStats(
  milestone: MilestoneResult | null
): Record<string, string | number | boolean> {
  return {
    milestone_hit: milestone?.hit ?? false,
    milestone_number: milestone?.number ?? 0,
    milestone_label: milestone?.label ?? "",
  };
}
