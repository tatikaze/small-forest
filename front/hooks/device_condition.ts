import { useMemo } from "react";
import useAspidaSWR from "@aspida/swr";
import { apiClient } from "~/lib/apiClient";

import type { Condition } from "~/types";
import { getRequestDateStr, getUTCDate } from "~/lib/format";

type UseDeviceCondition = {
  conditions: Condition[] | undefined;
  now: Condition | undefined;
  loading: boolean;
  error: any;
};

export const useDeviceCondition = (): UseDeviceCondition => {
  const start_date = new Date();
  const end_date = new Date();
  start_date.setHours(start_date.getHours() - 2);
  const start_date_str = useMemo(() => getRequestDateStr(start_date), [
    start_date,
  ]);
  const end_date_str = useMemo(() => getRequestDateStr(end_date), [end_date]);
  console.log(start_date);
  console.log(end_date);

  const { data, error } = useAspidaSWR(
    apiClient.v1._deviceName("reid").conditions,
    {
      query: { start_date: start_date_str, end_date: end_date_str },
    }
  );

  return {
    conditions: data?.conditions ?? undefined,
    now: data?.now ?? undefined,
    loading: !data && !error,
    error,
  };
};
