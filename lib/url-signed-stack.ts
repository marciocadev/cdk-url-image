import { NestedStack, NestedStackProps, RemovalPolicy } from "aws-cdk-lib";
import { AwsIntegration, LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Architecture } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { join } from "path";

export class UrlSignedStack extends NestedStack {
  public readonly getUrlSignedLambdaIntegration: LambdaIntegration;
  public readonly putIntegration: AwsIntegration;

  constructor(scope: Construct, id: string, props?: NestedStackProps) {
    super(scope, id, props)

    let bucket = new Bucket(this, "url-signed-bucket", {
      bucketName: "url-signed-marciocadev",
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    })

    let func = new NodejsFunction(this, "url-signed-function", {
      architecture: Architecture.ARM_64,
      entry: join(__dirname, "functions/index.ts"),
      handler: "handler",
      environment: {
        BUCKET_NAME: bucket.bucketName
      },
      initialPolicy: [
        new PolicyStatement({
          actions: ["s3:GetObject"],
          resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
        })
      ]
    })

    this.getUrlSignedLambdaIntegration = new LambdaIntegration(func)

    let role = new Role(this, "s3-role", {
      assumedBy: new ServicePrincipal("apigateway.amazonaws.com"),
      roleName: "s3-integration-files"
    })
    role.addToPolicy(
      new PolicyStatement({
        resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
        actions: ["s3:PutObject"]
      })
    )

    this.putIntegration = new AwsIntegration({
      service: "s3",
      integrationHttpMethod: "PUT",
      path: `${bucket.bucketName}/{folder}/{key}`,
      options: {
        credentialsRole: role,
        requestParameters: {
          'integration.request.path.folder': 'method.request.path.folder',
          'integration.request.path.key': 'method.request.path.key',
        },
        integrationResponses: [
          {
            statusCode: "200",
            responseParameters: {
              'method.response.header.Timestamp': 'integration.response.header.Date',
              'method.response.header.Content-Length': 'integration.response.header.Content-Length',
              'method.response.header.Content-Type': 'integration.response.header.Content-Type',
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          }
        ],
      }
    })
  }
}