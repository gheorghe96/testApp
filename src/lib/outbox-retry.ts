import { ApiError } from "@/api/client";
import { toErrorInfo } from "@/i18n/errors";
import type { OutboxItem } from "@/state/outbox";

// For 429/5xx only. Connection problems are retried indefinitely.
export const MAX_ATTEMPTS = 5;

/**
 * Decides what happens to an outbox item after a failed send. Kept pure
 * (time is passed in) so the rules are easy to test.
 *
 * - No answer at all: keep waiting, never give up. That's what makes
 *   creating reports offline work.
 * - 429 / 5xx: back off (honouring Retry-After), up to MAX_ATTEMPTS.
 * - Anything else: fail now and let the user decide. Sending the same
 *   request again won't change a 400.
 */
export function nextOutboxState(
  error: unknown,
  previousAttempts: number,
  now: number,
): Partial<OutboxItem> {
  const attempts = previousAttempts + 1;
  const info = toErrorInfo(error);

  if (error instanceof ApiError && error.status === 0) {
    return {
      state: "pending",
      attempts,
      waitingForNetwork: true,
      error: info,
      // 10s, 20s, 40s, then every minute; reconnecting skips the wait
      nextAttemptAt: now + Math.min(5_000 * 2 ** Math.min(attempts, 4), 60_000),
    };
  }

  if (
    error instanceof ApiError &&
    error.isTransient &&
    attempts < MAX_ATTEMPTS
  ) {
    return {
      state: "pending",
      attempts,
      waitingForNetwork: false,
      error: info,
      nextAttemptAt:
        now +
        (error.retryAfter
          ? error.retryAfter * 1000
          : Math.min(2_000 * 2 ** attempts, 60_000)),
    };
  }

  return {
    state: "failed",
    attempts,
    waitingForNetwork: false,
    error: info,
    nextAttemptAt: undefined,
  };
}
