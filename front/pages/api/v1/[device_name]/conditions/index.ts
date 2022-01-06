import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

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
          device_name: req.query.device_name,
        });
        console.log(is_safe);
      } catch (e) {
        return res.status(400).json({ message: "Bad Request" });
      }

      console.log(new Date(req.query.start_date as string).getTime());
      console.log(new Date(req.query.start_date as string));
      const start_date = req.query.start_date;
      const end_date = req.query.end_date;
      const device_name = req.query.device_name;
      const conditions = await findConditionByNameAndDateRange(
        device_name as string,
        {
          start_date: new Date(start_date as string),
          end_date: new Date(end_date as string),
        }
      );
      const now = await findNowConditionByName(device_name as string);
      return res.json({ conditions: conditions, now: now });
  }
};

export default DeviceConditionHandler;
