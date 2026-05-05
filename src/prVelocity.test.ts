import {
  computeMergeTime,
  computeVelocityStats,
  formatVelocitySummary,
  VelocityPR,
} from "./prVelocity";

function makePR(
  overrides: Partial<VelocityPR> & { mergeOffsetHours?: number } = {}
): VelocityPR {
  const { mergeOffsetHours = 4, ...rest } = overrides;
  const createdAt = "2024-05-01T10:00:00Z";
  const mergedAt = new Date(
    new Date(createdAt).getTime() + mergeOffsetHours * 3600 * 1000
  ).toISOString();
  return {
    number: 1,
    title: "Test PR",
    author: "alice",
    createdAt,
    mergedAt,
    ...rest,
  };
}

describe("computeMergeTime", () => {
  it("returns correct hours between creation and merge", () => {
    const pr = makePR({ mergeOffsetHours: 6 });
    expect(computeMergeTime(pr)).toBe(6);
  });

  it("returns 0 for same timestamp", () => {
    const pr = makePR({ mergeOffsetHours: 0 });
    expect(computeMergeTime(pr)).toBe(0);
  });
});

describe("computeVelocityStats", () => {
  it("returns null for empty array", () => {
    expect(computeVelocityStats([])).toBeNull();
  });

  it("computes stats for a single PR", () => {
    const pr = makePR({ number: 42, mergeOffsetHours: 8 });
    const stats = computeVelocityStats([pr])!;
    expect(stats.totalMerged).toBe(1);
    expect(stats.avgMergeTimeHours).toBe(8);
    expect(stats.medianMergeTimeHours).toBe(8);
    expect(stats.fastestPR.number).toBe(42);
    expect(stats.slowestPR.number).toBe(42);
  });

  it("computes correct average and median for multiple PRs", () => {
    const prs = [
      makePR({ number: 1, mergeOffsetHours: 2 }),
      makePR({ number: 2, mergeOffsetHours: 4 }),
      makePR({ number: 3, mergeOffsetHours: 12 }),
    ];
    const stats = computeVelocityStats(prs)!;
    expect(stats.avgMergeTimeHours).toBe(6);
    expect(stats.medianMergeTimeHours).toBe(4);
    expect(stats.fastestPR.number).toBe(1);
    expect(stats.slowestPR.number).toBe(3);
  });

  it("handles even-length arrays for median", () => {
    const prs = [
      makePR({ number: 1, mergeOffsetHours: 2 }),
      makePR({ number: 2, mergeOffsetHours: 6 }),
    ];
    const stats = computeVelocityStats(prs)!;
    expect(stats.medianMergeTimeHours).toBe(4);
  });
});

describe("formatVelocitySummary", () => {
  it("includes all key metrics in output", () => {
    const prs = [
      makePR({ number: 10, mergeOffsetHours: 1 }),
      makePR({ number: 20, mergeOffsetHours: 10 }),
    ];
    const stats = computeVelocityStats(prs)!;
    const output = formatVelocitySummary(stats);
    expect(output).toContain("⚡ Merge Velocity");
    expect(output).toContain("Total merged: 2");
    expect(output).toContain("Fastest");
    expect(output).toContain("Slowest");
    expect(output).toContain("#10");
    expect(output).toContain("#20");
  });
});
