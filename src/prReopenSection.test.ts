import { describe, it, expect } from "vitest";
import {
  toReopenInput,
  getReopenStats,
  buildReopenSection,
  appendReopenSection,
  ReopenSectionPR,
} from "./prReopenSection";

function makePR(
  number: number,
  events: string[] = []
): ReopenSectionPR {
  return {
    number,
    title: `PR ${number}`,
    author: "dev",
    url: `https://github.com/org/repo/pull/${number}`,
    timelineEvents: events.map((event) => ({ event })),
  };
}

describe("toReopenInput", () => {
  it("maps PR fields correctly", () => {
    const pr = makePR(10, ["reopened"]);
    const input = toReopenInput(pr);
    expect(input.number).toBe(10);
    expect(input.timelineEvents).toHaveLength(1);
    expect(input.timelineEvents![0].event).toBe("reopened");
  });

  it("defaults timelineEvents to empty array", () => {
    const pr: ReopenSectionPR = {
      number: 1,
      title: "T",
      author: "a",
      url: "u",
    };
    const input = toReopenInput(pr);
    expect(input.timelineEvents).toEqual([]);
  });
});

describe("getReopenStats", () => {
  it("aggregates stats across multiple PRs", () => {
    const prs = [
      makePR(1, ["reopened"]),
      makePR(2, []),
      makePR(3, ["reopened", "reopened"]),
    ];
    const stats = getReopenStats(prs);
    expect(stats.totalReopened).toBe(2);
    expect(stats.topReopened[0].number).toBe(3);
  });
});

describe("buildReopenSection", () => {
  it("returns placeholder for no reopened PRs", () => {
    const result = buildReopenSection([makePR(1), makePR(2)]);
    expect(result).toContain("No PRs were reopened");
  });

  it("returns formatted table when PRs were reopened", () => {
    const result = buildReopenSection([
      makePR(1, ["reopened"]),
      makePR(2, []),
    ]);
    expect(result).toContain("#1");
    expect(result).toContain("1 time");
  });
});

describe("appendReopenSection", () => {
  it("appends reopen section to markdown", () => {
    const prs = [makePR(5, ["reopened", "reopened"])];
    const result = appendReopenSection("# Weekly Digest", prs);
    expect(result).toContain("## 🔄 Reopened PRs");
    expect(result).toContain("2 times");
  });

  it("does not modify markdown when no reopened PRs", () => {
    const base = "# Weekly Digest";
    const result = appendReopenSection(base, [makePR(1)]);
    expect(result).toBe(base);
  });
});
