import { loadAllTimeCount, saveAllTimeCount, checkAndPersistMilestone } from "./prMilestoneTracker";
import * as cache from "./cache";

jest.mock("./cache");

const mockRead = cache.readCache as jest.MockedFunction<typeof cache.readCache>;
const mockWrite = cache.writeCache as jest.MockedFunction<typeof cache.writeCache>;
const mockBuild = cache.buildUpdatedCache as jest.MockedFunction<typeof cache.buildUpdatedCache>;

beforeEach(() => {
  jest.clearAllMocks();
  mockBuild.mockImplementation((base, patch) => ({ ...base, ...patch } as any));
  mockWrite.mockResolvedValue(undefined);
});

describe("loadAllTimeCount", () => {
  it("returns 0 when cache is empty", async () => {
    mockRead.mockResolvedValue({} as any);
    expect(await loadAllTimeCount("/tmp/cache.json")).toBe(0);
  });

  it("returns stored value", async () => {
    mockRead.mockResolvedValue({ allTimeMergedCount: 42 } as any);
    expect(await loadAllTimeCount("/tmp/cache.json")).toBe(42);
  });
});

describe("saveAllTimeCount", () => {
  it("writes updated count to cache", async () => {
    mockRead.mockResolvedValue({} as any);
    await saveAllTimeCount("/tmp/cache.json", 99);
    expect(mockWrite).toHaveBeenCalledWith("/tmp/cache.json", expect.objectContaining({ allTimeMergedCount: 99 }));
  });
});

describe("checkAndPersistMilestone", () => {
  it("returns null when no milestone crossed", async () => {
    mockRead.mockResolvedValue({ allTimeMergedCount: 5 } as any);
    const result = await checkAndPersistMilestone("/tmp/cache.json", 3);
    expect(result).toBeNull();
    expect(mockWrite).toHaveBeenCalled();
  });

  it("returns milestone when one is crossed", async () => {
    mockRead.mockResolvedValue({ allTimeMergedCount: 48 } as any);
    const result = await checkAndPersistMilestone("/tmp/cache.json", 5);
    expect(result).not.toBeNull();
    expect(result!.number).toBe(50);
  });

  it("persists new total regardless of milestone", async () => {
    mockRead.mockResolvedValue({ allTimeMergedCount: 10 } as any);
    await checkAndPersistMilestone("/tmp/cache.json", 7);
    expect(mockWrite).toHaveBeenCalledWith("/tmp/cache.json", expect.objectContaining({ allTimeMergedCount: 17 }));
  });
});
