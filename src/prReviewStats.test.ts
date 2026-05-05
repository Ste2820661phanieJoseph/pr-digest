import { computeReviewStats, formatReviewSummary, ReviewablePR } from "./prReviewStats";

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

describe("computeReviewStats", () => {
  it("returns zero stats for empty input", () => {
    const stats = computeReviewStats([]);
    expect(stats.totalReviews).toBe(0);
    expect(stats.avgReviewsPerPR).toBe(0);
    expect(stats.avgTimeToFirstReviewHours).toBeNull();
    expect(stats.mostActiveReviewers).toEqual([]);
    expect(stats.prsWithNoReview).toBe(0);
  });

  it("counts total reviews correctly", () => {
    const prs = [
      makePR({ reviewers: ["alice", "bob"] }),
      makePR({ number: 2, reviewers: ["alice"] }),
    ];
    const stats = computeReviewStats(prs);
    expect(stats.totalReviews).toBe(3);
  });

  it("computes avgReviewsPerPR", () => {
    const prs = [
      makePR({ reviewers: ["alice", "bob", "carol"] }),
      makePR({ number: 2, reviewers: ["alice"] }),
    ];
    const stats = computeReviewStats(prs);
    expect(stats.avgReviewsPerPR).toBe(2);
  });

  it("counts prsWithNoReview", () => {
    const prs = [
      makePR({ reviewers: [] }),
      makePR({ number: 2, reviewers: ["bob"] }),
      makePR({ number: 3, reviewers: [] }),
    ];
    const stats = computeReviewStats(prs);
    expect(stats.prsWithNoReview).toBe(2);
  });

  it("computes avgTimeToFirstReviewHours", () => {
    const prs = [
      makePR({ createdAt: "2024-01-08T09:00:00Z", firstReviewedAt: "2024-01-08T11:00:00Z" }),
      makePR({ number: 2, createdAt: "2024-01-08T09:00:00Z", firstReviewedAt: "2024-01-08T13:00:00Z" }),
    ];
    const stats = computeReviewStats(prs);
    expect(stats.avgTimeToFirstReviewHours).toBe(3);
  });

  it("returns null avgTimeToFirstReview when no reviews", () => {
    const prs = [makePR({ firstReviewedAt: null, reviewers: [] })];
    const stats = computeReviewStats(prs);
    expect(stats.avgTimeToFirstReviewHours).toBeNull();
  });

  it("returns top 5 reviewers sorted by count", () => {
    const prs = [
      makePR({ reviewers: ["alice", "bob"] }),
      makePR({ number: 2, reviewers: ["alice", "carol"] }),
      makePR({ number: 3, reviewers: ["alice"] }),
    ];
    const stats = computeReviewStats(prs);
    expect(stats.mostActiveReviewers[0]).toEqual({ login: "alice", count: 3 });
    expect(stats.mostActiveReviewers[1].login).toBe("bob");
  });
});

describe("formatReviewSummary", () => {
  it("includes review totals", () => {
    const stats = computeReviewStats([makePR({ reviewers: ["alice"] })]);
    const output = formatReviewSummary(stats);
    expect(output).toContain("Reviews:");
    expect(output).toContain("alice");
  });

  it("skips unreviewed line when zero", () => {
    const stats = computeReviewStats([makePR({ reviewers: ["alice"] })]);
    const output = formatReviewSummary(stats);
    expect(output).not.toContain("without review");
  });
});
