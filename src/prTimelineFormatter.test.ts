import { formatTimelineChart, formatTimelineSummary } from "./prTimelineFormatter";
import { TimelineEntry } from "./prTimeline";

function makeEntry(label: string, count: number, prNumbers: number[] = []): TimelineEntry {
  return { label, date: new Date(label), count, prNumbers };
}

describe("formatTimelineChart", () => {
  it("returns placeholder for empty entries", () => {
    expect(formatTimelineChart([])).toBe("_No merged PRs in this period._");
  });

  it("wraps output in a fenced code block", () => {
    const entries = [makeEntry("2024-03-11", 3)];
    const result = formatTimelineChart(entries);
    expect(result.startsWith("```")).toBe(true);
    expect(result.endsWith("```")).toBe(true);
  });

  it("renders the peak bar at full width", () => {
    const entries = [makeEntry("2024-03-11", 5), makeEntry("2024-03-12", 2)];
    const lines = formatTimelineChart(entries).split("\n");
    // line index 1 is the first data line (after opening ```)
    expect(lines[1]).toContain("█".repeat(20));
  });

  it("renders a proportional bar for smaller counts", () => {
    const entries = [makeEntry("2024-03-11", 4), makeEntry("2024-03-12", 2)];
    const lines = formatTimelineChart(entries).split("\n");
    // second entry should have half the bar width = 10 chars
    expect(lines[2]).toContain("█".repeat(10));
  });

  it("includes count at end of each line", () => {
    const entries = [makeEntry("2024-03-11", 7)];
    const chart = formatTimelineChart(entries);
    expect(chart).toContain("  7");
  });
});

describe("formatTimelineSummary", () => {
  it("returns empty string for empty entries", () => {
    expect(formatTimelineSummary([])).toBe("");
  });

  it("includes active day count and peak label", () => {
    const entries = [
      makeEntry("2024-03-11", 5),
      makeEntry("2024-03-12", 2),
      makeEntry("2024-03-13", 3),
    ];
    const summary = formatTimelineSummary(entries);
    expect(summary).toContain("3 active days");
    expect(summary).toContain("2024-03-11");
    expect(summary).toContain("5 PRs");
    expect(summary).toContain("10 total");
  });

  it("uses singular form for 1 PR", () => {
    const entries = [makeEntry("2024-03-11", 1)];
    const summary = formatTimelineSummary(entries);
    expect(summary).toContain("1 PR");
    expect(summary).not.toContain("1 PRs");
  });

  it("uses singular bucket label for single entry", () => {
    const entries = [makeEntry("2024-W11", 3)];
    const summary = formatTimelineSummary(entries, "week");
    expect(summary).toContain("1 active week");
  });
});
