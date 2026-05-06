import {
  toHotspotInput,
  getHotspotStats,
  buildHotspotSection,
  appendHotspotSection,
  EnrichedPRForHotspot,
} from "./prHotspotSection";

function makePR(
  number: number,
  labels: string[],
  author = "dev"
): EnrichedPRForHotspot {
  return { number, title: `PR ${number}`, labels, author };
}

describe("toHotspotInput", () => {
  it("maps enriched PRs to hotspot shape", () => {
    const result = toHotspotInput([makePR(42, ["bug"], "alice")]);
    expect(result).toEqual([
      { number: 42, title: "PR 42", labels: ["bug"], author: "alice" },
    ]);
  });

  it("handles empty array", () => {
    expect(toHotspotInput([])).toEqual([]);
  });
});

describe("getHotspotStats", () => {
  it("returns stats with correct top label", () => {
    const prs = [
      makePR(1, ["feature"], "alice"),
      makePR(2, ["feature"], "bob"),
      makePR(3, ["bug"], "carol"),
    ];
    const stats = getHotspotStats(prs);
    expect(stats.topLabel).toBe("feature");
    expect(stats.totalPRs).toBe(3);
  });

  it("returns null topLabel for empty input", () => {
    expect(getHotspotStats([]).topLabel).toBeNull();
  });
});

describe("buildHotspotSection", () => {
  it("returns a non-empty string when PRs exist", () => {
    const section = buildHotspotSection([makePR(1, ["bug"])]);
    expect(section).toContain("## 🔥 Hotspot Labels");
  });

  it("returns empty string for no PRs", () => {
    expect(buildHotspotSection([])).toBe("");
  });
});

describe("appendHotspotSection", () => {
  it("appends to existing markdown", () => {
    const result = appendHotspotSection("# Weekly Digest", [
      makePR(1, ["chore"], "dev"),
    ]);
    expect(result).toContain("# Weekly Digest");
    expect(result).toContain("## 🔥 Hotspot Labels");
  });

  it("returns original markdown unchanged when no PRs", () => {
    const result = appendHotspotSection("# Weekly Digest", []);
    expect(result).toBe("# Weekly Digest");
  });

  it("includes label name in output", () => {
    const result = appendHotspotSection("", [
      makePR(1, ["security"], "alice"),
      makePR(2, ["security"], "bob"),
    ]);
    expect(result).toContain("`security`");
    expect(result).toContain("alice");
  });
});
