import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

let s3Client = new S3Client()

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  let key = event.pathParameters!.key
  let folder = event.pathParameters!.folder

  let s3Command = new GetObjectCommand({
    Bucket: process.env.BUCKET_NAME!,
    Key: folder + "/" + key
  })

  const signedUrl = await getSignedUrl(s3Client, s3Command, {
    expiresIn: 30
  })

  return {
    body: JSON.stringify({ url: signedUrl }),
    statusCode: 200
  }
}