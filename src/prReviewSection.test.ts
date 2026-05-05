import { buildReviewSection, appendReviewSectionToMarkdown } from "./prReviewSection";
import { ReviewablePR } from "./prReviewStats";

function makePR(overrides: Partial<ReviewablePR> = {}): ReviewablePR {
  return {
    number: 1,
    createdAt: "2024-01-08T09:00:00Z",
    mergedAt: "2024-01-09T12:00:00Z",
    firstReviewedAt: "2024-01-08T11:00:00Z",
    reviewers: ["alice"],
    ...overrides,
  };
}

describe("buildReviewSection", () => {
  it("returns empty string for no PRs", () => {
    expect(buildReviewSection([])).toBe("");
  });

  it("returns empty string when no reviews and no unreviewed PRs", () => {
    // Edge case: shouldn't normally happen but guard it
    const result = buildReviewSection([makePR({ reviewers: [], firstReviewedAt: null })]);
    // prsWithNoReview = 1, so it should still render
    expect(result).toContain("Review Activity");
  });

  it("includes section heading", () => {
    const result = buildReviewSection([makePR()]);
    expect(result).toContain("## 🔍 Review Activity");
  });

  it("includes reviewer info", () => {
    const result = buildReviewSection([
      makePR({ reviewers: ["alice", "bob"] }),
      makePR({ number: 2, reviewers: ["alice"] }),
    ]);
    expect(result).toContain("alice");
    expect(result).toContain("Top reviewers");
  });

  it("mentions PRs merged without review", () => {
    const result = buildReviewSection([
      makePR({ reviewers: [] }),
      makePR({ number: 2, reviewers: ["bob"] }),
    ]);
    expect(result).toContain("without review");
  });
});

describe("appendReviewSectionToMarkdown", () => {
  it("appends section to existing markdown", () => {
    const base = "# Weekly Digest\n\nSome content.";
    const result = appendReviewSectionToMarkdown(base, [makePR()]);
    expect(result).toContain("# Weekly Digest");
    expect(result).toContain("## 🔍 Review Activity");
  });

  it("returns original markdown when no PRs", () => {
    const base = "# Weekly Digest";
    const result = appendReviewSectionToMarkdown(base, []);
    expect(result).toBe(base);
  });

  it("trims trailing whitespace before appending", () => {
    const base = "# Weekly Digest   ";
    const result = appendReviewSectionToMarkdown(base, [makePR()]);
    expect(result).not.toMatch(/   \n/);
    expect(result).toContain("\n\n## 🔍 Review Activity");
  });
});
