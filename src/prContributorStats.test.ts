import {
  computeContributorStats,
  formatContributorTable,
} from "./prContributorStats";
import { EnrichedPR } from "./prEnricher";

function makePR(
  login: string,
  additions = 10,
  deletions = 5,
  labels: string[] = []
): EnrichedPR {
  return {
    number: Math.floor(Math.random() * 1000),
    title: "chore: test",
    html_url: "https://github.com/org/repo/pull/1",
    merged_at: "2024-01-15T10:00:00Z",
    user: { login },
    additions,
    deletions,
    labels: labels.map((name) => ({ name })),
    sizeLabel: "S",
    hasDescription: true,
    normalizedTitle: "chore: test",
  } as unknown as EnrichedPR;
}

describe("computeContributorStats", () => {
  it("returns empty result for no PRs", () => {
    const result = computeContributorStats([]);
    expect(result.totalAuthors).toBe(0);
    expect(result.contributors).toEqual([]);
    expect(result.mostActiveAuthor).toBeNull();
    expect(result.mostLinesAuthor).toBeNull();
  });

  it("aggregates PRs per contributor", () => {
    const prs = [
      makePR("alice", 20, 5),
      makePR("alice", 10, 2),
      makePR("bob", 50, 30),
    ];
    const result = computeContributorStats(prs);
    expect(result.totalAuthors).toBe(2);
    const alice = result.contributors.find((c) => c.login === "alice")!;
    expect(alice.prCount).toBe(2);
    expect(alice.additions).toBe(30);
    expect(alice.deletions).toBe(7);
    expect(alice.linesChanged).toBe(37);
  });

  it("sorts by prCount descending", () => {
    const prs = [makePR("bob"), makePR("alice"), makePR("alice")];
    const result = computeContributorStats(prs);
    expect(result.contributors[0].login).toBe("alice");
  });

  it("identifies mostActiveAuthor and mostLinesAuthor", () => {
    const prs = [
      makePR("alice", 5, 1),
      makePR("alice", 5, 1),
      makePR("bob", 200, 100),
    ];
    const result = computeContributorStats(prs);
    expect(result.mostActiveAuthor).toBe("alice");
    expect(result.mostLinesAuthor).toBe("bob");
  });

  it("deduplicates labels per contributor", () => {
    const prs = [makePR("alice", 1, 1, ["bug"]), makePR("alice", 1, 1, ["bug", "feat"])];
    const result = computeContributorStats(prs);
    expect(result.contributors[0].labels).toEqual(["bug", "feat"]);
  });
});

describe("formatContributorTable", () => {
  it("returns placeholder when no contributors", () => {
    const result = formatContributorTable({
      contributors: [],
      totalAuthors: 0,
      mostActiveAuthor: null,
      mostLinesAuthor: null,
    });
    expect(result).toBe("_No contributors this week._");
  });

  it("renders markdown table", () => {
    const prs = [makePR("alice", 20, 5), makePR("bob", 10, 3)];
    const stats = computeContributorStats(prs);
    const table = formatContributorTable(stats);
    expect(table).toContain("| Contributor | PRs | Lines |");
    expect(table).toContain("@alice");
    expect(table).toContain("+20 / -5");
  });
});
