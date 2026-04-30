import { groupAndSort, flattenGroups, countByGroup, GroupedPRs } from "./prGrouper";
import { SortablePR } from "./prSorter";

function makePR(overrides: Partial<SortablePR> = {}): SortablePR {
  return {
    number: 1,
    title: "fix: something",
    author: "alice",
    merged_at: "2024-01-10T12:00:00Z",
    size: "M",
    ...overrides,
  };
}

const groups: Record<string, SortablePR[]> = {
  feature: [
    makePR({ number: 3, title: "feat: c", merged_at: "2024-01-07T00:00:00Z" }),
    makePR({ number: 1, title: "feat: a", merged_at: "2024-01-10T00:00:00Z" }),
    makePR({ number: 2, title: "feat: b", merged_at: "2024-01-09T00:00:00Z" }),
  ],
  bugfix: [
    makePR({ number: 4, title: "fix: d", merged_at: "2024-01-08T00:00:00Z" }),
  ],
  chore: [],
};

const labelOrder = ["feature", "bugfix", "chore"];

describe("groupAndSort", () => {
  it("returns groups in label order, skipping empty ones", () => {
    const result = groupAndSort(groups, labelOrder, { defaultSort: { field: "merged_at", order: "desc" } });
    expect(result.map((g) => g.label)).toEqual(["feature", "bugfix"]);
  });

  it("sorts PRs within each group by default sort", () => {
    const result = groupAndSort(groups, labelOrder, { defaultSort: { field: "merged_at", order: "desc" } });
    const featurePRs = result.find((g) => g.label === "feature")!.prs;
    expect(featurePRs.map((p) => p.number)).toEqual([1, 2, 3]);
  });

  it("applies label-specific sort overrides", () => {
    const result = groupAndSort(groups, labelOrder, {
      defaultSort: { field: "merged_at", order: "desc" },
      labelOverrides: { feature: { field: "title", order: "asc" } },
    });
    const featurePRs = result.find((g) => g.label === "feature")!.prs;
    expect(featurePRs.map((p) => p.title)).toEqual(["feat: a", "feat: b", "feat: c"]);
  });

  it("returns empty array when no matching labels", () => {
    const result = groupAndSort({}, labelOrder, { defaultSort: { field: "merged_at", order: "desc" } });
    expect(result).toEqual([]);
  });
});

describe("flattenGroups", () => {
  it("flattens all PRs from all groups in order", () => {
    const grouped: GroupedPRs<SortablePR>[] = [
      { label: "feature", prs: [makePR({ number: 1 }), makePR({ number: 2 })] },
      { label: "bugfix", prs: [makePR({ number: 3 })] },
    ];
    expect(flattenGroups(grouped).map((p) => p.number)).toEqual([1, 2, 3]);
  });
});

describe("countByGroup", () => {
  it("returns count per label", () => {
    const grouped: GroupedPRs<SortablePR>[] = [
      { label: "feature", prs: [makePR(), makePR()] },
      { label: "bugfix", prs: [makePR()] },
    ];
    expect(countByGroup(grouped)).toEqual({ feature: 2, bugfix: 1 });
  });
});
