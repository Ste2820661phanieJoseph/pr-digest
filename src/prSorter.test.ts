import { sortPRs, parseSortOption, SortablePR } from "./prSorter";

function makePR(overrides: Partial<SortablePR> = {}): SortablePR {
  return {
    number: 1,
    title: "fix: something",
    author: "alice",
    merged_at: "2024-01-10T12:00:00Z",
    size: "M",
    ...overrides,
  };
}

describe("sortPRs", () => {
  const prs = [
    makePR({ number: 1, title: "chore: cleanup", merged_at: "2024-01-08T10:00:00Z", size: "XL" }),
    makePR({ number: 2, title: "feat: new thing", merged_at: "2024-01-10T12:00:00Z", size: "S" }),
    makePR({ number: 3, title: "fix: bug", merged_at: "2024-01-09T08:00:00Z", size: "M" }),
  ];

  it("sorts by merged_at descending by default", () => {
    const result = sortPRs(prs, { field: "merged_at", order: "desc" });
    expect(result.map((p) => p.number)).toEqual([2, 3, 1]);
  });

  it("sorts by merged_at ascending", () => {
    const result = sortPRs(prs, { field: "merged_at", order: "asc" });
    expect(result.map((p) => p.number)).toEqual([1, 3, 2]);
  });

  it("sorts by title ascending", () => {
    const result = sortPRs(prs, { field: "title", order: "asc" });
    expect(result[0].title).toBe("chore: cleanup");
    expect(result[2].title).toBe("fix: bug");
  });

  it("sorts by size ascending (XS < S < M < L < XL)", () => {
    const result = sortPRs(prs, { field: "size", order: "asc" });
    expect(result.map((p) => p.size)).toEqual(["S", "M", "XL"]);
  });

  it("sorts by size descending", () => {
    const result = sortPRs(prs, { field: "size", order: "desc" });
    expect(result.map((p) => p.size)).toEqual(["XL", "M", "S"]);
  });

  it("does not mutate original array", () => {
    const original = [...prs];
    sortPRs(prs, { field: "title", order: "asc" });
    expect(prs).toEqual(original);
  });

  it("handles null merged_at gracefully", () => {
    const withNull = [makePR({ number: 1, merged_at: null }), makePR({ number: 2, merged_at: "2024-01-01T00:00:00Z" })];
    const result = sortPRs(withNull, { field: "merged_at", order: "desc" });
    expect(result[0].number).toBe(2);
  });
});

describe("parseSortOption", () => {
  it("parses field:order format", () => {
    expect(parseSortOption("title:asc")).toEqual({ field: "title", order: "asc" });
    expect(parseSortOption("merged_at:desc")).toEqual({ field: "merged_at", order: "desc" });
  });

  it("defaults to desc when order omitted", () => {
    expect(parseSortOption("author")).toEqual({ field: "author", order: "desc" });
  });

  it("throws on invalid field", () => {
    expect(() => parseSortOption("unknown:asc")).toThrow(/Invalid sort field/);
  });
});
