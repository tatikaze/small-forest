import type { NextApiRequest, NextApiResponse } from "next";
import { findConditionByNameAndDateRange } from "~/lib/models/conditions";

const DeviceConditionHandler = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  switch (req.method) {
    case "GET":
      // FIXME: validate
      const start_date = req.query.start_date;
      const end_date = req.query.end_date;
      const device_name = req.query.device_name;
      const data = await findConditionByNameAndDateRange(
        device_name as string,
        {
          start_date: new Date(start_date as string),
          end_date: new Date(end_date as string),
        }
      );
      return res.json({ message: "success", data: data });
  }
};

export default DeviceConditionHandler;
