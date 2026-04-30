import {
  deduplicatePRs,
  findNewOrUpdatedPRs,
  mergePRMaps,
  prMapToArray,
  MinimalPR,
} from "./prDeduplicator";

function makePR(number: number, updatedAt: string, extra: object = {}): MinimalPR {
  return { number, updatedAt, ...extra };
}

describe("deduplicatePRs", () => {
  it("keeps the most recently updated entry for duplicate numbers", () => {
    const prs = [
      makePR(1, "2024-01-01T00:00:00Z"),
      makePR(1, "2024-01-03T00:00:00Z"),
      makePR(1, "2024-01-02T00:00:00Z"),
    ];
    const result = deduplicatePRs(prs);
    expect(result.get(1)?.updatedAt).toBe("2024-01-03T00:00:00Z");
  });

  it("handles unique PRs without modification", () => {
    const prs = [makePR(1, "2024-01-01T00:00:00Z"), makePR(2, "2024-01-02T00:00:00Z")];
    const result = deduplicatePRs(prs);
    expect(result.size).toBe(2);
  });

  it("returns empty map for empty input", () => {
    expect(deduplicatePRs([]).size).toBe(0);
  });
});

describe("findNewOrUpdatedPRs", () => {
  it("returns PRs not present in cache", () => {
    const cached = deduplicatePRs([makePR(1, "2024-01-01T00:00:00Z")]);
    const incoming = [makePR(1, "2024-01-01T00:00:00Z"), makePR(2, "2024-01-02T00:00:00Z")];
    const result = findNewOrUpdatedPRs(incoming, cached);
    expect(result).toHaveLength(1);
    expect(result[0].number).toBe(2);
  });

  it("returns PRs with a newer updatedAt than cached", () => {
    const cached = deduplicatePRs([makePR(1, "2024-01-01T00:00:00Z")]);
    const incoming = [makePR(1, "2024-01-05T00:00:00Z")];
    const result = findNewOrUpdatedPRs(incoming, cached);
    expect(result).toHaveLength(1);
  });

  it("excludes PRs that are not newer than cached", () => {
    const cached = deduplicatePRs([makePR(1, "2024-01-05T00:00:00Z")]);
    const incoming = [makePR(1, "2024-01-03T00:00:00Z")];
    expect(findNewOrUpdatedPRs(incoming, cached)).toHaveLength(0);
  });
});

describe("mergePRMaps", () => {
  it("merges new PRs into base map", () => {
    const base = deduplicatePRs([makePR(1, "2024-01-01T00:00:00Z")]);
    const merged = mergePRMaps(base, [makePR(2, "2024-01-02T00:00:00Z")]);
    expect(merged.size).toBe(2);
  });

  it("overwrites base entry when update is newer", () => {
    const base = deduplicatePRs([makePR(1, "2024-01-01T00:00:00Z")]);
    const merged = mergePRMaps(base, [makePR(1, "2024-01-10T00:00:00Z")]);
    expect(merged.get(1)?.updatedAt).toBe("2024-01-10T00:00:00Z");
  });

  it("does not overwrite base entry when update is older", () => {
    const base = deduplicatePRs([makePR(1, "2024-01-10T00:00:00Z")]);
    const merged = mergePRMaps(base, [makePR(1, "2024-01-01T00:00:00Z")]);
    expect(merged.get(1)?.updatedAt).toBe("2024-01-10T00:00:00Z");
  });
});

describe("prMapToArray", () => {
  it("returns PRs sorted by number ascending", () => {
    const map = deduplicatePRs([makePR(3, "2024-01-01Z"), makePR(1, "2024-01-01Z"), makePR(2, "2024-01-01Z")]);
    const arr = prMapToArray(map);
    expect(arr.map((p) => p.number)).toEqual([1, 2, 3]);
  });
});
