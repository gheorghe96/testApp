import type { ReportStatus } from "@/api/reports";
import type { TranslationKey } from "@/i18n";

// Display order
export const STATUSES: ReportStatus[] = ["new", "in_progress", "resolved"];

export const STATUS_INFO: Record<
  ReportStatus,
  { labelKey: TranslationKey; color: string }
> = {
  new: { labelKey: "status.new", color: "#3B82F6" },
  in_progress: { labelKey: "status.in_progress", color: "#F59E0B" },
  resolved: { labelKey: "status.resolved", color: "#22C55E" },
};
