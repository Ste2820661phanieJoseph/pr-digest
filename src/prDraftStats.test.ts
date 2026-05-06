import {
  computeDraftStats,
  formatDraftStatsSummary,
  appendDraftStatsToMarkdown,
  wasLikelyDraft,
  DraftStatsPR,
} from "./prDraftStats";

function makePR(overrides: Partial<DraftStatsPR> = {}): DraftStatsPR {
  return { draft: false, title: "Add feature", labels: [], ...overrides };
}

describe("wasLikelyDraft", () => {
  it("detects [Draft] prefix", () => {
    expect(wasLikelyDraft(makePR({ title: "[Draft] My PR" }))).toBe(true);
  });

  it("detects draft: prefix", () => {
    expect(wasLikelyDraft(makePR({ title: "draft: something" }))).toBe(true);
  });

  it("detects WIP: prefix", () => {
    expect(wasLikelyDraft(makePR({ title: "WIP: refactor" }))).toBe(true);
  });

  it("detects [WIP] prefix", () => {
    expect(wasLikelyDraft(makePR({ title: "[WIP] cleanup" }))).toBe(true);
  });

  it("returns false for normal titles", () => {
    expect(wasLikelyDraft(makePR({ title: "Fix bug in auth" }))).toBe(false);
  });
});

describe("computeDraftStats", () => {
  it("returns zeros for empty list", () => {
    const stats = computeDraftStats([]);
    expect(stats.total).toBe(0);
    expect(stats.draftRatio).toBe(0);
  });

  it("counts draft and ready correctly", () => {
    const prs = [
      makePR({ draft: true }),
      makePR({ draft: true }),
      makePR({ draft: false }),
    ];
    const stats = computeDraftStats(prs);
    expect(stats.total).toBe(3);
    expect(stats.drafts).toBe(2);
    expect(stats.ready).toBe(1);
    expect(stats.draftRatio).toBeCloseTo(2 / 3);
  });

  it("counts converted-from-draft PRs", () => {
    const prs = [
      makePR({ draft: false, title: "WIP: old work" }),
      makePR({ draft: false, title: "Normal PR" }),
    ];
    const stats = computeDraftStats(prs);
    expect(stats.convertedFromDraft).toBe(1);
  });

  it("does not count active drafts as converted", () => {
    const prs = [makePR({ draft: true, title: "[Draft] still open" })];
    const stats = computeDraftStats(prs);
    expect(stats.convertedFromDraft).toBe(0);
  });
});

describe("formatDraftStatsSummary", () => {
  it("returns empty string when total is 0", () => {
    expect(formatDraftStatsSummary({ total: 0, drafts: 0, ready: 0, draftRatio: 0, convertedFromDraft: 0 })).toBe("");
  });

  it("includes converted note when relevant", () => {
    const result = formatDraftStatsSummary({ total: 5, drafts: 1, ready: 4, draftRatio: 0.2, convertedFromDraft: 2 });
    expect(result).toContain("converted from draft");
  });

  it("omits converted note when zero", () => {
    const result = formatDraftStatsSummary({ total: 3, drafts: 1, ready: 2, draftRatio: 0.33, convertedFromDraft: 0 });
    expect(result).not.toContain("converted");
  });
});

describe("appendDraftStatsToMarkdown", () => {
  it("returns original markdown when no drafts", () => {
    const prs = [makePR({ draft: false }), makePR({ draft: false })];
    const md = "# Digest";
    expect(appendDraftStatsToMarkdown(md, prs)).toBe(md);
  });

  it("appends section when drafts present", () => {
    const prs = [makePR({ draft: true }), makePR({ draft: false })];
    const result = appendDraftStatsToMarkdown("# Digest", prs);
    expect(result).toContain("Draft vs Ready PRs");
    expect(result.startsWith("# Digest")).toBe(true);
  });
});
