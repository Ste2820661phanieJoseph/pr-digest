/**
 * Integration helpers for the stale PR stats section.
 * Mirrors the pattern used by prDraftStats / prReviewSection.
 */

import { computeStaleStats, appendStaleStatsToMarkdown, StaleStats, StaleStatsInput } from './prStaleStats';

export interface StaleablePR {
  number: number;
  title: string;
  author: { login: string };
  createdAt: string;
  mergedAt: string | null;
  updatedAt: string;
}

function toStaleInput(pr: StaleablePR): StaleStatsInput | null {
  if (!pr.mergedAt) return null;
  return {
    number: pr.number,
    title: pr.title,
    author: pr.author.login,
    createdAt: pr.createdAt,
    mergedAt: pr.mergedAt,
    updatedAt: pr.updatedAt,
  };
}

export function getStaleStats(prs: StaleablePR[]): StaleStats {
  const inputs = prs.flatMap((pr) => {
    const input = toStaleInput(pr);
    return input ? [input] : [];
  });
  return computeStaleStats(inputs);
}

export function buildStaleSection(prs: StaleablePR[]): string {
  const stats = getStaleStats(prs);
  if (stats.total === 0) return '';

  const { formatStaleStatsSummary } = require('./prStaleStats');
  return formatStaleStatsSummary(stats);
}

export function appendStaleSectionToMarkdown(markdown: string, prs: StaleablePR[]): string {
  const stats = getStaleStats(prs);
  return appendStaleStatsToMarkdown(markdown, stats);
}
