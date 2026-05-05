import {
  computeSizeDistribution,
  formatSizeBar,
  formatSizeDistributionTable,
  appendSizeDistributionToMarkdown,
  PRWithSize,
} from "./prSizeDistribution";

function makePR(sizeLabel?: string): PRWithSize {
  return { sizeLabel };
}

describe("computeSizeDistribution", () => {
  it("counts each size label correctly", () => {
    const prs = [
      makePR("xs"), makePR("xs"),
      makePR("s"),
      makePR("m"), makePR("m"), makePR("m"),
      makePR("l"),
      makePR("xl"),
    ];
    const dist = computeSizeDistribution(prs);
    expect(dist.xs).toBe(2);
    expect(dist.s).toBe(1);
    expect(dist.m).toBe(3);
    expect(dist.l).toBe(1);
    expect(dist.xl).toBe(1);
    expect(dist.total).toBe(8);
  });

  it("ignores unknown or missing size labels", () => {
    const prs = [makePR(undefined), makePR("unknown"), makePR("s")];
    const dist = computeSizeDistribution(prs);
    expect(dist.s).toBe(1);
    expect(dist.total).toBe(3);
  });

  it("returns zeros for empty list", () => {
    const dist = computeSizeDistribution([]);
    expect(dist.total).toBe(0);
    expect(dist.xs).toBe(0);
  });
});

describe("formatSizeBar", () => {
  it("returns full bar when count equals total", () => {
    expect(formatSizeBar(10, 10, 10)).toBe("██████████");
  });

  it("returns empty bar when count is 0", () => {
    expect(formatSizeBar(0, 10, 10)).toBe("░░░░░░░░░░");
  });

  it("returns all empty when total is 0", () => {
    expect(formatSizeBar(0, 0, 8)).toBe("░░░░░░░░");
  });

  it("returns partial bar", () => {
    const bar = formatSizeBar(5, 10, 10);
    expect(bar).toBe("█████░░░░░");
  });
});

describe("formatSizeDistributionTable", () => {
  it("returns placeholder for empty distribution", () => {
    const dist = computeSizeDistribution([]);
    expect(formatSizeDistributionTable(dist)).toBe("_No PRs to display._");
  });

  it("includes all size rows and total", () => {
    const prs = [makePR("xs"), makePR("m"), makePR("xl")];
    const dist = computeSizeDistribution(prs);
    const table = formatSizeDistributionTable(dist);
    expect(table).toContain("XS");
    expect(table).toContain("M");
    expect(table).toContain("XL");
    expect(table).toContain("Total");
    expect(table).toContain("**3**");
  });
});

describe("appendSizeDistributionToMarkdown", () => {
  it("appends section to existing markdown", () => {
    const base = "## Digest";
    const result = appendSizeDistributionToMarkdown(base, [makePR("s")]);
    expect(result.startsWith("## Digest")).toBe(true);
    expect(result).toContain("PR Size Distribution");
  });
});
