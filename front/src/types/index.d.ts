export type Condition = {
  device_name: string;
  temperature: number;
  humidity: number;
  created_at: string;
  created_unix: number;
};

export type ConditionHistoryResponse = {
  conditions: Condition[];
  now: Condition | null;
  range: { start_date: string; end_date: string; interval_minutes: number; aggregation: "raw" | "mean" };
};
