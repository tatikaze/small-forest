import {
  PutCommand,
  PutCommandInput,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "~/lib/dynamodb";
import type { Condition } from "~/types";

export class HistoryLimitError extends Error {}
export type ReadBudget = { pages: number; items: number; deadline: number };

const table_name = "conditions";

export const createCondition = async (
  device_name: string,
  scaned_at: Date,
  temperature: number,
  humidity: number,
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
    return await ddbDocClient.send(new PutCommand(params));
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
  date_range: DateRange,
  budget: ReadBudget = { pages: 40, items: 10_000, deadline: Date.now() + 30_000 },
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

  const items: Condition[] = [];
  do {
    if (budget.pages <= 0 || budget.items <= 0 || items.length >= 2000) throw new HistoryLimitError();
    const remaining = budget.deadline - Date.now();
    if (remaining <= 0) throw new HistoryLimitError();
    const data: QueryCommandOutput = await ddbDocClient.send(
      new QueryCommand({ ...params, Limit: Math.min(500, budget.items, 2000 - items.length) }),
      { abortSignal: AbortSignal.timeout(Math.min(8000, remaining)) },
    );
    budget.pages--;
    budget.items -= data.ScannedCount ?? data.Items?.length ?? 0;
    items.push(...(data.Items ?? []) as Condition[]);
    params.ExclusiveStartKey = data.LastEvaluatedKey;
  } while (params.ExclusiveStartKey);
  return items;
};
export const findNowConditionByName = async (
  device_name: string,
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

  const data: QueryCommandOutput = await ddbDocClient.send(
    new QueryCommand(params),
    { abortSignal: AbortSignal.timeout(8000) },
  );
  return (data.Items?.[0] as Condition) ?? null;
};
