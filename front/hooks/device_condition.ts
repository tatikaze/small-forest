import { useMemo } from "react";
import useAspidaSWR from "@aspida/swr";
import { apiClient } from "~/lib/apiClient";

import type { Condition } from "~/types";
import { getRequestDateStr } from "~/lib/format";

type UseDeviceCondition = {
  conditions: Condition[] | undefined;
  now: Condition | undefined;
  loading: boolean;
  error: any;
  mutate: () => void;
  revalidating: boolean;
};

export const useDeviceCondition = (): UseDeviceCondition => {
  const start_date = new Date();
  const end_date = new Date();
  start_date.setHours(start_date.getHours() - 2);
  const start_date_str = useMemo(() => getRequestDateStr(start_date), [
    start_date,
  ]);
  const end_date_str = useMemo(() => getRequestDateStr(end_date), [end_date]);

  const { data, error, mutate, isValidating } = useAspidaSWR(
    apiClient.v1.device.conditions,
    {
      query: {
        start_date: start_date_str,
        end_date: end_date_str,
        device: "raid",
      },
    }
  );

  const revalidating: boolean = useMemo(() => {
    return !(!data && !error) && isValidating;
  }, [data, isValidating]);

  return {
    conditions: data?.conditions ?? undefined,
    now: data?.now ?? undefined,
    loading: !data && !error,
    error,
    mutate,
    revalidating,
  };
};
