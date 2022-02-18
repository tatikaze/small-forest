import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import { HelloEcsStack } from "./cdk-deploy-stack";
import { App, Stage, Stack, StackProps, StageProps } from "aws-cdk-lib";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
  CodeBuildStep,
  DockerCredential,
} from "aws-cdk-lib/pipelines";

import { DockerImageBuildStage } from "./cdk-docker-build-stage";

/**
 * パイプラインを定義するStack
 */
export class MyPipelineStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    // TODO: ssmにcommitIDを登録
    // $(git rev-parse --short HEAD)
    const repo = ecr.Repository.fromRepositoryName(
      this,
      "repo",
      this.node.tryGetContext("application_image_name")
    );

    const pipeline = new CodePipeline(this, "Pipeline", {
      dockerCredentials: [DockerCredential.ecr([repo])],
      synth: new ShellStep("Synth", {
        //
        input: CodePipelineSource.connection(
          "tatikaze/small-forest",
          "master",
          {
            //connectionArn: process.env.SOURCE_ARN as string,
            connectionArn:
              "arn:aws:codestar-connections:ap-northeast-1:392453725290:connection/77e1f86d-9d3f-48d7-85be-052b0f6f5502",
          }
        ),
        env: {
          AWS_ACCOUNT_ID: this.node.tryGetContext("account_id"),
        },
        // TODO: pipeline initialize
        commands: [
          "echo ${CODEBUILD_RESOLVED_SOURCE_VERSION}",
          "export TAG=${CODEBUILD_RESOLVED_SOURCE_VERSION}",
        ],
        primaryOutputDirectory: "cdk-deploy/cdk.out",
      }),
    });

    // ECRに新しいタグのイメージを追加
    pipeline.addWave("ECR-image-update", {
      pre: [
        //new ShellStep("ecr-connect", {
        //  commands: [
        //    "echo Logging in to Amazon ECR...",
        //    "$(aws ecr get-login-password | docker login --username AWS --password-stdin https://$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com)",
        //    "export TAG=${CODEBUILD_RESOLVED_SOURCE_VERSION}",
        //  ],
        //}),
        new CodeBuildStep("buildstep", {
          commands: [
            "echo Build started on `date`",
            "echo Building the Docker image...",
            "docker build -t $IMAGE_REPO_NAME .",
            "docker tag $IMAGE_REPO_NAME:$TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$TAG",
          ],
        }),
      ],
      post: [
        new ShellStep("ecr-post", {
          commands: [
            "echo Build completed on `date`",
            "echo Pushing the Docker image...",
            "docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$TAG",
          ],
        }),
      ],
    });

    // TODO: ssmでcommitIDをpropsとして渡す
    //pipeline.addStage(new MyApplication(scope, "Prod", {}));
  }
}

/*
 * `Stage`をextendsして`MyApplication`を定義します。
 * `MyApplication`は1つ以上のStackで構成されます。
 */
class MyApplication extends Stage {
  constructor(scope: App, id: string, props?: StageProps) {
    super(scope, id, props);

    new HelloEcsStack(scope, "app-stack");
  }
}
