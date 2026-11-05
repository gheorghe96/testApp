import { BASE_URL, getJson, requestJson } from "./client";
import type { UploadedPhoto } from "./uploads";

// The API returns photo paths ("/images/…"), not full URLs
export const photoUrl = (path: string) =>
  path.startsWith("http") ? path : `${BASE_URL}${path}`;

export type ReportStatus = "new" | "in_progress" | "resolved";

export type Photo = {
  url: string;
  width: number;
  height: number;
};

export type Report = {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  status: ReportStatus;
  photos: Photo[];
  createdAt: string;
  updatedAt: string;
};

export type ReportsPage = {
  items: Report[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

export type ReportFilters = {
  status?: ReportStatus;
  categoryId?: string;
  q?: string;
};

export type CreateReportRequest = {
  title: string;
  description: string;
  categoryId: string;
  photos: UploadedPhoto[];
};

// Pass the same key on every retry of a report. If the first response got
// lost, the server returns the report it already made instead of a duplicate.
export function createReport(
  body: CreateReportRequest,
  idempotencyKey: string,
  signal?: AbortSignal,
): Promise<Report> {
  return requestJson<Report>("/reports", {
    method: "POST",
    body,
    headers: { "Idempotency-Key": idempotencyKey },
    signal,
    timeoutMs: 30_000,
  });
}

export function fetchReport(id: string, signal?: AbortSignal): Promise<Report> {
  return getJson<Report>(
    `/reports/${encodeURIComponent(id)}`,
    undefined,
    signal,
  );
}

export function fetchReports(
  filters: ReportFilters = {},
  page = 1,
  { limit = 20, signal }: { limit?: number; signal?: AbortSignal } = {},
): Promise<ReportsPage> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (filters.status) params.set("status", filters.status);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  const q = filters.q?.trim();
  if (q) params.set("q", q);

  return getJson<ReportsPage>("/reports", params, signal);
}
