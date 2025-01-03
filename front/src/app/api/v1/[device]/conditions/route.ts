import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { zonedTimeToUtc } from "date-fns-tz";

import {
  findConditionByNameAndDateRange,
  findNowConditionByName,
} from "~/lib/models/conditions";

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ device: string }>;
  },
) {
  const { device } = await params;
  const searchParams = req.nextUrl.searchParams;
  const start_date = searchParams.get("start_date");
  const end_date = searchParams.get("end_date");
  console.log({ start_date, end_date, device });
  const validator = z.object({
    start_date: z.string(),
    end_date: z.string(),
    device_name: z.string(),
  });

  try {
    validator.parse({
      start_date: start_date,
      end_date: end_date,
      device_name: device,
    });
  } catch {
    return NextResponse.json(
      { message: "Bad Request" },
      {
        status: 400,
      },
    );
  }

  try {
    const conditions = await findConditionByNameAndDateRange(device as string, {
      start_date: zonedTimeToUtc(start_date as string, "Asia/Tokyo"),
      end_date: zonedTimeToUtc(end_date as string, "Asia/Tokyo"),
    });
    const now = await findNowConditionByName(device);
    return NextResponse.json({ conditions: conditions, now: now });
  } catch (e) {
    console.log(e);
    return NextResponse.json(
      { message: "Unknown Error" },
      {
        status: 400,
      },
    );
  }
}
