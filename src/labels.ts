export const DEFAULT_LABEL_ORDER = [
  'breaking',
  'feature',
  'enhancement',
  'bug',
  'fix',
  'security',
  'performance',
  'docs',
  'chore',
  'dependencies',
  'other',
];

export const LABEL_DISPLAY_NAMES: Record<string, string> = {
  breaking: '🚨 Breaking Changes',
  feature: '✨ New Features',
  enhancement: '✨ Enhancements',
  bug: '🐛 Bug Fixes',
  fix: '🐛 Bug Fixes',
  security: '🔒 Security',
  performance: '⚡ Performance',
  docs: '📝 Documentation',
  chore: '🔧 Chores',
  dependencies: '📦 Dependencies',
  other: '🔀 Other',
};

export function getLabelDisplayName(label: string): string {
  return LABEL_DISPLAY_NAMES[label.toLowerCase()] ?? `🏷️ ${capitalize(label)}`;
}

export function sortLabelKeys(
  keys: string[],
  order: string[] = DEFAULT_LABEL_ORDER
): string[] {
  const orderMap = new Map(order.map((k, i) => [k, i]));
  return [...keys].sort((a, b) => {
    const ai = orderMap.get(a) ?? Number.MAX_SAFE_INTEGER;
    const bi = orderMap.get(b) ?? Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    return a.localeCompare(b);
  });
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
