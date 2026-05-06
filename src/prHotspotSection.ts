/**
 * Integration helpers for the hotspot feature:
 * converts enriched PRs to HotspotPR and wires into the digest pipeline.
 */

import {
  computeHotspotStats,
  appendHotspotToMarkdown,
  HotspotStats,
  HotspotPR,
} from "./prHotspot";

export interface EnrichedPRForHotspot {
  number: number;
  title: string;
  labels: string[];
  author: string;
}

/** Convert enriched PRs to the minimal shape required by hotspot logic. */
export function toHotspotInput(prs: EnrichedPRForHotspot[]): HotspotPR[] {
  return prs.map((pr) => ({
    number: pr.number,
    title: pr.title,
    labels: pr.labels,
    author: pr.author,
  }));
}

/** Compute hotspot stats from enriched PRs. */
export function getHotspotStats(prs: EnrichedPRForHotspot[]): HotspotStats {
  return computeHotspotStats(toHotspotInput(prs));
}

/** Build a standalone hotspot section string. */
export function buildHotspotSection(prs: EnrichedPRForHotspot[]): string {
  const stats = getHotspotStats(prs);
  return appendHotspotToMarkdown("", stats).trimStart();
}

/** Append hotspot section to an existing Markdown digest string. */
export function appendHotspotSection(
  markdown: string,
  prs: EnrichedPRForHotspot[]
): string {
  const stats = getHotspotStats(prs);
  return appendHotspotToMarkdown(markdown, stats);
}
