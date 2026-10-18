import { z } from "zod";
import type { Condition } from "../types";

export const DAY_MS = 86_400_000;
export const MAX_RANGE_MS = 31 * DAY_MS;
export const PRESETS = [
  { hours: 2, label: "2時間" },
  { hours: 24, label: "24時間" },
  { hours: 168, label: "7日" },
  { hours: 744, label: "31日" },
] as const;

// Legacy offset-free input is explicitly interpreted as JST, independent of host TZ.
export function parseConditionDate(value: string): number {
  const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?$/.test(value)
    ? `${value}+09:00`
    : value;
  if (!z.string().datetime({ offset: true }).safeParse(normalized).success) return NaN;
  return Date.parse(normalized);
}

export function rangeError(start: number, end: number, now = Date.now()): string | null {
  if (!Number.isFinite(start) || !Number.isFinite(end)) return "有効な開始日時と終了日時を指定してください。";
  if (start >= end) return "終了日時は開始日時より後にしてください。";
  if (end - start > MAX_RANGE_MS) return "1回に表示できる期間は最大31日です。";
  if (end > now) return "未来の日時は指定できません。";
  return null;
}

export function intervalMinutes(start: number, end: number): number {
  const hours = (end - start) / 3_600_000;
  return hours <= 6 ? 0 : hours <= 24 ? 5 : hours <= 168 ? 30 : 120;
}

export function aggregateConditions(conditions: Condition[], minutes: number): Condition[] {
  if (!minutes) return conditions;
  const buckets = new Map<number, { sample: Condition; temperature: number; humidity: number; count: number }>();
  for (const condition of conditions) {
    const time = Math.floor(condition.created_unix / (minutes * 60_000)) * minutes * 60_000;
    const bucket = buckets.get(time) ?? { sample: condition, temperature: 0, humidity: 0, count: 0 };
    bucket.temperature += condition.temperature;
    bucket.humidity += condition.humidity;
    bucket.count++;
    buckets.set(time, bucket);
  }
  return Array.from(buckets.values(), ({ sample, temperature, humidity, count }) => ({
    ...sample,
    temperature: Math.round(temperature / count * 100) / 100,
    humidity: Math.round(humidity / count * 100) / 100,
  }));
}
