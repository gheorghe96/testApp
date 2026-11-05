import { ApiError, AppError } from "@/api/client";
import { MAX_ATTEMPTS, nextOutboxState } from "@/lib/outbox-retry";

// Getting this wrong either strands offline reports or hammers a struggling
// server forever, so it gets the most tests.
describe("nextOutboxState", () => {
  const now = 1_000_000;

  it("keeps waiting for the network when the server can't be reached", () => {
    const next = nextOutboxState(new ApiError(0, "NETWORK"), 0, now);
    expect(next.state).toBe("pending");
    expect(next.waitingForNetwork).toBe(true);
    expect(next.error).toEqual({
      code: "NETWORK",
      fields: undefined,
      status: 0,
    });
    expect(next.nextAttemptAt).toBeGreaterThan(now);
  });

  it("never gives up on a connection problem, however many attempts", () => {
    const next = nextOutboxState(new ApiError(0, "TIMEOUT"), 100, now);
    expect(next.state).toBe("pending");
    // Backoff is capped at one minute
    expect(next.nextAttemptAt).toBe(now + 60_000);
  });

  it("waits as long as the server asks on 429 Retry-After", () => {
    const next = nextOutboxState(
      new ApiError(429, "RATE_LIMITED", undefined, 7),
      0,
      now,
    );
    expect(next.state).toBe("pending");
    expect(next.waitingForNetwork).toBe(false);
    expect(next.nextAttemptAt).toBe(now + 7_000);
  });

  it("retries 5xx with a growing delay", () => {
    const first = nextOutboxState(
      new ApiError(503, "SERVICE_UNAVAILABLE"),
      0,
      now,
    );
    const second = nextOutboxState(
      new ApiError(503, "SERVICE_UNAVAILABLE"),
      1,
      now,
    );
    expect(first.state).toBe("pending");
    expect(second.state).toBe("pending");
    expect(second.nextAttemptAt! - now).toBeGreaterThan(
      first.nextAttemptAt! - now,
    );
  });

  it(`gives up on 5xx after ${MAX_ATTEMPTS} attempts so the user can decide`, () => {
    const next = nextOutboxState(
      new ApiError(500, "INTERNAL_ERROR"),
      MAX_ATTEMPTS - 1,
      now,
    );
    expect(next.state).toBe("failed");
    expect(next.attempts).toBe(MAX_ATTEMPTS);
    expect(next.nextAttemptAt).toBeUndefined();
  });

  it("fails right away on a bad request: retrying it can't help", () => {
    const next = nextOutboxState(
      new ApiError(400, "VALIDATION_FAILED", ["title"]),
      0,
      now,
    );
    expect(next.state).toBe("failed");
    expect(next.error).toEqual({
      code: "VALIDATION_FAILED",
      fields: ["title"],
      status: 400,
    });
  });

  it("fails right away on an unknown category (404)", () => {
    expect(
      nextOutboxState(new ApiError(404, "CATEGORY_NOT_FOUND"), 0, now).state,
    ).toBe("failed");
  });

  it("fails right away on device-side problems (missing photo, bugs)", () => {
    expect(
      nextOutboxState(new AppError("PHOTO_MISSING"), 0, now),
    ).toMatchObject({
      state: "failed",
      error: { code: "PHOTO_MISSING" },
    });
    expect(nextOutboxState(new TypeError("boom"), 0, now)).toMatchObject({
      state: "failed",
      error: { code: "UNKNOWN" },
    });
  });
});
