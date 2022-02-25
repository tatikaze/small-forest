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
    created_unix: scaned_at.getTime(),
    created_at: scaned_at.toUTCString(),
    device_name: device_name,
    temperature: temperature,
    humidity: humidity,
  };
  const params: PutCommandInput = {
    TableName: table_name,
    Item: condition,
  };
  try {
    return await ddbClient.send(new PutCommand(params));
  } catch (e) {
    // FIXME: handle
    console.log(e);
    return;
  }
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
      ":s": date_range.start_date.getTime(),
      ":e": date_range.end_date.getTime(),
      ":dn": device_name,
    },
    KeyConditionExpression:
      "device_name = :dn and created_unix between :s and :e",
  };

  try {
    const data: QueryCommandOutput = await ddbClient.send(
      new QueryCommand(params)
    );
    return data.Items as Condition[];
  } catch (e) {
    throw e;
  }
};
export const findNowConditionByName = async (
  device_name: string
): Promise<Condition | null> => {
  const params: QueryCommandInput = {
    TableName: table_name,
    ExpressionAttributeValues: {
      ":dn": device_name,
    },
    KeyConditionExpression: "device_name = :dn",
    ScanIndexForward: false,
    Limit: 1,
  };

  try {
    const data: QueryCommandOutput = await ddbClient.send(
      new QueryCommand(params)
    );
    if (data.Items === undefined) return null;
    return (data.Items[0] as Condition) ?? null;
  } catch (e) {
    console.log(e);
    // FIXME: handle
    return null;
  }
};
