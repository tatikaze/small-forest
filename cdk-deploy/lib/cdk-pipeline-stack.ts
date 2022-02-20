import * as ecr from "aws-cdk-lib/aws-ecr";
import { Application } from "./cdk-deploy-stack";
import { App, Stack, StackProps } from "aws-cdk-lib";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
  CodeBuildStep,
  DockerCredential,
} from "aws-cdk-lib/pipelines";
import * as iam from "aws-cdk-lib/aws-iam";

/**
 * パイプラインを定義するStack
 */
export class MyPipelineStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const repo = ecr.Repository.fromRepositoryName(
      this,
      "repo",
      this.node.tryGetContext("application_image_name")
    );

    const pipeline = new CodePipeline(this, "Pipeline", {
      dockerCredentials: [DockerCredential.ecr([repo])],
      synth: new ShellStep("Synth", {
        input: CodePipelineSource.connection(
          this.node.tryGetContext("github_repo"),
          "master",
          {
            connectionArn: this.node.tryGetContext("github_connect_arn"),
          }
        ),
        // generate cdk.out directory files
        commands: [
          "cd cdk-deploy",
          "yarn --frozen-lockfile",
          "npx cdk synth",
          "echo ${CODEBUILD_RESOLVED_SOURCE_VERSION}",
        ],
        primaryOutputDirectory: "cdk-deploy/cdk.out",
      }),
    });

    const imageBuildRole = new iam.Role(
      this,
      `ecr-imageDeployRole-${this.stackName}`,
      {
        roleName: `ecr-imageDeployRole-${this.stackName}`,
        assumedBy: new iam.ServicePrincipal("codebuild.amazonaws.com"),
      }
    );

    imageBuildRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ["*"],
        actions: ["ecr:*"],
      })
    );

    // ECRに新しいタグのイメージを追加
    pipeline.addWave("ECRImageUpdate", {
      post: [
        new CodeBuildStep("buildstep", {
          role: imageBuildRole,
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

    pipeline.addStage(new Application(scope, "EcsAppSmafore"));
  }
}
