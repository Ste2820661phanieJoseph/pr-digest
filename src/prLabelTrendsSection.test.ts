import {
  buildLabelTrendsSection,
  appendLabelTrendsToMarkdown,
  getLabelTrendsStats,
} from "./prLabelTrendsSection";

function makePR(labels: string[]) {
  return { labels };
}

describe("getLabelTrendsStats", () => {
  it("delegates to computeLabelTrends", () => {
    const prs = [makePR(["bug"]), makePR(["bug"]), makePR(["feature"])];
    const stats = getLabelTrendsStats(prs);
    expect(stats.total).toBe(3);
    expect(stats.topLabel).toBe("bug");
  });
});

describe("buildLabelTrendsSection", () => {
  it("includes section heading", () => {
    const section = buildLabelTrendsSection([makePR(["bug"])]);
    expect(section).toContain("## 🏷️ Label Trends");
  });

  it("includes table content", () => {
    const section = buildLabelTrendsSection([makePR(["bug"]), makePR(["bug"])]);
    expect(section).toContain("`bug`");
    expect(section).toContain("100%");
  });

  it("respects maxRows option", () => {
    const prs = [
      makePR(["a"]),
      makePR(["a"]),
      makePR(["b"]),
      makePR(["c"]),
    ];
    const section = buildLabelTrendsSection(prs, { maxRows: 1 });
    expect(section).toContain("`a`");
    expect(section).not.toContain("`b`");
    expect(section).not.toContain("`c`");
  });

  it("shows placeholder when no PRs", () => {
    const section = buildLabelTrendsSection([]);
    expect(section).toContain("No label data");
  });

  it("shows all rows when maxRows is 0", () => {
    const prs = [makePR(["a"]), makePR(["b"]), makePR(["c"])];
    const section = buildLabelTrendsSection(prs, { maxRows: 0 });
    expect(section).toContain("`a`");
    expect(section).toContain("`b`");
    expect(section).toContain("`c`");
  });
});

describe("appendLabelTrendsToMarkdown", () => {
  it("appends section to existing markdown", () => {
    const base = "# Digest\n";
    const result = appendLabelTrendsToMarkdown(base, [makePR(["bug"])]);
    expect(result).toContain("# Digest");
    expect(result).toContain("## 🏷️ Label Trends");
  });

  it("separates existing content with newline", () => {
    const base = "existing";
    const result = appendLabelTrendsToMarkdown(base, []);
    expect(result.startsWith("existing\n")).toBe(true);
  });
});
