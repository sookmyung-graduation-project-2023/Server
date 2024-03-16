import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const AWS_REGION = process.env.AWS_REGION;
const API_ENDPOINT = process.env.API_ENDPOINT;

const client = new ApiGatewayManagementApiClient({
    endpoint: API_ENDPOINT,
    region: AWS_REGION
});

const ddbClient = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

export const handler = async (event) => {
    for (let record of event.Records){
        console.log("SK: " + record.dynamodb.Keys.SK.S);
        console.log("PK: " + record.dynamodb.Keys.PK.S);
        if (record.dynamodb.Keys.SK.S.substr(0, 2) == 'rp' && record.eventName!="REMOVE"){
            const userID = record.dynamodb.Keys.PK.S;
            const getWebsocketListCommand = new QueryCommand({
                TableName: "LipRead",
                KeyConditionExpression: "PK = :pk AND begins_with( SK, :sk )",
                ExpressionAttributeValues: {
                    ":pk": userID,
                    ":sk": "d"
                },
                ProjectionExpression: "websocketID"
            });
            const getWebsocketListResponse = await docClient.send(getWebsocketListCommand);
            const websocketList = getWebsocketListResponse.Items; //[{ websocketID: 'UtsE3dYzIE0CEBw=' }, ...]

            //맞춤형 역할극 리스트 찾기
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
            console.log("생성 중인 역할극만 모으기 성공");
            //이벤트가 발생한 역할극의 상태가 done인 경우 추가하기
            if (record.dynamodb.NewImage.status.S == "done"){
                const doneRoleplay = {
                    SK: record.dynamodb.Keys.SK.S,
                    title: record.dynamodb.NewImage.title.S,
                    status: record.dynamodb.NewImage.status.S,
                    percentage: Number(record.dynamodb.NewImage.percentage.N),
                    updatedAt: Number(record.dynamodb.NewImage.updatedAt.N)
                };
                if (record.dynamodb.NewImage.parentTitle){
                    doneRoleplay.parentTitle = record.dynamodb.NewImage.parentTitle.S;
                }
                inprogressRoleplayList.push(doneRoleplay);
                console.log(doneRoleplay);
            }
            console.log("done인 경우 추가하기 성공");
            //최신 순으로 정렬
            let responseData = inprogressRoleplayList.sort((a,b) => (b.updatedAt - a.updatedAt));
            for (let roleplay of responseData){
                roleplay.roleplayID = roleplay.SK;
                delete roleplay.SK;
                delete roleplay.updatedAt;
                console.log(roleplay);
            }
            
            const data = {
                status: 200,
                success: true,
                message: "실시간 변경된 역할극 전송",
                data: responseData
            };
            //웹소켓 데이터 전송하기
            for (let connectionIdObject of websocketList){
                const command = new PostToConnectionCommand({
                    ConnectionId: connectionIdObject.websocketID,
                    Data: Buffer.from(JSON.stringify(data)),
                });
                await client.send(command);
            }
        }
    };

 };
  