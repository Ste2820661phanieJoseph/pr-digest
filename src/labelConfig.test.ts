import { loadLabelConfig, validateLabelOrder } from './labelConfig';

describe('loadLabelConfig', () => {
  it('returns default config when no label config provided', () => {
    const config = loadLabelConfig(undefined);
    expect(config).toBeDefined();
    expect(config.order).toBeInstanceOf(Array);
    expect(config.order.length).toBeGreaterThan(0);
  });

  it('parses valid YAML label config string', () => {
    const yaml = `
order:
  - feature
  - bugfix
  - chore
displayNames:
  feature: "New Features"
  bugfix: "Bug Fixes"
  chore: "Chores"
`;
    const config = loadLabelConfig(yaml);
    expect(config.order).toEqual(['feature', 'bugfix', 'chore']);
    expect(config.displayNames?.feature).toBe('New Features');
    expect(config.displayNames?.bugfix).toBe('Bug Fixes');
  });

  it('handles config with only order defined', () => {
    const yaml = `
order:
  - alpha
  - beta
`;
    const config = loadLabelConfig(yaml);
    expect(config.order).toEqual(['alpha', 'beta']);
    expect(config.displayNames).toBeUndefined();
  });

  it('throws on invalid YAML', () => {
    const badYaml = `order: [unclosed`;
    expect(() => loadLabelConfig(badYaml)).toThrow();
  });

  it('throws when order field is missing', () => {
    const yaml = `
displayNames:
  feature: "Features"
`;
    expect(() => loadLabelConfig(yaml)).toThrow(/order/);
  });

  it('throws when order is not an array', () => {
    const yaml = `order: "not-an-array"`;
    expect(() => loadLabelConfig(yaml)).toThrow();
  });
});

describe('validateLabelOrder', () => {
  it('returns true for valid non-empty array of strings', () => {
    expect(validateLabelOrder(['feature', 'bugfix'])).toBe(true);
  });

  it('returns false for empty array', () => {
    expect(validateLabelOrder([])).toBe(false);
  });

  it('returns false for non-array input', () => {
    expect(validateLabelOrder('feature' as unknown as string[])).toBe(false);
    expect(validateLabelOrder(null as unknown as string[])).toBe(false);
    expect(validateLabelOrder(undefined as unknown as string[])).toBe(false);
  });

  it('returns false if any element is not a string', () => {
    expect(validateLabelOrder(['feature', 42 as unknown as string])).toBe(false);
  });

  it('returns false if any element is an empty string', () => {
    expect(validateLabelOrder(['feature', ''])).toBe(false);
  });

  it('returns true for single-element array', () => {
    expect(validateLabelOrder(['hotfix'])).toBe(true);
  });
});
