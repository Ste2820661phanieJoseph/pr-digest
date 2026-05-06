import { describe, it, expect } from "vitest";
import {
  computeCycleTimeStats,
  formatCycleTimeSummary,
  appendCycleTimeToMarkdown,
  CycleTimeInput,
} from "./prCycleTime";

function makePR(overrides: Partial<CycleTimeInput> = {}): CycleTimeInput {
  return {
    number: 1,
    title: "feat: something",
    author: "alice",
    createdAt: "2024-01-01T08:00:00Z",
    mergedAt: "2024-01-02T08:00:00Z", // 24h
    firstReviewAt: "2024-01-01T16:00:00Z", // 8h after open
    ...overrides,
  };
}

describe("computeCycleTimeStats", () => {
  it("returns empty stats when no PRs are merged", () => {
    const stats = computeCycleTimeStats([makePR({ mergedAt: null })]);
    expect(stats.entries).toHaveLength(0);
    expect(stats.longestCycle).toBeNull();
    expect(stats.avgTotalHours).toBe(0);
  });

  it("computes correct total, pre-review and review hours", () => {
    const stats = computeCycleTimeStats([makePR()]);
    expect(stats.entries).toHaveLength(1);
    const e = stats.entries[0];
    expect(e.totalHours).toBeCloseTo(24);
    expect(e.preReviewHours).toBeCloseTo(8);
    expect(e.reviewHours).toBeCloseTo(16);
  });

  it("handles PRs without review data", () => {
    const stats = computeCycleTimeStats([makePR({ firstReviewAt: null })]);
    const e = stats.entries[0];
    expect(e.preReviewHours).toBeNull();
    expect(e.reviewHours).toBeNull();
    expect(stats.avgPreReviewHours).toBeNull();
    expect(stats.avgReviewHours).toBeNull();
  });

  it("computes avg and median correctly for multiple PRs", () => {
    const prs = [
      makePR({ number: 1, mergedAt: "2024-01-01T10:00:00Z", firstReviewAt: null }), // 2h
      makePR({ number: 2, mergedAt: "2024-01-01T12:00:00Z", firstReviewAt: null }), // 4h
      makePR({ number: 3, mergedAt: "2024-01-01T14:00:00Z", firstReviewAt: null }), // 6h
    ];
    const stats = computeCycleTimeStats(prs);
    expect(stats.avgTotalHours).toBeCloseTo(4);
    expect(stats.medianTotalHours).toBeCloseTo(4);
  });

  it("identifies the longest cycle", () => {
    const prs = [
      makePR({ number: 1, mergedAt: "2024-01-01T10:00:00Z", firstReviewAt: null }),
      makePR({ number: 2, mergedAt: "2024-01-03T08:00:00Z", firstReviewAt: null }), // 48h
    ];
    const stats = computeCycleTimeStats(prs);
    expect(stats.longestCycle?.number).toBe(2);
  });
});

describe("formatCycleTimeSummary", () => {
  it("returns empty string when no entries", () => {
    const stats = computeCycleTimeStats([]);
    expect(formatCycleTimeSummary(stats)).toBe("");
  });

  it("includes cycle time heading and avg/median", () => {
    const stats = computeCycleTimeStats([makePR()]);
    const output = formatCycleTimeSummary(stats);
    expect(output).toContain("⏱️ Cycle Time");
    expect(output).toContain("Avg cycle time");
    expect(output).toContain("Median cycle time");
  });

  it("includes pre-review and review lines when data available", () => {
    const stats = computeCycleTimeStats([makePR()]);
    const output = formatCycleTimeSummary(stats);
    expect(output).toContain("pre-review wait");
    expect(output).toContain("review duration");
  });

  it("formats hours as days when >= 24h", () => {
    const stats = computeCycleTimeStats([makePR()]);
    const output = formatCycleTimeSummary(stats);
    expect(output).toContain("1.0d");
  });
});

describe("appendCycleTimeToMarkdown", () => {
  it("appends section to existing markdown", () => {
    const stats = computeCycleTimeStats([makePR()]);
    const result = appendCycleTimeToMarkdown("# Digest", stats);
    expect(result).toContain("# Digest");
    expect(result).toContain("Cycle Time");
  });

  it("returns original markdown when no entries", () => {
    const stats = computeCycleTimeStats([]);
    const result = appendCycleTimeToMarkdown("# Digest", stats);
    expect(result).toBe("# Digest");
  });
});
