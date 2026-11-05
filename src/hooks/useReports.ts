import { ApiError, retryDelay, shouldRetry } from "@/api/client";
import {
  fetchReports,
  type ReportFilters,
  type ReportsPage,
} from "@/api/reports";
import {
  keepPreviousData,
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { prefetchCoverPhotos } from "@/lib/image-cache";
import { useCallback, useMemo, useState } from "react";

export function useReports(filters: ReportFilters = {}) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ["reports", filters] as const, [filters]);

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam, signal }) => {
      const page = await fetchReports(filters, pageParam, { signal });
      // Get the photos downloading before the cards are on screen
      prefetchCoverPhotos(page.items);
      return page;
    },
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    retry: shouldRetry,
    retryDelay,
    // Keep the old results up while a new search loads, instead of
    // flashing a spinner
    placeholderData: keepPreviousData,
  });

  // Page-number pagination: a report created while scrolling shifts the
  // pages, and the same item comes back on the next one (the API docs warn
  // about this). Dedupe, or FlashList gets duplicate keys.
  const reports = useMemo(() => {
    const seen = new Set<string>();
    return (query.data?.pages ?? [])
      .flatMap((p) => p.items)
      .filter((r) => !seen.has(r.id) && seen.add(r.id));
  }, [query.data]);

  // A plain refetch() would reload every page scrolled so far. Trim to the
  // first page, then refetch that.
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { refetch } = query;
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    queryClient.setQueryData<InfiniteData<ReportsPage, number>>(
      queryKey,
      (data) =>
        data && {
          pages: data.pages.slice(0, 1),
          pageParams: data.pageParams.slice(0, 1),
        },
    );
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, queryKey, refetch]);

  return {
    ...query,
    reports,
    total: query.data?.pages[0]?.total ?? 0,
    error: query.error as ApiError | null,
    refresh,
    isRefreshing,
  };
}
