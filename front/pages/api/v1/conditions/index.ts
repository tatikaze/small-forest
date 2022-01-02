import AWS from "aws-sdk";
import type { NextApiRequest, NextApiResponse } from "next";
import { createCondition } from "~/lib/models/conditions";

const ConditionHandler = (req: NextApiRequest, res: NextApiResponse) => {
  const documentClient = new AWS.DynamoDB.DocumentClient({
    region: "ap-northeast-1",
  });

  switch (req.method) {
    case "GET":
      return;
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
