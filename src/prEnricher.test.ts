import {
  getSizeLabel,
  hasDescription,
  normalizeTitle,
  enrichPR,
  RawPR,
} from "./prEnricher";

function makeRaw(overrides: Partial<RawPR> = {}): RawPR {
  return {
    number: 42,
    title: "fix: something",
    body: "Fixes a bug.",
    author: "alice",
    labels: ["bug"],
    mergedAt: "2024-06-01T12:00:00Z",
    url: "https://github.com/org/repo/pull/42",
    additions: 10,
    deletions: 5,
    ...overrides,
  };
}

describe("getSizeLabel", () => {
  it.each<[number, string]>([
    [0, "XS"],
    [10, "XS"],
    [11, "S"],
    [50, "S"],
    [51, "M"],
    [200, "M"],
    [201, "L"],
    [800, "L"],
    [801, "XL"],
    [999999, "XL"],
  ])('churn %i -> %s', (churn, expected) => {
    expect(getSizeLabel(churn)).toBe(expected);
  });
});

describe("hasDescription", () => {
  it("returns false for null", () => expect(hasDescription(null)).toBe(false));
  it("returns false for empty string", () => expect(hasDescription("")).toBe(false));
  it("returns false for whitespace-only", () => expect(hasDescription("   ")).toBe(false));
  it("returns false for 'No description'", () => expect(hasDescription("no description")).toBe(false));
  it("returns false for 'N/A'", () => expect(hasDescription("n/a")).toBe(false));
  it("returns true for real content", () => expect(hasDescription("Fixes the login bug.")).toBe(true));
});

describe("normalizeTitle", () => {
  it("sentence-cases the title", () => {
    expect(normalizeTitle("fix: something broken")).toBe("Fix: something broken");
  });
  it("handles empty string", () => {
    expect(normalizeTitle("")).toBe("");
  });
  it("trims whitespace", () => {
    expect(normalizeTitle("  hello  ")).toBe("Hello  ");
  });
});

describe("enrichPR", () => {
  it("computes churn correctly", () => {
    const pr = makeRaw({ additions: 30, deletions: 20 });
    expect(enrichPR(pr).churn).toBe(50);
  });

  it("assigns correct sizeLabel", () => {
    const pr = makeRaw({ additions: 100, deletions: 50 });
    expect(enrichPR(pr).sizeLabel).toBe("M");
  });

  it("sets hasDescription based on body", () => {
    expect(enrichPR(makeRaw({ body: "Details here." })).hasDescription).toBe(true);
    expect(enrichPR(makeRaw({ body: null })).hasDescription).toBe(false);
  });

  it("normalizes the title", () => {
    const pr = makeRaw({ title: "add new feature" });
    expect(enrichPR(pr).normalizedTitle).toBe("Add new feature");
  });
});
