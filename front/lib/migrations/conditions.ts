// Import required AWS SDK clients and commands for Node.js
import { CreateTableCommand, CreateTableInput } from "@aws-sdk/client-dynamodb";
import { ddbClient } from "~/lib/dynamodb";

const params: CreateTableInput = {
  TableName: "conditions",
  AttributeDefinitions: [
    { AttributeName: "device_name", AttributeType: "S" }, // number
    { AttributeName: "created_unix", AttributeType: "N" }, // number
  ],
  KeySchema: [
    { AttributeName: "device_name", KeyType: "HASH" }, // Partition key
    { AttributeName: "created_unix", KeyType: "RANGE" }, // Sort key
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 10,
    WriteCapacityUnits: 10,
  },
};

export const run = async () => {
  try {
    await ddbClient.send(new CreateTableCommand(params));
  } catch (e) {
    console.log(e);
  }
};

run();
