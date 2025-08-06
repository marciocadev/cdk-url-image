import { Stack, StackProps } from 'aws-cdk-lib';
import { AwsIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { UrlSignedStack } from './url-signed-stack';

export class CdkUrlImageStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const {
      getUrlSignedLambdaIntegration,
      putIntegration
    } = new UrlSignedStack(this, "signed-nested-stack")

    let restApi = new RestApi(this, "url-image-restapi", {
      restApiName: "image-bucket",
      binaryMediaTypes: ["*/*"]
    })

    let urlSignedResource = restApi.root.addResource("url-signed")
    let folderUrlSignedResource = urlSignedResource.addResource("{folder}")
    let keyUrlSignedResource = folderUrlSignedResource.addResource("{key}")

    keyUrlSignedResource.addMethod("GET", getUrlSignedLambdaIntegration)

    keyUrlSignedResource.addMethod("PUT", putIntegration, {
      requestParameters: {
        'method.request.path.folder': true,
        'method.request.path.key': true,
        'method.request.header.Content-Type': true,
      },
      methodResponses: [
        {
          statusCode: "200",
          responseParameters: {
            'method.response.header.Timestamp': true,
            'method.response.header.Content-Length': true,
            'method.response.header.Content-Type': true,
            'method.response.header.Access-Control-Allow-Methods': true,
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        }
      ],
    })
  }
}
