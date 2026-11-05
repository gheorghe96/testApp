import { getJson } from "./client";

export type Language = "ro" | "ru";

export type Category = {
  id: string;
  name: Record<Language, string>;
  icon: string;
};

export function fetchCategories(signal?: AbortSignal): Promise<Category[]> {
  return getJson<Category[]>("/categories", undefined, signal);
}
