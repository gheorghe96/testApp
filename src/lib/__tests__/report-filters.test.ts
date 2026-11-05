import { matchesFilters } from "@/lib/report-filters";

// If this disagrees with the server, a just-created report flickers or
// vanishes from the list.
describe("matchesFilters", () => {
  const report = {
    title: "Nu arde felinarul",
    description: "Lângă scara 2, de trei zile",
    categoryId: "lighting",
  };

  it("matches everything without filters", () => {
    expect(matchesFilters(report, undefined)).toBe(true);
    expect(matchesFilters(report, {})).toBe(true);
  });

  it("filters by category", () => {
    expect(matchesFilters(report, { categoryId: "lighting" })).toBe(true);
    expect(matchesFilters(report, { categoryId: "roads" })).toBe(false);
  });

  it('treats a report without a status as "new" (all new reports start so)', () => {
    expect(matchesFilters(report, { status: "new" })).toBe(true);
    expect(matchesFilters(report, { status: "resolved" })).toBe(false);
    expect(
      matchesFilters({ ...report, status: "resolved" }, { status: "resolved" }),
    ).toBe(true);
  });

  it("searches title and description, ignoring case like the server", () => {
    expect(matchesFilters(report, { q: "FELINAR" })).toBe(true);
    expect(matchesFilters(report, { q: "scara 2" })).toBe(true);
    expect(matchesFilters(report, { q: "gunoi" })).toBe(false);
  });

  it("requires all filters to match at once", () => {
    expect(
      matchesFilters(report, {
        categoryId: "lighting",
        status: "new",
        q: "felinar",
      }),
    ).toBe(true);
    expect(
      matchesFilters(report, {
        categoryId: "lighting",
        status: "new",
        q: "gunoi",
      }),
    ).toBe(false);
  });
});
