import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { zonedTimeToUtc } from "date-fns-tz";

import {
  findConditionByNameAndDateRange,
  findNowConditionByName,
} from "~/lib/models/conditions";

export const GET = async (
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ device: string }>;
  },
) => {
  const { device } = await params;
  const searchParams = req.nextUrl.searchParams;
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");

  const validator = z.object({
    start_date: z.string(),
    end_date: z.string(),
    device_name: z.string(),
  });

  const validateResult = validator.safeParse({
    start_date: startDate,
    end_date: endDate,
    device_name: device,
  });
  if (!validateResult.success) {
    return NextResponse.json(
      { message: "Bad Request" },
      {
        status: 400,
      },
    );
  }

  const { start_date, end_date, device_name } = validateResult.data;

  try {
    const conditions = await findConditionByNameAndDateRange(
      device_name as string,
      {
        start_date: zonedTimeToUtc(start_date as string, "Asia/Tokyo"),
        end_date: zonedTimeToUtc(end_date as string, "Asia/Tokyo"),
      },
    );
    const now = await findNowConditionByName(device_name as string);
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
};
