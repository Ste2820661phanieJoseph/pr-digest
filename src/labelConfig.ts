import * as core from '@actions/core';
import { DEFAULT_LABEL_ORDER } from './labels';

export interface LabelConfig {
  labelOrder: string[];
  allowedLabels: string[];
  fallbackLabel: string;
}

/**
 * Reads label-related configuration from action inputs.
 * Falls back to sensible defaults when inputs are absent.
 */
export function loadLabelConfig(): LabelConfig {
  const rawOrder = core.getInput('label_order').trim();
  const rawAllowed = core.getInput('allowed_labels').trim();
  const fallbackLabel = core.getInput('fallback_label').trim() || 'other';

  const labelOrder = rawOrder
    ? rawOrder.split(',').map((l) => l.trim()).filter(Boolean)
    : DEFAULT_LABEL_ORDER;

  const allowedLabels = rawAllowed
    ? rawAllowed.split(',').map((l) => l.trim()).filter(Boolean)
    : [];

  return { labelOrder, allowedLabels, fallbackLabel };
}

/**
 * Validates that a label order array contains no duplicate entries.
 * Logs a warning for each duplicate found.
 */
export function validateLabelOrder(order: string[]): boolean {
  const seen = new Set<string>();
  let valid = true;
  for (const label of order) {
    if (seen.has(label)) {
      core.warning(`Duplicate label in label_order: "${label}"`);
      valid = false;
    }
    seen.add(label);
  }
  return valid;
}

/**
 * Checks whether a given label is considered allowed based on the config.
 * If `allowedLabels` is empty, all labels are treated as allowed.
 * The `fallbackLabel` is always considered allowed.
 */
export function isLabelAllowed(label: string, config: LabelConfig): boolean {
  if (label === config.fallbackLabel) {
    return true;
  }
  if (config.allowedLabels.length === 0) {
    return true;
  }
  return config.allowedLabels.includes(label);
}
