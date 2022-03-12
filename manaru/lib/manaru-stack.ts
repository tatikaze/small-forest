import { Stack, StackProps, Duration } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime, Architecture } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as path from "path";

export class ManaruStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const weeklyReportRegistry = new s3.Bucket(
      this,
      "smafore-weekly-report-registry",
      {
        publicReadAccess: false,
        bucketName: "smafore-weekly-report-registry",
      }
    );

    const lambdaSmaforeWeeklyReport = new iam.Role(
      this,
      "smafore-lambda-weekly-report",
      {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        description: "smafore weekly report lambda execution role",
      }
    );

    lambdaSmaforeWeeklyReport.addManagedPolicy(
      iam.ManagedPolicy.fromManagedPolicyArn(
        this,
        "lambda-dynamodb-execution-role",
        "arn:aws:iam::aws:policy/service-role/AWSLambdaDynamoDBExecutionRole"
      )
    );

    lambdaSmaforeWeeklyReport.addToPolicy(
      new iam.PolicyStatement({
        actions: ["s3:PutObject"],
        effect: iam.Effect.ALLOW,
        resources: [weeklyReportRegistry.bucketArn + "*"],
      })
    );

    const weeklyReportLambdaTask = new NodejsFunction(
      this,
      "smafore-weekly-report-lambda",
      {
        memorySize: 1024,
        timeout: Duration.seconds(5),
        runtime: Runtime.NODEJS_14_X,
        architecture: Architecture.ARM_64,
        handler: "main",
        entry: path.join(__dirname, `/../src/weekly-report/index.ts`),
        bundling: {
          minify: true,
          externalModules: ["aws-sdk"],
        },
        role: lambdaSmaforeWeeklyReport,
      }
    );

    new events.Rule(this, "ManaruRule", {
      schedule: events.Schedule.cron({ minute: "0", hour: "16", day: "1W" }),
      targets: [
        new targets.LambdaFunction(weeklyReportLambdaTask, {
          retryAttempts: 3,
        }),
      ],
    });
  }
}
