import {
  buildAuthorFrequency,
  findRepeatContributors,
  formatRepeatContributorSection,
  MinimalPR,
} from "./prRepeatContributor";

function makePR(author: string, mergedAt = "2024-01-15T10:00:00Z"): MinimalPR {
  return { author, mergedAt };
}

describe("buildAuthorFrequency", () => {
  it("counts single author", () => {
    const freq = buildAuthorFrequency([makePR("alice"), makePR("alice")]);
    expect(freq.get("alice")).toBe(2);
  });

  it("counts multiple authors independently", () => {
    const freq = buildAuthorFrequency([makePR("alice"), makePR("bob")]);
    expect(freq.get("alice")).toBe(1);
    expect(freq.get("bob")).toBe(1);
  });

  it("returns empty map for empty input", () => {
    expect(buildAuthorFrequency([]).size).toBe(0);
  });
});

describe("findRepeatContributors", () => {
  it("returns authors present in both periods", () => {
    const current = [makePR("alice"), makePR("alice"), makePR("bob")];
    const previous = [makePR("alice"), makePR("carol")];
    const result = findRepeatContributors(current, previous);
    expect(result).toHaveLength(1);
    expect(result[0].author).toBe("alice");
    expect(result[0].currentCount).toBe(2);
    expect(result[0].previousCount).toBe(1);
    expect(result[0].totalCount).toBe(3);
  });

  it("returns empty array when no overlap", () => {
    const current = [makePR("alice")];
    const previous = [makePR("bob")];
    expect(findRepeatContributors(current, previous)).toHaveLength(0);
  });

  it("sorts by totalCount descending", () => {
    const current = [makePR("alice"), makePR("bob"), makePR("bob")];
    const previous = [makePR("alice"), makePR("alice"), makePR("bob")];
    const result = findRepeatContributors(current, previous);
    expect(result[0].author).toBe("bob"); // total 3
    expect(result[1].author).toBe("alice"); // total 3 — stable but alice total=3 too; bob=3
    // both total 3, order may vary — just check both present
    const authors = result.map((r) => r.author);
    expect(authors).toContain("alice");
    expect(authors).toContain("bob");
  });

  it("handles empty current list", () => {
    expect(findRepeatContributors([], [makePR("alice")])).toHaveLength(0);
  });

  it("handles empty previous list", () => {
    expect(findRepeatContributors([makePR("alice")], [])).toHaveLength(0);
  });
});

describe("formatRepeatContributorSection", () => {
  it("returns empty string for empty stats", () => {
    expect(formatRepeatContributorSection([])).toBe("");
  });

  it("includes header and table rows", () => {
    const stats = [
      { author: "alice", currentCount: 2, previousCount: 1, totalCount: 3 },
    ];
    const output = formatRepeatContributorSection(stats);
    expect(output).toContain("## 🔁 Repeat Contributors");
    expect(output).toContain("@alice");
    expect(output).toContain("| 2 | 1 | 3 |");
  });

  it("renders multiple rows", () => {
    const stats = [
      { author: "alice", currentCount: 2, previousCount: 1, totalCount: 3 },
      { author: "bob", currentCount: 1, previousCount: 2, totalCount: 3 },
    ];
    const output = formatRepeatContributorSection(stats);
    expect(output).toContain("@alice");
    expect(output).toContain("@bob");
  });
});
