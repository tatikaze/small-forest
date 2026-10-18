import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aggregateConditions, DAY_MS, intervalMinutes, parseConditionDate, rangeError } from "~/lib/condition-range";
import { cachedConditionData, HistoryBusyError } from "~/lib/condition-cache";
import { findConditionByNameAndDateRange, findNowConditionByName, HistoryLimitError, type ReadBudget } from "~/lib/models/conditions";
import type { Condition, ConditionHistoryResponse } from "~/types";

const querySchema = z.object({
  device: z.string().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/),
  start_date: z.string(),
  end_date: z.string(),
  include_now: z.enum(["true", "false"]).default("true"),
});

export async function conditionHistoryGET(req: NextRequest, { params }: { params: Promise<{ device: string }> }) {
  const { device } = await params;
  const parsed = querySchema.safeParse({
    device,
    start_date: req.nextUrl.searchParams.get("start_date"),
    end_date: req.nextUrl.searchParams.get("end_date"),
    include_now: req.nextUrl.searchParams.get("include_now") ?? undefined,
  });
  const headers = { "Cache-Control": "no-store" };
  if (!parsed.success) return NextResponse.json({ message: "期間の指定が正しくありません。" }, { status: 400, headers });
  const start = parseConditionDate(parsed.data.start_date);
  const end = parseConditionDate(parsed.data.end_date);
  const now = Date.now();
  const error = rangeError(start, end, now);
  if (error) return NextResponse.json({ message: error }, { status: 400, headers });
  try {
    const budget: ReadBudget = { pages: 40, items: 10_000, deadline: now + 30_000 };
    const conditions: Condition[] = [];
    // Sequential UTC-day queries reuse cached data across overlapping custom ranges.
    for (let day = Math.floor(start / DAY_MS) * DAY_MS; day <= end; day += DAY_MS) {
      if (Date.now() >= budget.deadline) throw new HistoryBusyError();
      const rows = await cachedConditionData(
        `conditions:v1:${device}:day:${day}`,
        day + DAY_MS < now - 2 * DAY_MS ? 86_400 : 300,
        () => findConditionByNameAndDateRange(device, {
          start_date: new Date(day),
          end_date: new Date(Math.min(day + DAY_MS - 1, now)),
        }, budget),
      );
      conditions.push(...rows.filter(row => row.created_unix >= start && row.created_unix <= end));
      if (conditions.length > 10_000) throw new HistoryLimitError();
    }
    const minutes = intervalMinutes(start, end);
    const points = aggregateConditions(conditions, minutes);
    if (points.length > 2000) throw new HistoryLimitError();
    const latest = parsed.data.include_now === "true"
      ? await cachedConditionData(`conditions:v1:${device}:latest`, 60, () => findNowConditionByName(device))
      : null;
    const body: ConditionHistoryResponse = {
      conditions: points,
      now: latest,
      range: { start_date: new Date(start).toISOString(), end_date: new Date(end).toISOString(), interval_minutes: minutes, aggregation: minutes ? "mean" : "raw" },
    };
    return NextResponse.json(body, { headers });
  } catch (error) {
    if (error instanceof HistoryLimitError) {
      return NextResponse.json({ message: "データ量が上限を超えました。表示期間を短くしてください。" }, { status: 422, headers });
    }
    if (error instanceof HistoryBusyError) {
      return NextResponse.json({ message: "データを準備中です。少し待って再試行してください。" }, { status: 503, headers: { ...headers, "Retry-After": "5" } });
    }
    console.error("Condition history query failed", error);
    return NextResponse.json({ message: "データを取得できませんでした。時間をおいて再試行してください。" }, { status: 503, headers: { ...headers, "Retry-After": "5" } });
  }
}
