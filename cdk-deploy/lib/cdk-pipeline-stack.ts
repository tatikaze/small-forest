import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import { HelloEcsStack } from "./cdk-deploy-stack";
import { App, Stage, Stack, StackProps, StageProps } from "aws-cdk-lib";
import { Artifact } from "aws-cdk-lib/aws-codepipeline";
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

    const sourceArtifact = new Artifact();

    const pipeline = new CodePipeline(this, "Pipeline", {
      dockerCredentials: [DockerCredential.ecr([repo])],
      synth: new ShellStep("Synth", {
        //
        input: CodePipelineSource.connection(
          "tatikaze/small-forest",
          "master",
          {
            connectionArn:
              "arn:aws:codestar-connections:ap-northeast-1:392453725290:connection/77e1f86d-9d3f-48d7-85be-052b0f6f5502",
          }
        ),
        // TODO: generate cdk.out directory files
        commands: [
          "cd cdk-deploy",
          "yarn --frozen-lockfile",
          "npx cdk synth",
          "echo ${CODEBUILD_RESOLVED_SOURCE_VERSION}",
        ],
        primaryOutputDirectory: "cdk-deploy/cdk.out",
      }),
    });

    // ECRに新しいタグのイメージを追加
    pipeline.addWave("ECRImageUpdate", {
      post: [
        new CodeBuildStep("buildstep", {
          buildEnvironment: {
            privileged: true,
          },
          env: {
            AWS_ACCOUNT_ID: this.node.tryGetContext("account_id"),
            IMAGE_REPO_NAME: this.node.tryGetContext("application_image_name"),
          },
          commands: [
            "aws ecr get-login-password | docker login --username AWS --password-stdin https://$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com",
            "echo Build started on `date`",
            "echo Building the Docker image...",
            "echo $IMAGE_REPO_NAME",
            "echo $CODEBUILD_RESOLVED_SOURCE_VERSION",
            "ls",
            "docker build -t $IMAGE_REPO_NAME ./front/",
            "export IMAGE_ID=$(docker images | awk '{print $3}' | awk 'NR==2')",
            "docker tag $IMAGE_REPO_NAME:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$CODEBUILD_RESOLVED_SOURCE_VERSION",
            "echo Build completed on `date`",
            "echo Pushing the Docker image...",
            "docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$CODEBUILD_RESOLVED_SOURCE_VERSION",
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
