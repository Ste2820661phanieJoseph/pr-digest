import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';

export interface DigestCache {
  lastRunAt: string;
  digestedPRNumbers: number[];
}

const DEFAULT_CACHE_PATH = path.join(process.cwd(), '.pr-digest-cache.json');

export function readCache(cachePath: string = DEFAULT_CACHE_PATH): DigestCache {
  try {
    if (!fs.existsSync(cachePath)) {
      core.debug(`Cache file not found at ${cachePath}, returning empty cache.`);
      return { lastRunAt: '', digestedPRNumbers: [] };
    }
    const raw = fs.readFileSync(cachePath, 'utf-8');
    const parsed = JSON.parse(raw) as DigestCache;
    core.debug(`Cache loaded: ${parsed.digestedPRNumbers.length} PR(s) previously digested.`);
    return parsed;
  } catch (err) {
    core.warning(`Failed to read cache: ${(err as Error).message}`);
    return { lastRunAt: '', digestedPRNumbers: [] };
  }
}

export function writeCache(
  data: DigestCache,
  cachePath: string = DEFAULT_CACHE_PATH
): void {
  try {
    fs.writeFileSync(cachePath, JSON.stringify(data, null, 2), 'utf-8');
    core.debug(`Cache written to ${cachePath}.`);
  } catch (err) {
    core.warning(`Failed to write cache: ${(err as Error).message}`);
  }
}

export function filterNewPRs<T extends { number: number }>(
  prs: T[],
  cache: DigestCache
): T[] {
  const seen = new Set(cache.digestedPRNumbers);
  return prs.filter((pr) => !seen.has(pr.number));
}

export function buildUpdatedCache(
  existing: DigestCache,
  newPRNumbers: number[]
): DigestCache {
  return {
    lastRunAt: new Date().toISOString(),
    digestedPRNumbers: [
      ...new Set([...existing.digestedPRNumbers, ...newPRNumbers]),
    ],
  };
}
