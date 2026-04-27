import { describe, it, expect } from 'vitest';
import { buildLabelGroups, findEmptyLabels } from './labelFilter';

const sampleGrouped = {
  bug: ['fix login', 'fix crash'],
  feature: ['add dark mode'],
  chore: ['update deps'],
};

describe('buildLabelGroups', () => {
  it('returns groups ordered by default label order', () => {
    const groups = buildLabelGroups(sampleGrouped);
    const labels = groups.map((g) => g.label);
    expect(labels.indexOf('feature')).toBeLessThan(labels.indexOf('bug'));
    expect(labels.indexOf('bug')).toBeLessThan(labels.indexOf('chore'));
  });

  it('attaches correct displayName', () => {
    const groups = buildLabelGroups({ bug: ['item'] });
    expect(groups[0].displayName).toBe('🐛 Bug Fixes');
  });

  it('filters by allowedLabels', () => {
    const groups = buildLabelGroups(sampleGrouped, {
      allowedLabels: ['bug', 'feature'],
    });
    expect(groups.map((g) => g.label)).not.toContain('chore');
    expect(groups).toHaveLength(2);
  });

  it('is case-insensitive for allowedLabels', () => {
    const groups = buildLabelGroups(sampleGrouped, {
      allowedLabels: ['BUG'],
    });
    expect(groups.map((g) => g.label)).toContain('bug');
  });

  it('excludes empty groups', () => {
    const groups = buildLabelGroups({ bug: [], feature: ['item'] });
    expect(groups.map((g) => g.label)).not.toContain('bug');
  });

  it('respects custom labelOrder', () => {
    const groups = buildLabelGroups(sampleGrouped, {
      labelOrder: ['chore', 'bug', 'feature'],
    });
    expect(groups[0].label).toBe('chore');
  });
});

describe('findEmptyLabels', () => {
  it('returns labels with no items', () => {
    const result = findEmptyLabels({ bug: [], feature: ['item'], chore: [] });
    expect(result).toContain('bug');
    expect(result).toContain('chore');
    expect(result).not.toContain('feature');
  });

  it('returns empty array when all groups have items', () => {
    const result = findEmptyLabels({ bug: ['a'], feature: ['b'] });
    expect(result).toHaveLength(0);
  });
});
