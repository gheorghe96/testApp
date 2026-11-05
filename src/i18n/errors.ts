import { ApiError, AppError } from "@/api/client";

import type { Translate, TranslationKey } from "./index";
import { ro } from "./ro";

// What we persist instead of a message (e.g. on outbox items), so a saved
// error is still shown in whatever language is selected later
export type ErrorInfo = {
  code: string;
  fields?: string[];
  status?: number;
};

export function toErrorInfo(e: unknown): ErrorInfo {
  if (e instanceof ApiError) {
    return { code: e.code ?? "HTTP", fields: e.fields, status: e.status };
  }
  if (e instanceof AppError) return { code: e.code };
  return { code: "UNKNOWN" };
}

const isKey = (key: string): key is TranslationKey => key in ro;

export function errorText(t: Translate, error: unknown): string {
  const info: ErrorInfo =
    error &&
    typeof error === "object" &&
    "code" in error &&
    !(error instanceof Error)
      ? (error as ErrorInfo)
      : toErrorInfo(error);

  if (info.code === "VALIDATION_FAILED") {
    return info.fields?.length
      ? t("error.VALIDATION_FAILED", { fields: info.fields.join(", ") })
      : t("error.VALIDATION_FAILED_unknown");
  }

  const key = `error.${info.code}`;
  if (isKey(key)) return t(key);
  // A code we don't know yet: at least show the status
  if (info.status) return t("error.HTTP", { status: info.status });
  return t("error.UNKNOWN");
}
