import {
  computeTimeToMergeStats,
  formatTimeToMergeSummary,
  appendTimeToMergeToMarkdown,
  hoursBetween,
  TimeToMergeInput,
} from "./prTimeToMerge";

function makePR(
  createdAt: string,
  mergedAt: string | null = null
): TimeToMergeInput {
  return { createdAt, mergedAt };
}

describe("hoursBetween", () => {
  it("returns correct hours between two timestamps", () => {
    expect(
      hoursBetween("2024-01-01T00:00:00Z", "2024-01-01T02:00:00Z")
    ).toBeCloseTo(2);
  });

  it("returns 24 for one day apart", () => {
    expect(
      hoursBetween("2024-01-01T00:00:00Z", "2024-01-02T00:00:00Z")
    ).toBe(24);
  });
});

describe("computeTimeToMergeStats", () => {
  it("returns null when no merged PRs", () => {
    expect(computeTimeToMergeStats([makePR("2024-01-01T00:00:00Z")])).toBeNull();
  });

  it("returns null for empty list", () => {
    expect(computeTimeToMergeStats([])).toBeNull();
  });

  it("computes stats for a single PR", () => {
    const stats = computeTimeToMergeStats([
      makePR("2024-01-01T00:00:00Z", "2024-01-02T00:00:00Z"),
    ]);
    expect(stats).not.toBeNull();
    expect(stats!.count).toBe(1);
    expect(stats!.avgHours).toBeCloseTo(24);
    expect(stats!.medianHours).toBeCloseTo(24);
    expect(stats!.minHours).toBeCloseTo(24);
    expect(stats!.maxHours).toBeCloseTo(24);
  });

  it("computes correct median for even-length arrays", () => {
    const prs = [
      makePR("2024-01-01T00:00:00Z", "2024-01-01T02:00:00Z"), // 2h
      makePR("2024-01-01T00:00:00Z", "2024-01-01T06:00:00Z"), // 6h
    ];
    const stats = computeTimeToMergeStats(prs);
    expect(stats!.medianHours).toBeCloseTo(4);
  });

  it("ignores PRs with null mergedAt", () => {
    const prs = [
      makePR("2024-01-01T00:00:00Z", "2024-01-02T00:00:00Z"),
      makePR("2024-01-01T00:00:00Z", null),
    ];
    const stats = computeTimeToMergeStats(prs);
    expect(stats!.count).toBe(1);
  });

  it("computes p75 and p90 correctly", () => {
    const base = "2024-01-01T00:00:00Z";
    const prs = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20].map((h) => {
      const merged = new Date(
        new Date(base).getTime() + h * 3_600_000
      ).toISOString();
      return makePR(base, merged);
    });
    const stats = computeTimeToMergeStats(prs);
    expect(stats!.p75Hours).toBeGreaterThan(stats!.medianHours);
    expect(stats!.p90Hours).toBeGreaterThanOrEqual(stats!.p75Hours);
  });
});

describe("formatTimeToMergeSummary", () => {
  it("includes expected headings and values", () => {
    const stats = computeTimeToMergeStats([
      makePR("2024-01-01T00:00:00Z", "2024-01-02T12:00:00Z"),
    ])!;
    const output = formatTimeToMergeSummary(stats);
    expect(output).toContain("⏱ Time to Merge");
    expect(output).toContain("Median");
    expect(output).toContain("p90");
  });
});

describe("appendTimeToMergeToMarkdown", () => {
  it("appends section to existing markdown", () => {
    const prs = [makePR("2024-01-01T00:00:00Z", "2024-01-02T00:00:00Z")];
    const result = appendTimeToMergeToMarkdown("# Digest", prs);
    expect(result).toContain("# Digest");
    expect(result).toContain("Time to Merge");
  });

  it("returns unchanged markdown when no merged PRs", () => {
    const result = appendTimeToMergeToMarkdown("# Digest", []);
    expect(result).toBe("# Digest");
  });
});
