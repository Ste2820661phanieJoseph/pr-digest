/**
 * Enriches raw PR data with derived fields used by formatters and summarizers.
 */

export interface RawPR {
  number: number;
  title: string;
  body: string | null;
  author: string;
  labels: string[];
  mergedAt: string;
  url: string;
  additions: number;
  deletions: number;
}

export interface EnrichedPR extends RawPR {
  /** Total lines changed */
  churn: number;
  /** Size bucket based on churn */
  sizeLabel: "XS" | "S" | "M" | "L" | "XL";
  /** Whether the PR body appears to be empty / boilerplate */
  hasDescription: boolean;
  /** Sanitized title (trimmed, sentence-cased) */
  normalizedTitle: string;
}

const SIZE_THRESHOLDS: [number, EnrichedPR["sizeLabel"]][] = [
  [10, "XS"],
  [50, "S"],
  [200, "M"],
  [800, "L"],
  [Infinity, "XL"],
];

export function getSizeLabel(churn: number): EnrichedPR["sizeLabel"] {
  for (const [threshold, label] of SIZE_THRESHOLDS) {
    if (churn <= threshold) return label;
  }
  return "XL";
}

const BOILERPLATE_PATTERNS = [
  /^\s*$/,
  /^\s*no\s+description\s*$/i,
  /^\s*n\/a\s*$/i,
];

export function hasDescription(body: string | null): boolean {
  if (!body) return false;
  return !BOILERPLATE_PATTERNS.some((re) => re.test(body.trim()));
}

export function normalizeTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function enrichPR(pr: RawPR): EnrichedPR {
  const churn = pr.additions + pr.deletions;
  return {
    ...pr,
    churn,
    sizeLabel: getSizeLabel(churn),
    hasDescription: hasDescription(pr.body),
    normalizedTitle: normalizeTitle(pr.title),
  };
}

export function enrichPRs(prs: RawPR[]): EnrichedPR[] {
  return prs.map(enrichPR);
}
