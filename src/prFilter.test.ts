import { filterPRs, partitionBotPRs, PRFilterOptions } from "./prFilter";
import { PullRequest } from "./github";

function makePR(overrides: Partial<PullRequest> = {}): PullRequest {
  return {
    number: 1,
    title: "Test PR",
    html_url: "https://github.com/org/repo/pull/1",
    merged_at: "2024-01-15T10:00:00Z",
    user: { login: "alice" },
    labels: [],
    body: null,
    draft: false,
    changed_files: 3,
    ...overrides,
  } as PullRequest;
}

describe("filterPRs", () => {
  it("excludes draft PRs by default", () => {
    const prs = [makePR({ draft: true }), makePR({ draft: false })];
    expect(filterPRs(prs)).toHaveLength(1);
  });

  it("includes drafts when excludeDrafts is false", () => {
    const prs = [makePR({ draft: true }), makePR({ draft: false })];
    expect(filterPRs(prs, { excludeDrafts: false })).toHaveLength(2);
  });

  it("excludes bot PRs when excludeBots is true", () => {
    const prs = [
      makePR({ user: { login: "alice" } }),
      makePR({ user: { login: "dependabot[bot]" } }),
    ];
    expect(filterPRs(prs, { excludeBots: true })).toHaveLength(1);
  });

  it("filters by minChangedFiles", () => {
    const prs = [
      makePR({ changed_files: 1 }),
      makePR({ changed_files: 5 }),
    ];
    expect(filterPRs(prs, { minChangedFiles: 3 })).toHaveLength(1);
  });

  it("filters by requiredLabels", () => {
    const prs = [
      makePR({ labels: [{ name: "feature" }] }),
      makePR({ labels: [{ name: "chore" }] }),
      makePR({ labels: [] }),
    ];
    expect(filterPRs(prs, { requiredLabels: ["feature"] })).toHaveLength(1);
  });

  it("returns all PRs when no options are restrictive", () => {
    const prs = [makePR(), makePR({ number: 2 })];
    expect(filterPRs(prs, { excludeDrafts: false })).toHaveLength(2);
  });
});

describe("partitionBotPRs", () => {
  it("splits PRs into human and bot groups", () => {
    const prs = [
      makePR({ user: { login: "alice" } }),
      makePR({ user: { login: "renovate[bot]" } }),
      makePR({ user: { login: "bob" } }),
      makePR({ user: { login: "dependabot[bot]" } }),
    ];
    const { human, bot } = partitionBotPRs(prs);
    expect(human).toHaveLength(2);
    expect(bot).toHaveLength(2);
  });

  it("respects custom bot logins", () => {
    const prs = [
      makePR({ user: { login: "my-bot" } }),
      makePR({ user: { login: "alice" } }),
    ];
    const { bot } = partitionBotPRs(prs, ["my-bot"]);
    expect(bot).toHaveLength(1);
  });
});
