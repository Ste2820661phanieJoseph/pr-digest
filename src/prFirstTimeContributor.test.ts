import {
  findFirstTimeContributors,
  buildKnownContributorSet,
  formatFirstTimeContributorSection,
} from "./prFirstTimeContributor";
import { EnrichedPR } from "./prEnricher";

function makePR(overrides: Partial<EnrichedPR> = {}): EnrichedPR {
  return {
    number: 1,
    title: "Test PR",
    author: "alice",
    url: "https://github.com/org/repo/pull/1",
    mergedAt: "2024-01-15T10:00:00Z",
    labels: [],
    sizeLabel: "small",
    hasDescription: true,
    normalizedTitle: "test pr",
    ...overrides,
  } as EnrichedPR;
}

describe("buildKnownContributorSet", () => {
  it("builds a set from historical PRs", () => {
    const historical = [
      { author: "alice" },
      { author: "bob" },
      { author: "alice" },
    ];
    const set = buildKnownContributorSet(historical);
    expect(set.has("alice")).toBe(true);
    expect(set.has("bob")).toBe(true);
    expect(set.size).toBe(2);
  });

  it("ignores entries without author", () => {
    const set = buildKnownContributorSet([{ author: undefined }, { author: "carol" }]);
    expect(set.has("carol")).toBe(true);
    expect(set.size).toBe(1);
  });
});

describe("findFirstTimeContributors", () => {
  it("returns empty when all authors are known", () => {
    const prs = [makePR({ author: "alice" }), makePR({ author: "bob", number: 2 })];
    const known = new Set(["alice", "bob"]);
    const result = findFirstTimeContributors(prs, known);
    expect(result.count).toBe(0);
    expect(result.newContributors).toEqual([]);
  });

  it("identifies new contributors not in known set", () => {
    const prs = [
      makePR({ author: "alice", number: 1 }),
      makePR({ author: "newbie", number: 2 }),
      makePR({ author: "newbie", number: 3 }),
    ];
    const known = new Set(["alice"]);
    const result = findFirstTimeContributors(prs, known);
    expect(result.count).toBe(1);
    expect(result.newContributors).toEqual(["newbie"]);
    expect(result.prs).toHaveLength(2);
  });

  it("handles PRs without author", () => {
    const prs = [makePR({ author: undefined as unknown as string, number: 1 })];
    const known = new Set<string>();
    const result = findFirstTimeContributors(prs, known);
    expect(result.count).toBe(0);
  });
});

describe("formatFirstTimeContributorSection", () => {
  it("returns empty string when no new contributors", () => {
    const stats = { newContributors: [], count: 0, prs: [] };
    expect(formatFirstTimeContributorSection(stats)).toBe("");
  });

  it("formats section with new contributors", () => {
    const prs = [makePR({ author: "newbie", number: 42, url: "https://github.com/org/repo/pull/42" })];
    const stats = { newContributors: ["newbie"], count: 1, prs };
    const output = formatFirstTimeContributorSection(stats);
    expect(output).toContain("First-Time Contributors");
    expect(output).toContain("@newbie");
    expect(output).toContain("[#42]");
    expect(output).toContain("1 new contributor this week");
  });

  it("uses plural form for multiple contributors", () => {
    const prs = [
      makePR({ author: "a", number: 1 }),
      makePR({ author: "b", number: 2 }),
    ];
    const stats = { newContributors: ["a", "b"], count: 2, prs };
    const output = formatFirstTimeContributorSection(stats);
    expect(output).toContain("2 new contributors this week");
  });
});
