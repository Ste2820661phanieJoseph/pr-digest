/**
 * Utilities for sorting PRs within label groups.
 */

export type SortField = "merged_at" | "title" | "author" | "size";
export type SortOrder = "asc" | "desc";

export interface SortOptions {
  field: SortField;
  order: SortOrder;
}

export interface SortablePR {
  number: number;
  title: string;
  author: string;
  merged_at: string | null;
  size?: string;
}

const SIZE_RANK: Record<string, number> = {
  XS: 0,
  S: 1,
  M: 2,
  L: 3,
  XL: 4,
  XXL: 5,
};

function compareValues(a: unknown, b: unknown, order: SortOrder): number {
  const dir = order === "asc" ? 1 : -1;
  if (a == null && b == null) return 0;
  if (a == null) return dir;
  if (b == null) return -dir;
  if (a < b) return -dir;
  if (a > b) return dir;
  return 0;
}

export function sortPRs<T extends SortablePR>(
  prs: T[],
  options: SortOptions
): T[] {
  const { field, order } = options;
  return [...prs].sort((a, b) => {
    if (field === "size") {
      const rankA = SIZE_RANK[a.size ?? ""] ?? -1;
      const rankB = SIZE_RANK[b.size ?? ""] ?? -1;
      return compareValues(rankA, rankB, order);
    }
    return compareValues(a[field], b[field], order);
  });
}

export function parseSortOption(raw: string): SortOptions {
  const [fieldPart, orderPart] = raw.trim().split(":");
  const field = (fieldPart as SortField) || "merged_at";
  const order: SortOrder = orderPart === "asc" ? "asc" : "desc";
  const validFields: SortField[] = ["merged_at", "title", "author", "size"];
  if (!validFields.includes(field)) {
    throw new Error(`Invalid sort field: "${field}". Must be one of: ${validFields.join(", ")}`);
  }
  return { field, order };
}
