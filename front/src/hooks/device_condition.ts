"use client";
import useSWR from "swr";
import { apiClient } from "~/lib/apiClient";

export type ConditionPeriod = { hours: number } | { start: string; end: string };

export const useDeviceCondition = (period: ConditionPeriod = { hours: 2 }, includeNow = true) => {
  const relative = "hours" in period;
  const start = relative ? period.hours : period.start;
  const end = relative ? null : period.end;
  const { data, error, mutate, isValidating, isLoading } = useSWR(
    ["conditions", "reid", start, end, includeNow],
    async () => {
      // Recompute on every poll/manual refresh so the live window actually advances.
      const now = Math.floor(Date.now() / 60_000) * 60_000;
      return apiClient.v1._device("reid").conditions.$get({
        query: {
          start_date: relative ? new Date(now - period.hours * 3_600_000).toISOString() : period.start,
          end_date: relative ? new Date(now).toISOString() : period.end,
          include_now: includeNow,
        },
      });
    },
    {
      refreshInterval: relative ? 300_000 : 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30_000,
      shouldRetryOnError: false,
    },
  );
  return {
    conditions: data?.conditions,
    now: data?.now ?? undefined,
    range: data?.range,
    loading: isLoading,
    error,
    mutate,
    revalidating: !isLoading && isValidating,
  };
};
