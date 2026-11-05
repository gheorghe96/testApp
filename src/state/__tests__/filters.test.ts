// Filters are read back on every launch, so a bad saved value must never
// crash the app or reach the server.

const mockStore = new Map<string, string>();
jest.mock("expo-sqlite/kv-store", () => ({
  __esModule: true,
  default: {
    getItemSync: (k: string) => mockStore.get(k) ?? null,
    setItemSync: (k: string, v: string) => void mockStore.set(k, v),
  },
}));

// Fresh module instance = a fresh app launch
function launch() {
  let mod!: typeof import("@/state/filters");
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require("@/state/filters");
  });
  return mod;
}

beforeEach(() => mockStore.clear());

describe("saved filters", () => {
  it("starts empty when nothing was saved", () => {
    const { getFilters } = launch();
    expect(getFilters()).toEqual({});
  });

  it("restores what was saved before the restart", () => {
    launch().setFilters({ categoryId: "roads", status: "resolved" });
    expect(launch().getFilters()).toEqual({
      categoryId: "roads",
      status: "resolved",
    });
  });

  it("does not save cleared filters as empty values", () => {
    launch().setFilters({ categoryId: undefined, status: undefined });
    expect(JSON.parse(mockStore.get("filters")!)).toEqual({});
  });

  it("drops an unknown status instead of sending it to the server", () => {
    mockStore.set(
      "filters",
      JSON.stringify({ categoryId: "roads", status: "bogus" }),
    );
    expect(launch().getFilters()).toEqual({ categoryId: "roads" });
  });

  it("survives corrupted storage", () => {
    mockStore.set("filters", "{not json");
    expect(launch().getFilters()).toEqual({});
  });
});
