import { computePRStats, topContributors } from "./prStats";
import { PullRequest } from "./github";

function makePR(overrides: Partial<PullRequest> = {}): PullRequest {
  return {
    number: 1,
    title: "Test PR",
    html_url: "https://github.com/org/repo/pull/1",
    merged_at: "2024-01-15T10:00:00Z",
    user: { login: "alice" },
    labels: [{ name: "feature" }],
    body: null,
    draft: false,
    changed_files: 4,
    ...overrides,
  } as PullRequest;
}

describe("computePRStats", () => {
  it("returns zero stats for empty array", () => {
    const stats = computePRStats([]);
    expect(stats.total).toBe(0);
    expect(stats.dateRange).toBeNull();
    expect(stats.byAuthor).toEqual({});
  });

  it("counts total PRs", () => {
    const stats = computePRStats([makePR(), makePR({ number: 2 })]);
    expect(stats.total).toBe(2);
  });

  it("aggregates by author", () => {
    const prs = [
      makePR({ user: { login: "alice" } }),
      makePR({ user: { login: "alice" } }),
      makePR({ user: { login: "bob" } }),
    ];
    const stats = computePRStats(prs);
    expect(stats.byAuthor["alice"]).toBe(2);
    expect(stats.byAuthor["bob"]).toBe(1);
  });

  it("aggregates by label", () => {
    const prs = [
      makePR({ labels: [{ name: "feature" }, { name: "bug" }] }),
      makePR({ labels: [{ name: "feature" }] }),
    ];
    const stats = computePRStats(prs);
    expect(stats.byLabel["feature"]).toBe(2);
    expect(stats.byLabel["bug"]).toBe(1);
  });

  it("calculates totalChangedFiles and average", () => {
    const prs = [makePR({ changed_files: 2 }), makePR({ changed_files: 6 })];
    const stats = computePRStats(prs);
    expect(stats.totalChangedFiles).toBe(8);
    expect(stats.averageChangedFiles).toBe(4);
  });

  it("computes date range correctly", () => {
    const prs = [
      makePR({ merged_at: "2024-01-10T00:00:00Z" }),
      makePR({ merged_at: "2024-01-20T00:00:00Z" }),
      makePR({ merged_at: "2024-01-15T00:00:00Z" }),
    ];
    const stats = computePRStats(prs);
    expect(stats.dateRange?.earliest).toBe("2024-01-10T00:00:00Z");
    expect(stats.dateRange?.latest).toBe("2024-01-20T00:00:00Z");
  });
});

describe("topContributors", () => {
  it("returns top N contributors sorted by count", () => {
    const stats = computePRStats([
      makePR({ user: { login: "alice" } }),
      makePR({ user: { login: "alice" } }),
      makePR({ user: { login: "bob" } }),
      makePR({ user: { login: "carol" } }),
      makePR({ user: { login: "carol" } }),
      makePR({ user: { login: "carol" } }),
    ]);
    const top = topContributors(stats, 2);
    expect(top[0].login).toBe("carol");
    expect(top[0].count).toBe(3);
    expect(top).toHaveLength(2);
  });
});
