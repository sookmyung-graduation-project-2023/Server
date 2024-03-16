import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const AWS_REGION = process.env.AWS_REGION;
const API_ENDPOINT = process.env.API_ENDPOINT;

const ddbClient = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const apiClient = new ApiGatewayManagementApiClient({
    endpoint: API_ENDPOINT,
    region: AWS_REGION
});

export const handler = async (event, context, callback) => {
    console.log("이벤트!!");
    console.log(event);
    const connectionId = event.requestContext.connectionId;
    const routeKey = event['requestContext']['routeKey'];
    let userID;
    switch (routeKey) {
        case "$connect":
            //connectID DB에 추가
            console.log('Connection occurred');
            if (typeof event.queryStringParameters === 'undefined' || typeof event.queryStringParameters.userID === 'undefined' || typeof event.queryStringParameters.deviceToken === 'undefined') {
                return { statusCode: 500, body: `빈 값으로 인한 연결 실패` };
            }
            userID = event.queryStringParameters.userID;
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
            break;
        case "start":
            console.log("start 시작");
            //맞춤형 역할극 리스트 찾기
            const eventBody = JSON.parse(event.body);
            userID = eventBody.uid;
            console.log(userID);
            const getRoleplayListCommand = new QueryCommand({
                TableName: "LipRead",
                KeyConditionExpression: "PK = :pk AND begins_with( SK, :sk )",
                ExpressionAttributeValues: {
                    ":pk": userID,
                    ":sk": "rp"
                },
                ProjectionExpression: "SK, title, parentTitle, #s, percentage, updatedAt",
                ExpressionAttributeNames: {'#s': 'status'},
            });
            const getRoleplayListResponse = await docClient.send(getRoleplayListCommand);
            const roleplayList = getRoleplayListResponse.Items;
            console.log("역할극 get 성공");
            //생성 중인 역할극만 모으기
            const inprogressRoleplayList = [];
            for (let roleplay of roleplayList){
                if (roleplay.status == 'inprogress'){
                    inprogressRoleplayList.push(roleplay);
                }
            }
            //최신 순으로 정렬
            let responseData = inprogressRoleplayList.sort((a,b) => (b.updatedAt - a.updatedAt));
            for (let roleplay of responseData){
                roleplay.roleplayID = roleplay.SK;
                delete roleplay.SK;
                delete roleplay.updatedAt;
                console.log(roleplay);
            }
            console.log("responseData");
            console.log(responseData);
            const data = { data: responseData };
            const command = new PostToConnectionCommand({
                ConnectionId: connectionId,
                Data: Buffer.from(JSON.stringify(data)),
            });
            try {
                await apiClient.send(command);
            } catch (error) {
                console.log(error);
            }
            return { statusCode: 200 };
            break;
        default:
            const response = {
                statusCode: 200,
                body: JSON.stringify('Hello from Lambda!'),
            };
            return response;
    }
  };
  