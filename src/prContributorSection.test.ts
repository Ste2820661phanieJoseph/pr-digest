import {
  buildContributorSection,
  appendContributorSectionToMarkdown,
} from "./prContributorSection";
import { EnrichedPR } from "./prEnricher";

function makePR(
  login: string,
  additions = 10,
  deletions = 5
): EnrichedPR {
  return {
    number: Math.floor(Math.random() * 9000 + 1000),
    title: "fix: something",
    html_url: "https://github.com/org/repo/pull/42",
    merged_at: "2024-01-15T12:00:00Z",
    user: { login },
    additions,
    deletions,
    labels: [],
    sizeLabel: "M",
    hasDescription: false,
    normalizedTitle: "fix: something",
  } as unknown as EnrichedPR;
}

describe("buildContributorSection", () => {
  it("includes section header", () => {
    const section = buildContributorSection([makePR("alice")]);
    expect(section).toContain("## 👥 Contributors");
  });

  it("shows summary line by default", () => {
    const section = buildContributorSection([
      makePR("alice"),
      makePR("bob"),
    ]);
    expect(section).toContain("2 contributors merged 2 PRs this week.");
    expect(section).toContain("Most active:");
  });

  it("hides summary line when disabled", () => {
    const section = buildContributorSection([makePR("alice")], {
      showSummaryLine: false,
    });
    expect(section).not.toContain("contributor");
    expect(section).toContain("@alice");
  });

  it("limits contributors to maxContributors", () => {
    const prs = ["a", "b", "c", "d"].map((l) => makePR(l));
    const section = buildContributorSection(prs, { maxContributors: 2 });
    const matches = section.match(/@[a-z]/g) ?? [];
    expect(matches.length).toBe(2);
  });

  it("handles empty PR list gracefully", () => {
    const section = buildContributorSection([]);
    expect(section).toContain("_No contributors this week._");
    expect(section).not.toContain("Most active");
  });

  it("uses singular form for 1 contributor and 1 PR", () => {
    const section = buildContributorSection([makePR("alice")]);
    expect(section).toContain("1 contributor merged 1 PR this week.");
  });
});

describe("appendContributorSectionToMarkdown", () => {
  it("appends section to existing markdown", () => {
    const base = "# Digest\n\nSome content.";
    const result = appendContributorSectionToMarkdown(base, [makePR("alice")]);
    expect(result.startsWith(base)).toBe(true);
    expect(result).toContain("## 👥 Contributors");
    expect(result).toContain("@alice");
  });

  it("separates base and section with double newline", () => {
    const base = "# Digest";
    const result = appendContributorSectionToMarkdown(base, [makePR("bob")]);
    expect(result).toContain("\n\n## 👥 Contributors");
  });
});
