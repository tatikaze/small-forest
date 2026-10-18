import type { ConditionHistoryResponse } from "~/types";

export type Methods = {
  get: {
    query: {
      start_date: string;
      end_date: string;
      include_now?: boolean;
    };
    resBody: ConditionHistoryResponse;
  };
};
