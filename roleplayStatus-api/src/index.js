import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const AWS_REGION = process.env.AWS_REGION;
const API_ENDPOINT = process.env.API_ENDPOINT;

const ddbClient = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const apiClient = new ApiGatewayManagementApiClient({
    endpoint: API_ENDPOINT,
    region: AWS_REGION
});

export const handler = async (event, context, callback) => {
    const connectionId = event.requestContext.connectionId;
    const routeKey = event['requestContext']['routeKey'];
    switch (routeKey) {
        case "$connect":
            //connectID DB에 추가
            console.log('Connection occurred');
            if (typeof event.queryStringParameters === 'undefined' || typeof event.queryStringParameters.userID === 'undefined' || typeof event.queryStringParameters.deviceToken === 'undefined') {
                return { statusCode: 500, body: `빈 값으로 인한 연결 실패` };
            }
            const userID = event.queryStringParameters.userID;
            const deviceToken = event.queryStringParameters.deviceToken;
            
            const getUserCommand = new GetCommand({
                TableName: "LipRead",
                Key: {
                    PK: userID,
                    SK: 'd'+deviceToken,
                },
                ProjectionExpression: "PK"
            });
            const getUserResponse = await docClient.send(getUserCommand);
            if (!getUserResponse.Item) {
                return { statusCode: 500, body: `비정상 userID로 인한 연결 실패` };
            }
            const updateUserCommand = new UpdateCommand({
                TableName: "LipRead",
                Key: {
                    PK: userID,
                    SK: 'd'+deviceToken,
                },
                UpdateExpression: "set websocketID = :websocketID",
                ExpressionAttributeValues: {
                    ":websocketID": connectionId,
                },
                ReturnValues: "NONE",
            });
            await docClient.send(updateUserCommand); 
            return { statusCode: 200, body: 'Connected' };
            
            break;
        case "$disconnect":
            console.log('Disconnection occurred');
            break;
        case "$default":
            const data = {
                status: "Connected"
            };
            const command = new PostToConnectionCommand({
                ConnectionId: connectionId,
                Data: Buffer.from(JSON.stringify(data)),
            });
            try {
                await apiClient.send(command);
            } catch (error) {
                console.log(error);
            }
            break;
        default:
            const response = {
                statusCode: 200,
                body: JSON.stringify('Hello from Lambda!'),
            };
            return response;
    }
  };
  