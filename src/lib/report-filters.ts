import type { Report, ReportFilters } from "@/api/reports";

// Client-side copy of the server's filtering, for reports the server hasn't
// listed yet. Has to stay in sync with it, or new reports flicker in and out.
export function matchesFilters(
  r: Pick<Report, "title" | "description" | "categoryId"> & {
    status?: Report["status"];
  },
  f: ReportFilters | undefined,
) {
  if (!f) return true;
  if (f.categoryId && r.categoryId !== f.categoryId) return false;
  // Unsent reports have no status yet; the server will create them as "new"
  if (f.status && (r.status ?? "new") !== f.status) return false;
  if (f.q) {
    const q = f.q.toLowerCase();
    if (
      !r.title.toLowerCase().includes(q) &&
      !r.description.toLowerCase().includes(q)
    ) {
      return false;
    }
  }
  return true;
}
