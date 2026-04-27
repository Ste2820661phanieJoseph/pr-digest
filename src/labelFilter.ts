import { getLabelDisplayName, sortLabelKeys } from './labels';

export interface LabelGroup<T> {
  label: string;
  displayName: string;
  items: T[];
}

/**
 * Converts a Record<label, items[]> into an ordered array of LabelGroup objects.
 * Labels not in the allow-list are dropped when allowedLabels is provided.
 */
export function buildLabelGroups<T>(
  grouped: Record<string, T[]>,
  options: {
    labelOrder?: string[];
    allowedLabels?: string[];
  } = {}
): LabelGroup<T>[] {
  let keys = Object.keys(grouped);

  if (options.allowedLabels && options.allowedLabels.length > 0) {
    const allowed = new Set(options.allowedLabels.map((l) => l.toLowerCase()));
    keys = keys.filter((k) => allowed.has(k.toLowerCase()));
  }

  const sorted = sortLabelKeys(keys, options.labelOrder);

  return sorted
    .filter((label) => grouped[label]?.length > 0)
    .map((label) => ({
      label,
      displayName: getLabelDisplayName(label),
      items: grouped[label],
    }));
}

/**
 * Returns labels that have no associated items (empty groups).
 */
export function findEmptyLabels(grouped: Record<string, unknown[]>): string[] {
  return Object.entries(grouped)
    .filter(([, items]) => items.length === 0)
    .map(([label]) => label);
}
