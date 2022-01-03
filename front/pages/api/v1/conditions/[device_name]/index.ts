import type { NextApiRequest, NextApiResponse } from "next";
import { findConditionByNameAndDateRange } from "~/lib/models/conditions";

const DeviceConditionHandler = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  switch (req.method) {
    case "GET":
      const start_date = req.body.start_date;
      const end_date = req.body.end_date;
      const data = await findConditionByNameAndDateRange("raid", {
        start_date: new Date(start_date),
        end_date: new Date(end_date),
      });
      return res.json({ message: "success", data: data });
  }
};

export default DeviceConditionHandler;
