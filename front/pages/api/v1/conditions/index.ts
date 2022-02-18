import type { NextApiRequest, NextApiResponse } from "next";
import { createCondition } from "~/lib/models/conditions";

const ConditionHandler = (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case "GET":
      return res.status(400).json({ message: "unknown methods" });
    case "POST":
      const date = new Date();
      createCondition(
        req.body.id,
        date,
        req.body.temperature,
        req.body.humidity
      );
      return res.json({ message: "success" });
  }
};

export default ConditionHandler;
