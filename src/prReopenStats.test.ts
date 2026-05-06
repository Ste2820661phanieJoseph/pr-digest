import { describe, it, expect } from "vitest";
import {
  computeReopenStats,
  formatReopenStatsSummary,
  appendReopenStatsToMarkdown,
  ReopenInput,
} from "./prReopenStats";

function makePR(
  overrides: Partial<ReopenInput> & { number: number }
): ReopenInput {
  return {
    title: `PR ${overrides.number}`,
    author: "dev",
    url: `https://github.com/org/repo/pull/${overrides.number}`,
    timelineEvents: [],
    ...overrides,
  };
}

describe("computeReopenStats", () => {
  it("returns zeros when no PRs are reopened", () => {
    const prs = [makePR({ number: 1 }), makePR({ number: 2 })];
    const stats = computeReopenStats(prs);
    expect(stats.totalReopened).toBe(0);
    expect(stats.reopenRate).toBe(0);
    expect(stats.topReopened).toHaveLength(0);
  });

  it("counts reopened events correctly", () => {
    const prs = [
      makePR({ number: 1, timelineEvents: [{ event: "reopened" }] }),
      makePR({ number: 2, timelineEvents: [{ event: "closed" }] }),
      makePR({
        number: 3,
        timelineEvents: [{ event: "reopened" }, { event: "reopened" }],
      }),
    ];
    const stats = computeReopenStats(prs);
    expect(stats.totalReopened).toBe(2);
    expect(stats.reopenRate).toBeCloseTo(66.67, 1);
  });

  it("sorts topReopened by reopenCount descending", () => {
    const prs = [
      makePR({ number: 1, timelineEvents: [{ event: "reopened" }] }),
      makePR({
        number: 2,
        timelineEvents: [
          { event: "reopened" },
          { event: "reopened" },
          { event: "reopened" },
        ],
      }),
    ];
    const stats = computeReopenStats(prs);
    expect(stats.topReopened[0].number).toBe(2);
    expect(stats.topReopened[0].reopenCount).toBe(3);
  });

  it("limits topReopened to topN", () => {
    const prs = Array.from({ length: 10 }, (_, i) =>
      makePR({ number: i + 1, timelineEvents: [{ event: "reopened" }] })
    );
    const stats = computeReopenStats(prs, 3);
    expect(stats.topReopened).toHaveLength(3);
  });

  it("handles empty PR list", () => {
    const stats = computeReopenStats([]);
    expect(stats.totalReopened).toBe(0);
    expect(stats.reopenRate).toBe(0);
  });
});

describe("formatReopenStatsSummary", () => {
  it("returns placeholder when no reopened PRs", () => {
    const result = formatReopenStatsSummary({
      totalReopened: 0,
      reopenRate: 0,
      topReopened: [],
    });
    expect(result).toContain("No PRs were reopened");
  });

  it("includes reopen rate and table", () => {
    const result = formatReopenStatsSummary({
      totalReopened: 2,
      reopenRate: 25,
      topReopened: [
        { number: 42, title: "Fix bug", author: "alice", reopenCount: 2, url: "https://example.com/42" },
      ],
    });
    expect(result).toContain("25.0%");
    expect(result).toContain("#42");
    expect(result).toContain("@alice");
    expect(result).toContain("2 times");
  });
});

describe("appendReopenStatsToMarkdown", () => {
  it("appends section when there are reopened PRs", () => {
    const result = appendReopenStatsToMarkdown("# Digest", {
      totalReopened: 1,
      reopenRate: 10,
      topReopened: [
        { number: 1, title: "Oops", author: "bob", reopenCount: 1, url: "https://example.com/1" },
      ],
    });
    expect(result).toContain("## 🔄 Reopened PRs");
  });

  it("returns unchanged markdown when no reopened PRs", () => {
    const original = "# Digest";
    const result = appendReopenStatsToMarkdown(original, {
      totalReopened: 0,
      reopenRate: 0,
      topReopened: [],
    });
    expect(result).toBe(original);
  });
});
