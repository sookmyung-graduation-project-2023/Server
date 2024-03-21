import { SNSClient, GetEndpointAttributesCommand, SetEndpointAttributesCommand, PublishCommand } from "@aws-sdk/client-sns";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const AWS_REGION = process.env.AWS_REGION;
const ddbClient = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const pushAlarm = async (userID, title) => {
    try{
        const getDeviceListCommand = new QueryCommand({
            TableName: "LipRead",
            KeyConditionExpression: "PK = :pk AND begins_with( SK, :sk )",
            ExpressionAttributeValues: {
                ":pk": userID,
                ":sk": "d"
            },
            ProjectionExpression: "SK, endpointArn"
        });
        const getDeviceListResponse = await docClient.send(getDeviceListCommand);
        
        const client = new SNSClient({ region: AWS_REGION });
        for (let device of getDeviceListResponse.Items){
            console.log("엔드포인트");
            console.log(device.endpointArn);
            console.log(device.SK.substr(1));
            //endpointArn이 유효한지 확인
            const getEndpointcommand = new GetEndpointAttributesCommand({
                EndpointArn: device.endpointArn
            });
            const getEndpointresponse = await client.send(getEndpointcommand);
            console.log(getEndpointresponse.Attributes);
            if (getEndpointresponse.Attributes.Enabled == 'false'){
                console.log("유효하지 않음");
                console.log(getEndpointresponse.Attributes);
                //endpointArn를 업데이트
                const deviceToken = device.SK.substr(1); //앞에 d 빼기
                console.log("디바이스 토큰");
                console.log(deviceToken);
                const setEndpointcommand = new SetEndpointAttributesCommand({
                    EndpointArn: device.endpointArn,
                    Attributes: {
                        Token: deviceToken
                    }
                });
                await client.send(setEndpointcommand);
            }else{
                console.log("유효함");
                //엔드포인트로 메세지 전송
                const input = {
                    TargetArn: device.endpointArn,
                    Subject: "역할극 생성 완료",
                    Message: `${title} 역할극 생성이 완료 되었습니다.`
                };
                const publishcommand = new PublishCommand(input);
                try{
                    await client.send(publishcommand);
                    console.log("메세지 전송 완료");
                }catch(error){
                    console.log(error);
                }
            }
        }
    }catch(error){
        console.log(error);
        throw error;
    }  
};

export const handler = async (event) => {
    console.log(event);
    try{
        const userID = event.userID;
        const roleplayID = event.roleplayID;  
        console.log(event.userID);
        console.log(event.roleplayID);
        
        const getRoleplayCommand = new GetCommand({
            TableName: "LipRead",
            Key: {
                PK: userID,
                SK: roleplayID,
            },
            ProjectionExpression: "title"
        });
        const roleplayData = await docClient.send(getRoleplayCommand);
        const title = roleplayData.Item.title;
        console.log(title);
     
        await pushAlarm(userID, title);
        const response = {
            statusCode: 200,
            body: JSON.stringify("success"),
        };
        return response;
    }catch(error){
        const response = {
            statusCode: 500,
            body: JSON.stringify("fail"),
        };
        return response;
    }
  };
  