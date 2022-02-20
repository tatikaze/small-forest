import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import * as r53 from "aws-cdk-lib/aws-route53";
import * as elb from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecsp from "aws-cdk-lib/aws-ecs-patterns";

/*
 * `Stage`をextendsして`MyApplication`を定義します。
 * `MyApplication`は1つ以上のStackで構成されます。
 */
export class Application extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    new HelloEcsStack(this, "app-stack");
  }
}

export class HelloEcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const domainZone = r53.HostedZone.fromHostedZoneAttributes(this, "Zone", {
      zoneName: this.node.tryGetContext("zone_name"),
      hostedZoneId: this.node.tryGetContext("hosted_zone_id"),
    });

    const domainName = this.node.tryGetContext("domain_name");

    const certificate = new acm.Certificate(this, "Certificate", {
      domainName: domainName,
      validation: acm.CertificateValidation.fromDns(domainZone),
    });

    const taskRole = new iam.Role(this, `ecs-taskRole-${this.stackName}`, {
      roleName: `ecs-taskRole-${this.stackName}`,
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });

    taskRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ["*"],
        actions: ["dynamodb:*"],
      })
    );

    new ecsp.ApplicationLoadBalancedFargateService(this, "MyWebServer", {
      taskImageOptions: {
        image: ecs.ContainerImage.fromEcrRepository(
          ecr.Repository.fromRepositoryName(
            this,
            "repo",
            this.node.tryGetContext("application_image_name")
          ),
          process.env.CODEBUILD_RESOLVED_SOURCE_VERSION
        ),
        containerPort: 80,
        taskRole: taskRole,
      },
      certificate,
      sslPolicy: elb.SslPolicy.RECOMMENDED,
      domainName: domainName,
      domainZone,
      redirectHTTP: true,
      publicLoadBalancer: true,
      listenerPort: 443,
    });
  }
}
