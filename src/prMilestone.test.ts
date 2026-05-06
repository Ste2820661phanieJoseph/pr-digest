import {
  detectMilestone,
  formatMilestoneLabel,
  formatMilestoneSection,
  appendMilestoneToMarkdown,
} from "./prMilestone";

describe("detectMilestone", () => {
  it("returns null when no milestone is crossed", () => {
    expect(detectMilestone(10, 5)).toBeNull();
  });

  it("detects the 50 milestone", () => {
    const result = detectMilestone(47, 5);
    expect(result).not.toBeNull();
    expect(result!.number).toBe(50);
  });

  it("detects the 100 milestone exactly", () => {
    const result = detectMilestone(99, 1);
    expect(result).not.toBeNull();
    expect(result!.number).toBe(100);
  });

  it("detects the 1000 milestone", () => {
    const result = detectMilestone(995, 10);
    expect(result).not.toBeNull();
    expect(result!.number).toBe(1000);
  });

  it("does not double-count a milestone already passed", () => {
    expect(detectMilestone(100, 5)).toBeNull();
  });

  it("returns the lowest milestone when multiple are crossed", () => {
    // jumping from 0 to 60 crosses both 10 and 50
    const result = detectMilestone(0, 60);
    expect(result!.number).toBe(10);
  });
});

describe("formatMilestoneLabel", () => {
  it("includes the number and emoji", () => {
    expect(formatMilestoneLabel(100)).toBe("🎉 100th merged PR milestone!");
  });
});

describe("formatMilestoneSection", () => {
  it("contains the milestone number", () => {
    const section = formatMilestoneSection({ hit: true, number: 50, label: "🎉 50th merged PR milestone!" });
    expect(section).toContain("50");
    expect(section).toContain("##");
  });
});

describe("appendMilestoneToMarkdown", () => {
  it("prepends milestone section when milestone exists", () => {
    const result = appendMilestoneToMarkdown("# Digest", { hit: true, number: 100, label: "🎉 100th merged PR milestone!" });
    expect(result.startsWith("## 🎉")).toBe(true);
    expect(result).toContain("# Digest");
  });

  it("returns original markdown when milestone is null", () => {
    const md = "# Digest";
    expect(appendMilestoneToMarkdown(md, null)).toBe(md);
  });
});
