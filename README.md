# Reports

A small React Native app for citizen reports: browse the list, open a report, create a new one with photos. Built with Expo SDK 58, React Native 0.88 and TypeScript in strict mode.

The screens themselves are the easy part. Most of the work went into dealing with the test API, which (as promised) behaves like a server on a bad day: slow answers, random 500/503, 429 with `Retry-After`. Below is how to run it, the decisions I made and why, and what I'd still do.

## Running it

You need Node (LTS), and Xcode or Android Studio if you want a native build.

```bash
npm install
npx expo start
```

Expo Go is enough for almost everything. Two things need a development build, because they're native configuration that Expo Go ignores:

- the `reports://` deep links
- the translated iOS permission prompts (camera, photos)

```bash
npm run ios        # npx expo run:ios
npm run android    # npx expo run:android
```

Then, with the app installed, open a report by link. It works whether the app is open, in the background or killed:

```bash
npx uri-scheme open reports://reports/<id> --ios
npx uri-scheme open reports://reports/<id> --android
```

Take any id from the list, or from `curl "https://mobile-task.ai-worldhub.com/reports?limit=1"`. The server resets its data from time to time, so an id that worked yesterday may be gone. In that case the app shows "not found", which is expected.

Checks:

```bash
npm test           # Jest (jest-expo)
npm run lint
npx tsc --noEmit
```

To try offline creation on the simulator: turn off your Mac's Wi-Fi, create a couple of reports, kill and reopen the app, then turn Wi-Fi back on.

## What's in it

- **List.** Infinite scroll, pull-to-refresh, filter by status and category, text search. Filters are remembered between launches. Loading, empty and error states, with retry.
- **Details.** Text, category, status, dates, photos with a full-screen viewer (swipe; pinch-zoom on iOS). Also opens from `reports://reports/{id}`.
- **New report.** Title, description, category, up to 3 photos from camera or gallery. Validated against the OpenAPI limits before sending. The report shows up in the list immediately and is sent in the background. That works offline too: it goes out when the network is back. If the server rejects it, the card shows why, with Retry and Cancel.
- **Romanian and Russian**, switchable in Settings. All error texts live in the app, chosen by the error code the API returns.

## Project layout

```
src/
  app/          screens; Expo Router turns each file into a route
  api/          HTTP: one request function, endpoints, types
  hooks/        TanStack Query hooks used by screens
  state/        small stores saved on the device (filters, outbox)
  lib/          logic with no UI: outbox worker, retry rules, validation, photos
  components/   UI pieces
  i18n/         dictionaries (ro is the source of keys), error texts
  constants/    API limits, statuses, theme
```

The idea is simple: screens render, hooks fetch, `api/` talks HTTP, and the decisions live in `lib/` as plain functions. That's also what made them easy to test.

## Decisions

### One place that talks to the server

Everything goes through `requestJson` in `src/api/client.ts`. It does a few things on every call:

- **Timeout.** 20 s for reads, longer for creating a report and uploading photos. `fetch` has no timeout of its own, and with this server a request sometimes just never answers. Without a limit the screen would spin forever, and nothing would retry, because nothing failed.
- **Errors become codes.** Every failure turns into `ApiError(status, code, fields, retryAfter)`, or `AppError` for things that happen on the device. The API only sends codes, so the texts are in the app, in both languages. They're looked up when shown, which also means switching the language translates errors already on screen.
- **Network failure vs. bug.** "Couldn't reach the server" is treated differently from "the request couldn't even be built". The first means wait and retry. The second is a bug and should be visible, not silently retried forever. This one bit me: see the upload note below.

### Reads: TanStack Query

Caching, cancellation, infinite pages and loading/error states, without writing them by hand. Reads retry twice on transient errors (no answer, 429, 5xx) and respect `Retry-After`. 4xx isn't retried.

### The list

- **FlashList** for ~5000 rows. Cards are memoized and get everything as plain props; the list computes labels and dates once. So 100 rows don't mean 100 subscriptions to translations and categories.
- **Page-number pagination shifts.** The API docs warn that a new report shifts the next page, so an item can show up twice. I dedupe by id. Pull-to-refresh drops everything but page 1 and refetches it, instead of reloading every page you've scrolled through.
- **Search** waits for a 500 ms pause, or the keyboard's Search key. It needs at least 2 characters and normalizes the text so equivalent queries share the cache, and outdated requests are aborted. The field owns its own text, so typing doesn't re-render the list. While new results load, the old ones stay on screen instead of flashing to a spinner.
- **Filters are single-select.** The API takes one `categoryId` per request. I did try multi-select categories by fetching each category separately and merging the pages newest-first on the client, and it worked. I removed it: it multiplied requests against a server that already rate-limits, and the complexity wasn't worth it for this task.
- **Saved filters** are read synchronously on startup (`expo-sqlite/kv-store`), so the very first request already uses them: no "All" flash followed by a second request.

### Images

The API has no thumbnails, so every card loads the full photo. What helps:

- `expo-image` with `cachePolicy="memory-disk"`: scrolling back is instant, and photos survive restarts, which is nice offline.
- Decoding is downscaled to the card size (`expo-image` default), so a 2400 px photo doesn't cost 2400 px of memory.
- When a page arrives, its cover photos start downloading straight away, before the cards scroll into view.

The real fix is a thumbnail endpoint on the backend.

### Deep links

`scheme: "reports"` in `app.json`. Expo Router maps `reports://reports/123` to `src/app/reports/[id].tsx`: for custom schemes the host becomes the first path segment, which I confirmed in the router's source rather than guessing. `unstable_settings.anchor = "index"` puts the list underneath, so Back works even when the link launched the app. If the report is already in the list's cache, the details screen shows it instantly while the fresh copy loads.

### Creating reports: an outbox

This is the part I'd want to talk about most.

Tapping Send doesn't call the server. It saves the report, photos included, into an outbox on the device and closes the form. The list shows it at the top right away. A worker (`src/lib/outbox-sync.ts`) sends outbox items one at a time, oldest first:

1. upload each photo (`POST /uploads`), remembering each result so a retry doesn't upload it again
2. `POST /reports` with the returned URLs and `Idempotency-Key` set to the report's local id
3. put the server's report into the cached lists and drop the outbox item

It runs when something is added, when the network comes back (`expo-network`), when the app returns to the foreground, and when a backoff ends.

The idempotency key is the important bit. If the server creates the report and the response is lost, the retry gets the same report back instead of creating a duplicate. On a flaky network that happens more than you'd think.

What happens after a failed attempt is one pure function, `nextOutboxState` in `src/lib/outbox-retry.ts`, so it's easy to read and to test:

| What went wrong                  | What happens                                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| No answer (offline, timeout)     | keep waiting; retry after 10/20/40 s, then every minute, and right away on reconnect; never gives up |
| 429, 500, 503                    | retry after `Retry-After` or a growing delay, up to 5 attempts, then "Not sent"                      |
| 4xx, a missing photo file, a bug | "Not sent" right away; the same request won't suddenly work                                          |

A "Not sent" card says why and offers Retry or Cancel. A report that was mid-send when the app was killed is simply sent again on the next launch, safely, thanks to the key. Adding or removing an outbox item is written to disk immediately; progress updates are batched.

Photos are converted to JPEG and resized to 2048 px when picked. iPhones often produce HEIC, which the API rejects, and smaller files survive bad connections better. They're copied into the documents folder, not the cache, so a report created offline still has its photos days later.

One gotcha worth knowing: in this SDK the global `fetch` is Expo's. Its multipart encoder doesn't accept React Native's `{ uri, name, type }` file object, so uploads failed with "Unsupported FormDataPart implementation". It failed before the request left the phone, and my first version reported it as "no connection", so the report waited for a network that was already there. The fix was passing an `expo-file-system` `File`. That bug is also why the client now tells network failures apart from everything else.

### Translations

A small typed dictionary instead of i18next: about 110 keys and no tricky plurals didn't justify a library. `ro.ts` defines the keys and `ru.ts` is typed against it, so a missing translation fails the typecheck; a test checks that both languages use the same `{placeholders}`. Category names come from the API in both languages, dates are formatted per language, and the first launch follows the phone's language.

### State

Three tiny stores (filters, outbox, language), each `useSyncExternalStore` over `expo-sqlite/kv-store`. No Redux or Zustand: the state is small, and reading it synchronously on startup mattered more than features.

### No generated API client

The task suggests generating one from the OpenAPI spec. With five endpoints, the value is in how each request is handled (timeouts, cancellation, error classification, idempotency, the Expo multipart quirk), not in calling them. So I kept a thin client of my own and wrote the types by hand. The honest downside is drift if the spec changes. See below.

## Libraries

|                                           | Why                                                        |
| ----------------------------------------- | ---------------------------------------------------------- |
| expo-router                               | file routes; deep links map onto them directly             |
| @tanstack/react-query                     | caching, retries, cancellation, infinite pages             |
| @shopify/flash-list                       | long lists with cell recycling                             |
| expo-image                                | memory/disk cache, downscaled decoding, prefetch           |
| expo-sqlite/kv-store                      | synchronous key-value storage for state restored on launch |
| expo-image-picker, expo-image-manipulator | camera/gallery, JPEG conversion and resizing               |
| expo-file-system                          | keeping outbox photos; uploading them through Expo's fetch |
| expo-network                              | knowing when to resume sending                             |
| expo-crypto                               | `randomUUID()` for outbox ids / idempotency keys           |
| jest-expo                                 | tests                                                      |

## Tests

`npm test` runs 29 tests on the logic where a quiet mistake would hurt most:

- **outbox retry rules:** which errors wait, which retry, which give up
- **filter matching** for reports the server doesn't have yet. If it disagrees with the server, a new report flickers or vanishes.
- **form validation** against the OpenAPI limits
- **saved filters** read back on launch: old formats, an unknown status, corrupted storage
- **translations:** same placeholders in both languages, a text for every API error code

## What I'd do with more time

- **Generate types from the OpenAPI spec** with `openapi-typescript`, keeping my own request layer. It removes the drift risk, and new error codes would fail the typecheck until they get a translation.
- **Send in the background** (`expo-background-task`). Right now the outbox only drains while the app is open.
- **Pause the whole queue on 429** instead of just the item that got it. Today the next item usually gets a 429 as well; it recovers, but it's noisy.
- **Thumbnails** on the backend: the biggest remaining performance win, and nothing on the client replaces it.
- **Profile a release build on real devices,** Android especially. I optimized what showed up in review (per-row subscriptions, list remounts, missing timeouts, caching), but haven't measured it on low-end hardware.
- **Small things:**
  - one shared helper for the three persisted stores
  - the API URL from `EXPO_PUBLIC_API_URL`
  - status colors into the theme, and a proper pass on light mode
  - field names in "invalid data" messages are shown as the server sends them
  - pinch-zoom on Android

## Known quirks

- Reports created offline get the server's timestamp from when they were actually sent. The API doesn't accept a creation date.
