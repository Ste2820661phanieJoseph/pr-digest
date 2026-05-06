/**
 * Persists and retrieves the all-time merged PR count using the
 * existing cache infrastructure so milestones survive across runs.
 */

import { readCache, writeCache, buildUpdatedCache } from "./cache";
import { detectMilestone, MilestoneResult } from "./prMilestone";

const CACHE_KEY = "allTimeMergedCount";

export async function loadAllTimeCount(
  cachePath: string
): Promise<number> {
  const cache = await readCache(cachePath);
  const raw = (cache as Record<string, unknown>)[CACHE_KEY];
  return typeof raw === "number" ? raw : 0;
}

export async function saveAllTimeCount(
  cachePath: string,
  count: number
): Promise<void> {
  const cache = await readCache(cachePath);
  const updated = buildUpdatedCache(cache, { [CACHE_KEY]: count });
  await writeCache(cachePath, updated);
}

export async function checkAndPersistMilestone(
  cachePath: string,
  weekCount: number
): Promise<MilestoneResult | null> {
  const previous = await loadAllTimeCount(cachePath);
  const milestone = detectMilestone(previous, weekCount);
  await saveAllTimeCount(cachePath, previous + weekCount);
  return milestone;
}
