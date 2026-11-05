import type { ReportStatus } from "@/api/reports";
import { STATUSES } from "@/constants/status";
import Storage from "expo-sqlite/kv-store";
import { useSyncExternalStore } from "react";

// Persisted across launches (a requirement). Single-select because the API
// takes one categoryId per request.
export type Filters = {
  categoryId?: string;
  status?: ReportStatus;
};

const KEY = "filters";
export const EMPTY_FILTERS: Filters = {};

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);

function load(): Filters {
  try {
    const raw = Storage.getItemSync(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      const status = str(saved.status) as ReportStatus | undefined;
      return {
        categoryId: str(saved.categoryId),
        // Never send the server a status it doesn't know
        status: status && STATUSES.includes(status) ? status : undefined,
      };
    }
  } catch {
    // Corrupted value: start clean rather than crash on launch
  }
  return EMPTY_FILTERS;
}

let current: Filters | undefined;
const listeners = new Set<() => void>();

const getSnapshot = () => (current ??= load());

export const getFilters = getSnapshot;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setFilters(next: Filters) {
  // No undefined keys: { status: undefined } and {} would otherwise be
  // different query keys for the same list
  current = {
    ...(next.categoryId && { categoryId: next.categoryId }),
    ...(next.status && { status: next.status }),
  };
  try {
    Storage.setItemSync(KEY, JSON.stringify(current));
  } catch {
    // Not fatal, just not remembered
  }
  listeners.forEach((l) => l());
}

export function useFilters() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export const countActiveFilters = (f: Filters) =>
  (f.categoryId ? 1 : 0) + (f.status ? 1 : 0);
