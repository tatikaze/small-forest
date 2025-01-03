"use client";
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

const useDateRange = () => {
  const startDate = useMemo(() => {
    const date = new Date();
    date.setHours(date.getHours() - 2);
    return date;
  }, []);
  const endDate = useMemo(() => {
    return new Date();
  }, []);

  const start_date_str = useMemo(
    () => getRequestDateStr(startDate),
    [startDate],
  );
  const endDateStr = useMemo(() => getRequestDateStr(endDate), [endDate]);

  return {
    start: {
      date: startDate,
      str: start_date_str,
    },
    end: {
      date: endDate,
      str: endDateStr,
    },
  };
};

export const useDeviceCondition = (): UseDeviceCondition => {
  const { start, end } = useDateRange();
  const DEFAULT_DEVICE_ID = "reid";

  const { data, error, mutate, isValidating } = useAspidaSWR(
    apiClient.v1._device(DEFAULT_DEVICE_ID).conditions,
    {
      query: {
        start_date: start.str,
        end_date: end.str,
      },
    },
  );

  const revalidating: boolean = useMemo(() => {
    return !(!data && !error) && isValidating;
  }, [data, isValidating, error]);

  return {
    conditions: data?.conditions ?? undefined,
    now: data?.now ?? undefined,
    loading: !data && !error,
    error,
    mutate,
    revalidating,
  };
};
