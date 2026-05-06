import {
  computeAgeStats,
  formatAgeStatsSummary,
  appendAgeStatsToMarkdown,
  AgeStatsInput,
} from "./prAgeStats";

function makePR(
  createdHoursAgo: number,
  mergedHoursAgo: number | null
): AgeStatsInput {
  const now = new Date("2024-06-10T12:00:00Z").getTime();
  const created = new Date(now - createdHoursAgo * 3_600_000).toISOString();
  const merged =
    mergedHoursAgo != null
      ? new Date(now - mergedHoursAgo * 3_600_000).toISOString()
      : null;
  return { created_at: created, merged_at: merged };
}

describe("computeAgeStats", () => {
  it("returns zeroes for empty input", () => {
    const stats = computeAgeStats([]);
    expect(stats.totalMerged).toBe(0);
    expect(stats.avgAgeHours).toBe(0);
    expect(stats.medianAgeHours).toBe(0);
  });

  it("ignores unmerged PRs", () => {
    const stats = computeAgeStats([makePR(48, null)]);
    expect(stats.totalMerged).toBe(0);
  });

  it("computes age correctly for a single PR", () => {
    // created 10h before merge
    const pr = makePR(12, 2); // age = 10h
    const stats = computeAgeStats([pr]);
    expect(stats.totalMerged).toBe(1);
    expect(stats.avgAgeHours).toBeCloseTo(10, 1);
    expect(stats.medianAgeHours).toBeCloseTo(10, 1);
  });

  it("buckets PRs correctly", () => {
    const prs = [
      makePR(1, 0.5),   // age 0.5h → < 1 hour
      makePR(5, 2),     // age 3h   → 1–4 hours
      makePR(30, 5),    // age 25h  → 1–3 days
      makePR(200, 10),  // age 190h → > 7 days
    ];
    const stats = computeAgeStats(prs);
    expect(stats.totalMerged).toBe(4);
    const bucketMap = Object.fromEntries(
      stats.buckets.map((b) => [b.label, b.count])
    );
    expect(bucketMap["< 1 hour"]).toBe(1);
    expect(bucketMap["1–4 hours"]).toBe(1);
    expect(bucketMap["1–3 days"]).toBe(1);
    expect(bucketMap["> 7 days"]).toBe(1);
  });

  it("computes median for even-length array", () => {
    const prs = [
      makePR(10, 8),  // age 2h
      makePR(10, 6),  // age 4h
    ];
    const stats = computeAgeStats(prs);
    expect(stats.medianAgeHours).toBeCloseTo(3, 1);
  });
});

describe("formatAgeStatsSummary", () => {
  it("returns placeholder for no data", () => {
    expect(formatAgeStatsSummary(computeAgeStats([]))).toContain("No merged");
  });

  it("includes avg and median in output", () => {
    const stats = computeAgeStats([makePR(12, 2)]);
    const out = formatAgeStatsSummary(stats);
    expect(out).toContain("Avg age");
    expect(out).toContain("Median");
    expect(out).toContain("10.0h");
  });

  it("formats days when age >= 24h", () => {
    const stats = computeAgeStats([makePR(72, 0)]);
    const out = formatAgeStatsSummary(stats);
    expect(out).toContain("3.0d");
  });
});

describe("appendAgeStatsToMarkdown", () => {
  it("appends section to existing markdown", () => {
    const stats = computeAgeStats([makePR(12, 2)]);
    const result = appendAgeStatsToMarkdown("# Digest", stats);
    expect(result).toContain("# Digest");
    expect(result).toContain("## PR Age at Merge");
  });
});
