import { fetchCategories } from "@/api/categories";
import { ApiError, retryDelay, shouldRetry } from "@/api/client";
import { useTranslation } from "@/i18n";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

export function useCategories() {
  const query = useQuery({
    queryKey: ["categories"],
    queryFn: ({ signal }) => fetchCategories(signal),
    // Effectively static; once per launch is plenty
    staleTime: Infinity,
    retry: shouldRetry,
    retryDelay,
  });

  return {
    ...query,
    categories: query.data ?? [],
    error: query.error as ApiError | null,
  };
}

/** Falls back to the raw id while loading, or if the category is gone. */
export function useCategoryName() {
  const { categories } = useCategories();
  const { lang } = useTranslation();
  return useCallback(
    (id: string) => categories.find((c) => c.id === id)?.name[lang] ?? id,
    [categories, lang],
  );
}
