import { describe, it, expect } from 'vitest';
import {
  getLabelDisplayName,
  sortLabelKeys,
  DEFAULT_LABEL_ORDER,
  LABEL_DISPLAY_NAMES,
} from './labels';

describe('getLabelDisplayName', () => {
  it('returns mapped display name for known labels', () => {
    expect(getLabelDisplayName('bug')).toBe('🐛 Bug Fixes');
    expect(getLabelDisplayName('feature')).toBe('✨ New Features');
    expect(getLabelDisplayName('security')).toBe('🔒 Security');
  });

  it('is case-insensitive', () => {
    expect(getLabelDisplayName('BUG')).toBe('🐛 Bug Fixes');
    expect(getLabelDisplayName('Feature')).toBe('✨ New Features');
  });

  it('returns a fallback for unknown labels', () => {
    expect(getLabelDisplayName('custom')).toBe('🏷️ Custom');
    expect(getLabelDisplayName('my-team')).toBe('🏷️ My-team');
  });
});

describe('sortLabelKeys', () => {
  it('sorts keys according to DEFAULT_LABEL_ORDER', () => {
    const keys = ['chore', 'bug', 'feature', 'breaking'];
    const sorted = sortLabelKeys(keys);
    expect(sorted).toEqual(['breaking', 'feature', 'bug', 'chore']);
  });

  it('places unknown keys at the end, sorted alphabetically', () => {
    const keys = ['zzz', 'aaa', 'bug'];
    const sorted = sortLabelKeys(keys);
    expect(sorted[0]).toBe('bug');
    expect(sorted[1]).toBe('aaa');
    expect(sorted[2]).toBe('zzz');
  });

  it('accepts a custom order', () => {
    const keys = ['alpha', 'beta', 'gamma'];
    const sorted = sortLabelKeys(keys, ['gamma', 'alpha', 'beta']);
    expect(sorted).toEqual(['gamma', 'alpha', 'beta']);
  });

  it('does not mutate the original array', () => {
    const keys = ['bug', 'feature'];
    sortLabelKeys(keys);
    expect(keys).toEqual(['bug', 'feature']);
  });

  it('covers all DEFAULT_LABEL_ORDER entries in LABEL_DISPLAY_NAMES', () => {
    for (const label of DEFAULT_LABEL_ORDER.filter((l) => l !== 'other')) {
      expect(LABEL_DISPLAY_NAMES).toHaveProperty(label);
    }
  });
});
