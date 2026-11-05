import Storage from "expo-sqlite/kv-store";
import { useCallback, useSyncExternalStore } from "react";

import { ro, type TranslationKey } from "./ro";
import { ru } from "./ru";

export type { TranslationKey } from "./ro";

export type Language = "ro" | "ru";

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: "ro", label: "Română" },
  { code: "ru", label: "Русский" },
];

const dictionaries: Record<Language, Record<TranslationKey, string>> = {
  ro,
  ru,
};

const LOCALES: Record<Language, string> = { ro: "ro-RO", ru: "ru-RU" };

const KEY = "language";

// No saved choice yet: Russian phones get ru, everyone else ro
function deviceLanguage(): Language {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    return locale.toLowerCase().startsWith("ru") ? "ru" : "ro";
  } catch {
    return "ro";
  }
}

function load(): Language {
  try {
    const saved = Storage.getItemSync(KEY);
    if (saved === "ro" || saved === "ru") return saved;
  } catch {}
  return deviceLanguage();
}

let current: Language | undefined;
const listeners = new Set<() => void>();

const getLanguage = (): Language => (current ??= load());

export function setLanguage(lang: Language) {
  current = lang;
  try {
    Storage.setItemSync(KEY, lang);
  } catch {
    // Not fatal, the switch still applies for this session
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export type TranslateParams = Record<string, string | number>;

/** For code outside components. */
export function translate(
  key: TranslationKey,
  params?: TranslateParams,
  lang: Language = getLanguage(),
): string {
  const text = dictionaries[lang][key] ?? ro[key] ?? key;
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export type Translate = (
  key: TranslationKey,
  params?: TranslateParams,
) => string;

/** Re-renders the component when the language changes. */
export function useTranslation() {
  const lang = useSyncExternalStore(subscribe, getLanguage, getLanguage);
  const t: Translate = useCallback(
    (key, params) => translate(key, params, lang),
    [lang],
  );
  return { t, lang, locale: LOCALES[lang] };
}
