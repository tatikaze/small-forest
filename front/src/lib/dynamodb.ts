import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const marshallOptions = {
  // Whether to automatically convert empty strings, blobs, and sets to `null`.
  convertEmptyValues: false, // false, by default.
  // Whether to remove undefined values while marshalling.
  removeUndefinedValues: false, // false, by default.
  // Whether to convert typeof object to map attribute.
  convertClassInstanceToMap: false, // false, by default.
};

const unmarshallOptions = {
  // Whether to return numbers as a string instead of converting them to native JavaScript numbers.
  wrapNumbers: false, // false, by default.
};

const translateConfig = { marshallOptions, unmarshallOptions };

export const ddbClient = new DynamoDBClient({
  region: "ap-northeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_APP_KEY as string,
    secretAccessKey: process.env.AWS_SECRET_APP_KEY as string,
  },
});
export const ddbDocClient = DynamoDBDocumentClient.from(
  ddbClient,
  translateConfig
);