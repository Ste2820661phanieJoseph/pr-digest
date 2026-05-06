import {
  computeMergeFrequency,
  formatMergeFrequencySummary,
  appendMergeFrequencyToMarkdown,
} from "./prMergeFrequency";
import { EnrichedPR } from "./prEnricher";

function makePR(mergedAt: string | null): Partial<EnrichedPR> {
  return { mergedAt, closedAt: mergedAt ?? undefined } as Partial<EnrichedPR>;
}

describe("computeMergeFrequency", () => {
  it("returns empty stats for no PRs", () => {
    const stats = computeMergeFrequency([]);
    expect(stats.totalMerged).toBe(0);
    expect(stats.busiestDay).toBeNull();
    expect(stats.daysActive).toBe(0);
    expect(stats.avgPerDay).toBe(0);
  });

  it("counts PRs per day correctly", () => {
    const prs = [
      makePR("2024-03-11T10:00:00Z"),
      makePR("2024-03-11T14:00:00Z"),
      makePR("2024-03-12T09:00:00Z"),
    ] as EnrichedPR[];
    const stats = computeMergeFrequency(prs);
    expect(stats.totalMerged).toBe(3);
    expect(stats.perDay["2024-03-11"]).toBe(2);
    expect(stats.perDay["2024-03-12"]).toBe(1);
    expect(stats.daysActive).toBe(2);
  });

  it("identifies the busiest day", () => {
    const prs = [
      makePR("2024-03-11T10:00:00Z"),
      makePR("2024-03-11T11:00:00Z"),
      makePR("2024-03-11T12:00:00Z"),
      makePR("2024-03-12T09:00:00Z"),
    ] as EnrichedPR[];
    const stats = computeMergeFrequency(prs);
    expect(stats.busiestDay).toBe("2024-03-11");
    expect(stats.busiestDayCount).toBe(3);
  });

  it("computes average per active day", () => {
    const prs = [
      makePR("2024-03-11T10:00:00Z"),
      makePR("2024-03-12T10:00:00Z"),
      makePR("2024-03-13T10:00:00Z"),
    ] as EnrichedPR[];
    const stats = computeMergeFrequency(prs);
    expect(stats.avgPerDay).toBe(1);
  });

  it("skips PRs with no mergedAt or closedAt", () => {
    const prs = [makePR(null)] as EnrichedPR[];
    const stats = computeMergeFrequency(prs);
    expect(stats.daysActive).toBe(0);
    expect(stats.busiestDay).toBeNull();
  });
});

describe("formatMergeFrequencySummary", () => {
  it("returns empty string when no PRs", () => {
    const stats = computeMergeFrequency([]);
    expect(formatMergeFrequencySummary(stats)).toBe("");
  });

  it("includes all key metrics", () => {
    const prs = [
      makePR("2024-03-11T10:00:00Z"),
      makePR("2024-03-11T15:00:00Z"),
      makePR("2024-03-12T09:00:00Z"),
    ] as EnrichedPR[];
    const stats = computeMergeFrequency(prs);
    const output = formatMergeFrequencySummary(stats);
    expect(output).toContain("Merge Frequency");
    expect(output).toContain("Total merged: 3");
    expect(output).toContain("Busiest day: 2024-03-11");
  });
});

describe("appendMergeFrequencyToMarkdown", () => {
  it("appends section to existing markdown", () => {
    const prs = [makePR("2024-03-11T10:00:00Z")] as EnrichedPR[];
    const stats = computeMergeFrequency(prs);
    const result = appendMergeFrequencyToMarkdown("# Digest", stats);
    expect(result).toContain("# Digest");
    expect(result).toContain("Merge Frequency");
  });

  it("returns original markdown when no data", () => {
    const stats = computeMergeFrequency([]);
    const result = appendMergeFrequencyToMarkdown("# Digest", stats);
    expect(result).toBe("# Digest");
  });
});
