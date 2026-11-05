import { AppError } from "@/api/client";
import {
  createReport,
  type Report,
  type ReportFilters,
  type ReportsPage,
} from "@/api/reports";
import { uploadPhoto } from "@/api/uploads";
import { nextOutboxState } from "@/lib/outbox-retry";
import { matchesFilters } from "@/lib/report-filters";
import { photoFileExists } from "@/lib/photos";
import {
  getOutbox,
  removeFromOutbox,
  subscribeOutbox,
  updateOutboxItem,
  type OutboxItem,
  type OutboxPhoto,
} from "@/state/outbox";
import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import * as Network from "expo-network";
import { AppState } from "react-native";

// Drains the outbox while the app is open: photos first, then the report
// itself, one item at a time, oldest first. Sequential on purpose: the
// server rate-limits, and parallel sends just buy more 429s.
//
// What to do after a failure is decided in outbox-retry.ts.

let online = true;
let running = false;
let runAgain = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let queryClient: QueryClient | undefined;

/** Call once from the root layout. Returns a cleanup. */
export function startOutboxSync(client: QueryClient) {
  queryClient = client;

  const applyNetwork = (s: Network.NetworkState) => {
    const wasOnline = online;
    online = s.isConnected !== false && s.isInternetReachable !== false;
    if (online && !wasOnline) {
      // Don't make reports sit out their backoff once we're back online
      for (const i of getOutbox()) {
        if (i.state === "pending" && i.waitingForNetwork) {
          updateOutboxItem(i.id, { nextAttemptAt: undefined });
        }
      }
    }
    pump();
  };

  const netSub = Network.addNetworkStateListener(applyNetwork);
  Network.getNetworkStateAsync().then(applyNetwork, () => pump());
  const unsubOutbox = subscribeOutbox(() => pump());
  // Timers are paused in the background, so re-check on resume
  const appSub = AppState.addEventListener("change", (s) => {
    if (s === "active") pump();
  });

  pump();

  return () => {
    netSub.remove();
    unsubOutbox();
    appSub.remove();
    clearTimeout(timer);
  };
}

async function pump() {
  if (running) {
    runAgain = true;
    return;
  }
  running = true;
  try {
    while (online) {
      const now = Date.now();
      const next = [...getOutbox()]
        .reverse()
        .find(
          (i) =>
            i.state === "pending" &&
            (!i.nextAttemptAt || i.nextAttemptAt <= now),
        );
      if (!next) break;
      await send(next);
    }
  } finally {
    running = false;
    scheduleNextRetry();
    if (runAgain) {
      runAgain = false;
      pump();
    }
  }
}

function scheduleNextRetry() {
  clearTimeout(timer);
  const times = getOutbox()
    .filter((i) => i.state === "pending" && i.nextAttemptAt)
    .map((i) => i.nextAttemptAt!);
  if (times.length === 0) return;
  timer = setTimeout(pump, Math.max(0, Math.min(...times) - Date.now()));
}

const stillQueued = (id: string) => getOutbox().some((i) => i.id === id);

async function send(item: OutboxItem) {
  updateOutboxItem(item.id, { state: "sending" });
  try {
    const photos: OutboxPhoto[] = [...item.photos];
    for (let i = 0; i < photos.length; i++) {
      const p = photos[i];
      if (p.uploaded) continue;
      if (!photoFileExists(p.uri)) {
        throw new AppError("PHOTO_MISSING");
      }
      const uploaded = await uploadPhoto(p.uri);
      photos[i] = { ...p, uploaded };
      if (!stillQueued(item.id)) return; // cancelled while uploading
      updateOutboxItem(item.id, { photos: [...photos] });
    }

    // Same key and same body on every retry, so a lost response can't
    // turn into a duplicate report
    const report = await createReport(
      {
        title: item.title,
        description: item.description,
        categoryId: item.categoryId,
        photos: photos.map((p) => p.uploaded!),
      },
      item.id,
    );

    if (!stillQueued(item.id)) return;
    addToCachedLists(report);
    removeFromOutbox(item.id);
  } catch (e) {
    if (!stillQueued(item.id)) return;
    handleError(item, e);
  }
}

function handleError(item: OutboxItem, e: unknown) {
  updateOutboxItem(item.id, nextOutboxState(e, item.attempts, Date.now()));
}

// Without this the report would disappear between leaving the outbox and
// the next refetch.
function addToCachedLists(report: Report) {
  if (!queryClient) return;
  queryClient.setQueryData(["report", report.id], report);

  for (const query of queryClient
    .getQueryCache()
    .findAll({ queryKey: ["reports"] })) {
    const filters = query.queryKey[1] as ReportFilters | undefined;
    if (!matchesFilters(report, filters)) continue;
    queryClient.setQueryData<InfiniteData<ReportsPage, number>>(
      query.queryKey,
      (data) =>
        data && {
          ...data,
          pages: data.pages.map((p, i) =>
            i === 0
              ? { ...p, items: [report, ...p.items], total: p.total + 1 }
              : p,
          ),
        },
    );
  }
  // Mark stale but don't refetch now; the server is slow enough already
  queryClient.invalidateQueries({ queryKey: ["reports"], refetchType: "none" });
}
