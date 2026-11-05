import { ApiError } from "@/api/client";
import { translate, type Translate } from "@/i18n";
import { errorText } from "@/i18n/errors";
import { ro } from "@/i18n/ro";
import { ru } from "@/i18n/ru";

jest.mock("expo-sqlite/kv-store", () => ({
  __esModule: true,
  default: { getItemSync: () => null, setItemSync: () => {} },
}));

const placeholders = (s: string) =>
  [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("translations", () => {
  it("Russian has every key, with the same {placeholders} as Romanian", () => {
    // Missing keys fail tsc; mismatched placeholders only show up here
    for (const key of Object.keys(ro) as (keyof typeof ro)[]) {
      expect(ru[key]).toBeTruthy();
      expect({ key, p: placeholders(ru[key]) }).toEqual({
        key,
        p: placeholders(ro[key]),
      });
    }
  });

  it("fills in placeholders", () => {
    expect(translate("list.emptySearch", { query: "apă" }, "ro")).toBe(
      "Nicio sesizare pentru „apă”",
    );
    expect(translate("photos.count", { count: 1, max: 3 }, "ru")).toBe(
      "Фото: 1 из 3 (необязательно)",
    );
  });
});

describe("errorText", () => {
  const tRo: Translate = (k, p) => translate(k, p, "ro");
  const tRu: Translate = (k, p) => translate(k, p, "ru");

  it("turns every API error code into text in the chosen language", () => {
    const codes = [
      "VALIDATION_FAILED",
      "FILE_TOO_LARGE",
      "UNSUPPORTED_FILE_TYPE",
      "REPORT_NOT_FOUND",
      "CATEGORY_NOT_FOUND",
      "IDEMPOTENCY_KEY_REUSED",
      "RATE_LIMITED",
      "INTERNAL_ERROR",
      "SERVICE_UNAVAILABLE",
    ];
    for (const code of codes) {
      const text = errorText(tRu, new ApiError(400, code));
      expect(text).not.toMatch(/^error\./);
      expect(text).not.toBe(tRu("error.UNKNOWN"));
    }
  });

  it("names the rejected fields for VALIDATION_FAILED", () => {
    expect(
      errorText(tRo, new ApiError(400, "VALIDATION_FAILED", ["title"])),
    ).toBe("Date incorecte: title");
  });

  it("translates a stored error (outbox) and falls back for unknown codes", () => {
    expect(errorText(tRu, { code: "NETWORK", status: 0 })).toBe(
      "Нет связи с сервером.",
    );
    expect(errorText(tRo, new ApiError(418, "SOMETHING_NEW"))).toBe(
      "Cererea a eșuat (HTTP 418).",
    );
  });
});
