import {
  computeHotspotStats,
  formatHotspotSection,
  appendHotspotToMarkdown,
  HotspotPR,
} from "./prHotspot";

function makePR(
  number: number,
  labels: string[],
  author = "dev"
): HotspotPR {
  return { number, title: `PR ${number}`, labels, author };
}

describe("computeHotspotStats", () => {
  it("returns empty stats for no PRs", () => {
    const stats = computeHotspotStats([]);
    expect(stats.entries).toHaveLength(0);
    expect(stats.totalPRs).toBe(0);
    expect(stats.topLabel).toBeNull();
  });

  it("groups PRs by label and counts correctly", () => {
    const prs = [
      makePR(1, ["bug"], "alice"),
      makePR(2, ["bug"], "bob"),
      makePR(3, ["feature"], "alice"),
    ];
    const stats = computeHotspotStats(prs);
    expect(stats.totalPRs).toBe(3);
    expect(stats.entries[0].label).toBe("bug");
    expect(stats.entries[0].count).toBe(2);
    expect(stats.topLabel).toBe("bug");
  });

  it("falls back to 'unlabeled' when no labels", () => {
    const prs = [makePR(1, []), makePR(2, [])];
    const stats = computeHotspotStats(prs);
    expect(stats.entries[0].label).toBe("unlabeled");
    expect(stats.entries[0].count).toBe(2);
  });

  it("collects unique authors per label", () => {
    const prs = [
      makePR(1, ["bug"], "alice"),
      makePR(2, ["bug"], "alice"),
      makePR(3, ["bug"], "bob"),
    ];
    const stats = computeHotspotStats(prs);
    expect(stats.entries[0].authors).toEqual(["alice", "bob"]);
  });

  it("sorts entries by count descending", () => {
    const prs = [
      makePR(1, ["chore"]),
      makePR(2, ["feature"]),
      makePR(3, ["feature"]),
    ];
    const stats = computeHotspotStats(prs);
    expect(stats.entries.map((e) => e.label)).toEqual(["feature", "chore"]);
  });
});

describe("formatHotspotSection", () => {
  it("returns empty string when no entries", () => {
    expect(formatHotspotSection({ entries: [], totalPRs: 0, topLabel: null })).toBe("");
  });

  it("includes header and table rows", () => {
    const stats = computeHotspotStats([
      makePR(1, ["bug"], "alice"),
      makePR(2, ["bug"], "bob"),
    ]);
    const output = formatHotspotSection(stats);
    expect(output).toContain("## 🔥 Hotspot Labels");
    expect(output).toContain("`bug`");
    expect(output).toContain("| Label | PRs | Top Authors |");
  });
});

describe("appendHotspotToMarkdown", () => {
  it("appends section to existing markdown", () => {
    const stats = computeHotspotStats([makePR(1, ["bug"])]);
    const result = appendHotspotToMarkdown("# Digest", stats);
    expect(result).toContain("# Digest");
    expect(result).toContain("## 🔥 Hotspot Labels");
  });

  it("returns original markdown when no entries", () => {
    const result = appendHotspotToMarkdown("# Digest", {
      entries: [],
      totalPRs: 0,
      topLabel: null,
    });
    expect(result).toBe("# Digest");
  });
});
