import { ApiError, retryDelay, shouldRetry } from "@/api/client";
import { fetchReport, type Report, type ReportsPage } from "@/api/reports";
import {
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";

export function useReport(id: string | undefined) {
  const queryClient = useQueryClient();

  // Generics spelled out: with a placeholderData function TS infers TData wrong
  const query = useQuery<Report, Error, Report, (string | undefined)[]>({
    queryKey: ["report", id],
    queryFn: ({ signal }) => fetchReport(id!, signal),
    enabled: !!id,
    retry: shouldRetry,
    retryDelay,
    // Coming from the list we already have the report, so show it while the
    // fresh copy loads. A deep link has nothing cached and gets a spinner.
    placeholderData: () => findInLists(queryClient, id),
  });

  return { ...query, error: query.error as ApiError | null };
}

function findInLists(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string | undefined,
): Report | undefined {
  if (!id) return undefined;
  const lists = queryClient.getQueriesData<InfiniteData<ReportsPage>>({
    queryKey: ["reports"],
  });
  for (const [, data] of lists) {
    for (const page of data?.pages ?? []) {
      const hit = page.items.find((r) => r.id === id);
      if (hit) return hit;
    }
  }
  return undefined;
}
