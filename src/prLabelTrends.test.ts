import { computeLabelTrends, formatLabelTrendsTable } from "./prLabelTrends";

function makePR(labels: string[]) {
  return { labels };
}

describe("computeLabelTrends", () => {
  it("returns empty result for no PRs", () => {
    const result = computeLabelTrends([]);
    expect(result.total).toBe(0);
    expect(result.entries).toEqual([]);
    expect(result.topLabel).toBeNull();
  });

  it("counts single label correctly", () => {
    const prs = [makePR(["bug"]), makePR(["bug"]), makePR(["feature"])];
    const result = computeLabelTrends(prs);
    expect(result.total).toBe(3);
    expect(result.entries[0].label).toBe("bug");
    expect(result.entries[0].count).toBe(2);
    expect(result.entries[0].percentage).toBe(67);
  });

  it("handles PRs with multiple labels", () => {
    const prs = [makePR(["bug", "urgent"]), makePR(["bug"]), makePR(["feature"])];
    const result = computeLabelTrends(prs);
    const bugEntry = result.entries.find((e) => e.label === "bug");
    expect(bugEntry?.count).toBe(2);
  });

  it("sorts by count descending then label ascending", () => {
    const prs = [
      makePR(["alpha"]),
      makePR(["beta"]),
      makePR(["alpha"]),
    ];
    const result = computeLabelTrends(prs);
    expect(result.entries[0].label).toBe("alpha");
    expect(result.entries[1].label).toBe("beta");
  });

  it("sets topLabel to the most common label", () => {
    const prs = [makePR(["x"]), makePR(["x"]), makePR(["y"])];
    expect(computeLabelTrends(prs).topLabel).toBe("x");
  });

  it("handles PRs with no labels", () => {
    const prs = [makePR([]), makePR([]), makePR(["bug"])];
    const result = computeLabelTrends(prs);
    expect(result.total).toBe(3);
    expect(result.entries.length).toBe(1);
    expect(result.entries[0].label).toBe("bug");
  });
});

describe("formatLabelTrendsTable", () => {
  it("returns placeholder for empty result", () => {
    const result = computeLabelTrends([]);
    expect(formatLabelTrendsTable(result)).toContain("No label data");
  });

  it("includes header row", () => {
    const prs = [makePR(["bug"]), makePR(["feature"])];
    const table = formatLabelTrendsTable(computeLabelTrends(prs));
    expect(table).toContain("| Label |");
    expect(table).toContain("| PRs |");
    expect(table).toContain("| Share |");
  });

  it("renders label rows with backtick formatting", () => {
    const prs = [makePR(["bug"]), makePR(["bug"])];
    const table = formatLabelTrendsTable(computeLabelTrends(prs));
    expect(table).toContain("`bug`");
    expect(table).toContain("100%");
  });
});
