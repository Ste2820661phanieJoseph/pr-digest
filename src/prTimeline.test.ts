import { buildTimeline, getDayLabel, getISOWeekLabel, peakEntry } from "./prTimeline";

function makePR(number: number, merged_at: string | null) {
  return { number, merged_at };
}

describe("getDayLabel", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(getDayLabel(new Date("2024-03-15T10:00:00Z"))).toBe("2024-03-15");
  });
});

describe("getISOWeekLabel", () => {
  it("returns correct ISO week for a known date", () => {
    // 2024-01-15 is in week 3 of 2024
    expect(getISOWeekLabel(new Date("2024-01-15"))).toBe("2024-W03");
  });

  it("handles year boundary correctly", () => {
    // 2024-12-30 is in week 1 of 2025
    expect(getISOWeekLabel(new Date("2024-12-30"))).toBe("2025-W01");
  });
});

describe("buildTimeline", () => {
  const prs = [
    makePR(1, "2024-03-11T10:00:00Z"),
    makePR(2, "2024-03-11T14:00:00Z"),
    makePR(3, "2024-03-12T09:00:00Z"),
    makePR(4, null),
    makePR(5, "2024-03-13T08:00:00Z"),
  ];

  it("groups by day and skips unmerged PRs", () => {
    const timeline = buildTimeline(prs, "day");
    expect(timeline).toHaveLength(3);
    expect(timeline[0].label).toBe("2024-03-11");
    expect(timeline[0].count).toBe(2);
    expect(timeline[0].prNumbers).toEqual([1, 2]);
    expect(timeline[1].label).toBe("2024-03-12");
    expect(timeline[1].count).toBe(1);
  });

  it("groups by week", () => {
    const timeline = buildTimeline(prs, "week");
    // All three dates fall in the same week (2024-W11)
    expect(timeline).toHaveLength(1);
    expect(timeline[0].count).toBe(3);
  });

  it("returns empty array for no merged PRs", () => {
    expect(buildTimeline([makePR(1, null)], "day")).toHaveLength(0);
  });

  it("sorts entries chronologically", () => {
    const labels = buildTimeline(prs, "day").map((e) => e.label);
    expect(labels).toEqual([...labels].sort());
  });
});

describe("peakEntry", () => {
  it("returns null for empty timeline", () => {
    expect(peakEntry([])).toBeNull();
  });

  it("returns the entry with the highest count", () => {
    const prs = [
      makePR(1, "2024-03-11T10:00:00Z"),
      makePR(2, "2024-03-11T14:00:00Z"),
      makePR(3, "2024-03-12T09:00:00Z"),
    ];
    const timeline = buildTimeline(prs, "day");
    const peak = peakEntry(timeline);
    expect(peak?.label).toBe("2024-03-11");
    expect(peak?.count).toBe(2);
  });
});
