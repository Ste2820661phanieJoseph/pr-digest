import {
  appendFirstTimeContributorSection,
  getFirstTimeContributorStats,
} from "./prFirstTimeContributorSection";
import { EnrichedPR } from "./prEnricher";

function makePR(overrides: Partial<EnrichedPR> = {}): EnrichedPR {
  return {
    number: 1,
    title: "feat: something",
    author: "alice",
    url: "https://github.com/org/repo/pull/1",
    mergedAt: "2024-01-15T12:00:00Z",
    labels: [],
    sizeLabel: "medium",
    hasDescription: true,
    normalizedTitle: "feat: something",
    ...overrides,
  } as EnrichedPR;
}

describe("getFirstTimeContributorStats", () => {
  it("returns zero count when known set covers all authors", () => {
    const prs = [makePR({ author: "alice" }), makePR({ author: "bob", number: 2 })];
    const known = new Set(["alice", "bob"]);
    const stats = getFirstTimeContributorStats(prs, known);
    expect(stats.count).toBe(0);
    expect(stats.newContributors).toHaveLength(0);
  });

  it("detects new contributors missing from known set", () => {
    const prs = [
      makePR({ author: "alice", number: 1 }),
      makePR({ author: "carol", number: 2 }),
    ];
    const known = new Set(["alice"]);
    const stats = getFirstTimeContributorStats(prs, known);
    expect(stats.count).toBe(1);
    expect(stats.newContributors).toContain("carol");
    expect(stats.prs).toHaveLength(1);
    expect(stats.prs[0].number).toBe(2);
  });

  it("handles empty PR list", () => {
    const stats = getFirstTimeContributorStats([], new Set(["alice"]));
    expect(stats.count).toBe(0);
    expect(stats.prs).toHaveLength(0);
  });

  it("handles empty known set (all are new)", () => {
    const prs = [
      makePR({ author: "alice", number: 1 }),
      makePR({ author: "bob", number: 2 }),
    ];
    const stats = getFirstTimeContributorStats(prs, new Set());
    expect(stats.count).toBe(2);
    expect(stats.newContributors).toEqual(["alice", "bob"]);
  });
});

describe("appendFirstTimeContributorSection", () => {
  it("returns existing markdown unchanged when section is empty", () => {
    const existing = "# Digest\n\nSome content";
    expect(appendFirstTimeContributorSection(existing, "")).toBe(existing);
  });

  it("appends section to existing markdown", () => {
    const existing = "# Digest\n\nSome content";
    const section = "## 🎉 First-Time Contributors\n\nWelcome!\n";
    const result = appendFirstTimeContributorSection(existing, section);
    expect(result).toContain("# Digest");
    expect(result).toContain("First-Time Contributors");
    expect(result.indexOf("# Digest")).toBeLessThan(
      result.indexOf("First-Time Contributors")
    );
  });

  it("trims trailing whitespace from existing before appending", () => {
    const existing = "# Digest\n\nContent   \n\n";
    const section = "## New Section\n";
    const result = appendFirstTimeContributorSection(existing, section);
    expect(result).not.toMatch(/\s{3,}## New Section/);
  });
});
