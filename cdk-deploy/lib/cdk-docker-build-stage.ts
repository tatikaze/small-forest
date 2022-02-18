import { Construct } from "constructs";
import { Stage, Stack, StageProps } from "aws-cdk-lib";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as iam from "aws-cdk-lib/aws-iam";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as pipeline_actions from "aws-cdk-lib/aws-codepipeline-actions";

export class DockerImageBuildStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);
    new DockerImageBuildStack(this, "buildStack", {});
  }
}

export class DockerImageBuildStack extends Stack {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const sourceOutput = new codepipeline.Artifact();

    const source = codebuild.Source.gitHub({
      owner: "tatikaze",
      repo: "small-forest",
      webhook: true,
      webhookFilters: [
        codebuild.FilterGroup.inEventOf(codebuild.EventAction.PUSH).andBranchIs(
          "master"
        ),
      ],
    });

    const build_action = new pipeline_actions.CodeStarConnectionsSourceAction({
      actionName: "Github_Source",
      owner: "tatikaze",
      repo: "small-forest",
      output: sourceOutput,
      connectionArn: process.env.SOURCE_ARN as string,
    });

    const buildRole = new iam.Role(this, `ecs-taskRole-${this.stackName}`, {
      roleName: `ecs-taskRole-${this.stackName}`,
      assumedBy: new iam.ServicePrincipal("codebuild.amazonaws.com"),
    });

    buildRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ["*"],
        actions: ["codebuild:*"],
      })
    );

    new codebuild.Project(this, "ImageBuildProject", {
      role: buildRole,
      source: source,
      environmentVariables: {
        IMAGE_REPO_NAME: {
          value: this.node.tryGetContext("application_image_name"),
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: 0.1,
        phases: {
          pre_build: {
            commands: [
              "echo Logging in to Amazon ECR...",
              "$(aws ecr get-login-password | docker login --username AWS --password-stdin https://$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com)",
              "export TAG=${CODEBUILD_RESOLVED_SOURCE_VERSION}",
            ],
          },
          build: {
            commands: [
              "echo Build started on `date`",
              "echo Building the Docker image...",
              "docker build -t $IMAGE_REPO_NAME .",
              "docker tag $IMAGE_REPO_NAME:$TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$TAG",
            ],
          },
          post_build: {
            commands: [
              "echo Build completed on `date`",
              "echo Pushing the Docker image...",
              "docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$TAG",
            ],
          },
        },
      }),
    });
  }
}
