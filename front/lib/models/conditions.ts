import {
  PutCommand,
  PutCommandInput,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { ddbClient } from "~/lib/dynamodb";

type Condition = {
  created_unix: number;
  device_name: string;
  temperature: number;
  humidity: number;
  created_at: string;
};

const table_name = "conditions";

export const createCondition = async (
  device_name: string,
  scaned_at: Date,
  temperature: number,
  humidity: number
) => {
  const condition: Condition = {
    created_unix: 100000,
    created_at: scaned_at.toString(),
    device_name: device_name,
    temperature: temperature,
    humidity: humidity,
  };
  const params: PutCommandInput = {
    TableName: table_name,
    Item: condition,
  };
  return await ddbClient.send(new PutCommand(params));
};

type DateRange = {
  start_date: Date;
  end_date: Date;
};

export const findConditionByNameAndDateRange = async (
  device_name: string,
  date_range: DateRange
): Promise<Condition[]> => {
  const params: QueryCommandInput = {
    TableName: table_name,
    ExpressionAttributeValues: {
      ":s": 10000,
      ":e": 100000000,
      ":dn": device_name,
    },
    KeyConditionExpression:
      "device_name = :dn and created_unix between :s and :e",
  };

  const data: QueryCommandOutput = await ddbClient.send(new QueryCommand(params));
  return data.Items as Condition[];
};
