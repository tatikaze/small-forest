import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { zonedTimeToUtc } from "date-fns-tz";

import {
  findConditionByNameAndDateRange,
  findNowConditionByName,
} from "~/lib/models/conditions";

const DeviceConditionHandler = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  switch (req.method) {
    case "GET":
      // FIXME: validate
      const validator = z.object({
        start_date: z.string(),
        end_date: z.string(),
        device_name: z.string(),
      });

      try {
        const is_safe = validator.parse({
          start_date: req.query.start_date,
          end_date: req.query.end_date,
          device_name: req.query.device,
        });
      } catch (e) {
        return res.status(400).json({ message: "Bad Request" });
      }

      const start_date = req.query.start_date;
      const end_date = req.query.end_date;
      const device_name = req.query.device;

      try {
        const conditions = await findConditionByNameAndDateRange(
          device_name as string,
          {
            start_date: zonedTimeToUtc(start_date as string, "Asia/Tokyo"),
            end_date: zonedTimeToUtc(end_date as string, "Asia/Tokyo"),
          }
        );
        const now = await findNowConditionByName(device_name as string);
        return res.json({ conditions: conditions, now: now });
      } catch (e) {
        console.log(e);
        return res.status(400).json({ message: "Unknown Error" });
      }
  }
};

export default DeviceConditionHandler;
