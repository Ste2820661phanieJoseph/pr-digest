import { describe, it, expect, vi, beforeEach } from "vitest";
import { summarizePR, summarizePRs, PullRequest } from "./summarize";

vi.mock("@anthropic-ai/sdk", () => {
  const mockCreate = vi.fn();
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: { create: mockCreate },
    })),
    __mockCreate: mockCreate,
  };
});

const mockPR: PullRequest = {
  number: 42,
  title: "Add user authentication",
  body: "Implements JWT-based authentication for the API endpoints.",
  author: "octocat",
  mergedAt: "2024-01-15T10:00:00Z",
  url: "https://github.com/org/repo/pull/42",
  labels: ["feature", "auth"],
};

describe("summarizePR", () => {
  beforeEach(async () => {
    const mod = await import("@anthropic-ai/sdk");
    const mockCreate = (mod as any).__mockCreate;
    mockCreate.mockResolvedValue({
      content: [
        {
          type: "text",
          text: "Adds JWT-based authentication to secure API endpoints.",
        },
      ],
    });
  });

  it("returns a summary string for a PR", async () => {
    const summary = await summarizePR(mockPR);
    expect(typeof summary).toBe("string");
    expect(summary.length).toBeGreaterThan(0);
  });

  it("handles PRs with no body", async () => {
    const prNoBody = { ...mockPR, body: null };
    const summary = await summarizePR(prNoBody);
    expect(typeof summary).toBe("string");
  });

  it("handles PRs with no labels", async () => {
    const prNoLabels = { ...mockPR, labels: [] };
    const summary = await summarizePR(prNoLabels);
    expect(typeof summary).toBe("string");
  });
});

describe("summarizePRs", () => {
  beforeEach(async () => {
    const mod = await import("@anthropic-ai/sdk");
    const mockCreate = (mod as any).__mockCreate;
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "Mocked summary." }],
    });
  });

  it("returns summarized PRs with original fields preserved", async () => {
    const prs = [mockPR, { ...mockPR, number: 43, title: "Fix login bug" }];
    const results = await summarizePRs(prs);

    expect(results).toHaveLength(2);
    expect(results[0].number).toBe(42);
    expect(results[1].number).toBe(43);
    results.forEach((r) => {
      expect(r.summary).toBeDefined();
      expect(typeof r.summary).toBe("string");
    });
  });

  it("returns empty array for empty input", async () => {
    const results = await summarizePRs([]);
    expect(results).toEqual([]);
  });
});
