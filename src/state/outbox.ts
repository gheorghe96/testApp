import type { UploadedPhoto } from "@/api/uploads";
import type { ErrorInfo } from "@/i18n/errors";
import { deletePhotos, type LocalPhoto } from "@/lib/photos";
import * as Crypto from "expo-crypto";
import Storage from "expo-sqlite/kv-store";
import { useSyncExternalStore } from "react";

// Reports created here that the server doesn't have yet. Persisted, so
// anything made offline or interrupted mid-send survives a restart.
// lib/outbox-sync.ts drains it.

export type OutboxPhoto = LocalPhoto & {
  /** Set after a successful upload, so retries skip it. */
  uploaded?: UploadedPhoto;
};

// "failed" waits for the user (Retry / Cancel); the others are automatic
type OutboxState = "pending" | "sending" | "failed";

export type OutboxItem = {
  /** Doubles as the Idempotency-Key. */
  id: string;
  createdAt: string;
  title: string;
  description: string;
  categoryId: string;
  photos: OutboxPhoto[];
  state: OutboxState;
  /** A code, not text, so it follows the language setting. */
  error?: ErrorInfo;
  attempts: number;
  /** Last failure was "no answer", so retry as soon as we're back online. */
  waitingForNetwork?: boolean;
  /** Epoch ms. */
  nextAttemptAt?: number;
};

const KEY = "outbox";

function load(): OutboxItem[] {
  try {
    const raw = Storage.getItemSync(KEY);
    const items: OutboxItem[] = raw ? JSON.parse(raw) : [];
    // Killed mid-send: just send again, the idempotency key makes it safe
    return items.map((i) =>
      i.state === "sending" ? { ...i, state: "pending" } : i,
    );
  } catch {
    return [];
  }
}

let items: OutboxItem[] | undefined;
const listeners = new Set<() => void>();

export const getOutbox = () => (items ??= load());

let writeScheduled = false;

function writeNow() {
  writeScheduled = false;
  try {
    Storage.setItemSync(KEY, JSON.stringify(getOutbox()));
  } catch {
    // Keep going in memory; worst case this session's changes aren't saved
  }
}

/**
 * Memory is updated synchronously; disk depends on `durable`.
 *
 * Adding and removing items must hit disk right away. Otherwise a report
 * could be lost, or a sent one could come back after a restart. Progress
 * updates (sending, photo uploaded, retry time) are batched: losing one just
 * repeats a step on the next launch, which uploads and the idempotency key
 * make harmless.
 */
function save(next: OutboxItem[], durable = false) {
  items = next;
  if (durable) {
    writeNow();
  } else if (!writeScheduled) {
    writeScheduled = true;
    // Deliberately sync, not setItemAsync: an async write landing after a
    // later durable one would resurrect a sent report
    setTimeout(() => {
      if (writeScheduled) writeNow();
    }, 0);
  }
  listeners.forEach((l) => l());
}

export function subscribeOutbox(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Newest first. */
export function useOutbox() {
  return useSyncExternalStore(subscribeOutbox, getOutbox, getOutbox);
}

export function addToOutbox(
  report: Pick<OutboxItem, "title" | "description" | "categoryId" | "photos">,
): OutboxItem {
  const item: OutboxItem = {
    ...report,
    id: Crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    state: "pending",
    attempts: 0,
  };
  save([item, ...getOutbox()], true);
  return item;
}

export function updateOutboxItem(id: string, patch: Partial<OutboxItem>) {
  save(getOutbox().map((i) => (i.id === id ? { ...i, ...patch } : i)));
}

/** After a successful send or a cancel. Deletes the photo copies too. */
export function removeFromOutbox(id: string) {
  const item = getOutbox().find((i) => i.id === id);
  if (item) deletePhotos(item.photos);
  save(
    getOutbox().filter((i) => i.id !== id),
    true,
  );
}

export function retryOutboxItem(id: string) {
  updateOutboxItem(id, {
    state: "pending",
    error: undefined,
    attempts: 0,
    nextAttemptAt: undefined,
    waitingForNetwork: undefined,
  });
}
