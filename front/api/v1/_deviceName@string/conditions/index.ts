import type { Condition } from "~/types";

export type Methods = {
  get: {
    query: {
      start_date: string;
      end_date: string;
    };
    resBody: { conditions: Condition[]; now: Condition };
  };
};
