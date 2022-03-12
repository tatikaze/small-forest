/* eslint-disable @typescript-eslint/require-await */
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: "ap-northeast-1" });

export async function main(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  let json_data: string | null = null;

  try {
    const data = {
      device_name: "raid",
    };
    json_data = JSON.stringify(data);
  } catch (e) {
    return {
      body: JSON.stringify({ message: "Unexpected Error" }),
      statusCode: 500,
    };
  }

  try {
    const put_res = await s3.send(
      new PutObjectCommand({
        Bucket: "smafore-weekly-report-registry",
        Key: "test.json",
        Body: json_data,
      })
    );

    return {
      body: JSON.stringify({ message: "Successful lambda invocation" }),
      statusCode: 200,
    };
  } catch (e) {
    return {
      body: JSON.stringify({ message: "Unexpected Error" }),
      statusCode: 500,
    };
  }
}
