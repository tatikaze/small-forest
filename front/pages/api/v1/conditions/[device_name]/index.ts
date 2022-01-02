import type { NextApiRequest, NextApiResponse } from "next";
import { findConditionByNameAndDateRange } from "~/lib/models/conditions";

const DeviceConditionHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case "GET":
      const data = await findConditionByNameAndDateRange("raid", {
        start_date: new Date(),
        end_date: new Date(),
      });
      return res.json({ message: "success", data: data });
  }
};

export default DeviceConditionHandler;
