import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const AWS_REGION = process.env.AWS_REGION;

const ddbClient = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const getOfficialRoleplayList = async (queryStringParameters, auth) => {
    try{
         //공식 역할극 리스트
        const getOfficialRoleplayListCommand = new QueryCommand({
            TableName: "LipRead",
            KeyConditionExpression: "PK = :pk AND begins_with( SK, :sk )",
            ExpressionAttributeValues: {
                ":pk": "t",
                ":sk": "o"
            },
            ProjectionExpression: "SK, title, emoji, category"
        });
        //학습기록이 있는 공식 리스트
        const userID = auth.id;
        const getOfficialRecordListCommand = new QueryCommand({
            TableName: "LipRead",
            KeyConditionExpression: "PK = :pk AND begins_with( SK, :sk )",
            ExpressionAttributeValues: {
                ":pk": userID,
                ":sk": "ro"
            },
            ProjectionExpression: "SK"
        });
        //DB에 요청 전송
        const [data, recordData] = await Promise.all([
            docClient.send(getOfficialRoleplayListCommand),
            docClient.send(getOfficialRecordListCommand)
        ]);
        let response = data.Items;
        const recordResponse = recordData.Items;
        
        
        if (queryStringParameters){ //쿼리 스트링이 존재한다면
            const categoryResponse = [];
            for (let i of response){ //쿼리스트링의 값과 같은 경우만 리스트에 삽입
                if (i.category == queryStringParameters.category){
                    categoryResponse.push(i);
                }
            }
            response = categoryResponse;
        }
        //학습기록이 있는 공식 역할극의 경우 roleplayID를 바꾼다.
        if (recordResponse){
            for (let i of response){
                for (let withR of recordResponse){
                    if (i.SK == withR.SK.slice(1)){
                        i.SK = withR.SK;
                    }
                }
                i.roleplayID = i.SK;
                delete i.SK;
                delete i.category;
            }
        }
        console.log(response);
        return response;
    }catch(error){
        throw error;
    }  
};

const getPersonalRoleplayList = async (auth) => {
    try{
        const userID = auth.id;
        const getPersonalRoleplayListCommand = new QueryCommand({
            TableName: "LipRead",
            KeyConditionExpression: "PK = :pk AND begins_with( SK, :sk )",
            ExpressionAttributeValues: {
                ":pk": userID,
                ":sk": "rp"
            },
            ProjectionExpression: "SK, title, emoji, parentTitle, updatedAt, #s",
            ExpressionAttributeNames: {'#s': 'status'},
        });
        const data = await docClient.send(getPersonalRoleplayListCommand);
        //이미 생성 완료된 역할극만 모으기
        const response = [];
        for (let roleplay of data.Items){
            if (roleplay.status == "done"){
                response.push(roleplay);
            }
        }
        //최신 순으로 정렬
        let newResponse = response.sort((a,b) => (b.updatedAt - a.updatedAt));
        for (let i of newResponse){
            i.roleplayID = i.SK;
            delete i.SK;
            delete i.updatedAt;
        }
        return newResponse;
    }catch(error){
        throw error;
    }
};

const getRoleplay = async (roleplayID, auth) => {
    try{
        const userID = auth.id;
        console.log(roleplayID);
        if (roleplayID.slice(0, 2) == 'rp'){ //맞춤형 역할극인 경우
            const getRoleplayCommand = new GetCommand({
                TableName: "LipRead",
                Key: {
                    PK: userID,
                    SK: roleplayID,
                },
                ProjectionExpression: "title, description, emoji, role1, role1Desc, role1Type, role2, role2Desc, role2Type, study, parentTitle"
            });
            const response = await docClient.send(getRoleplayCommand);
            response.Item.roleplayID = roleplayID;
            if (response.Item.study.learnCnt == 0){ //학습 횟수가 0이면 study 객체 제거
                delete response.Item.study;
            }else{
                //study에서 sentences 데이터처리
                let sorted = Object.entries(response.Item.study.sentences).sort((a, b) => b[1] - a[1]);
                response.Item.study.sentence = sorted[0][0];
                delete response.Item.study.sentences;
            }
            return response.Item;
            
        }else if(roleplayID[0] == 'o'){ //학습 기록 없는 공식 역할극인 경우
            const getRoleplayCommand = new GetCommand({
                TableName: "LipRead",
                Key: {
                    PK: "t",
                    SK: roleplayID,
                },
                ProjectionExpression: "title, description, emoji, role1, role1Desc, role1Type, role2, role2Desc, role2Type, category"
            });
            const response = await docClient.send(getRoleplayCommand);
            response.Item.roleplayID = roleplayID;
            return response.Item;
            
        }else if(roleplayID.slice(0, 2) == 'ro'){ //학습 기록 있는 공식 역할극인 경우
            const getRoleplayCommand = new GetCommand({ //공식 역할극 정보 불러오기
                TableName: "LipRead",
                Key: {
                    PK: 't',
                    SK: roleplayID.slice(1),
                },
                ProjectionExpression: "title, description, emoji, role1, role1Desc, role1Type, role2, role2Desc, role2Type, category"
            });
            const getRecordCommand = new GetCommand({ //역할극 학습 기록 불러오기
                TableName: "LipRead",
                Key: {
                    PK: userID,
                    SK: roleplayID,
                },
                ProjectionExpression: "study"
            });
            //DB에 요청 전송
            const [roleplayData, recordData] = await Promise.all([
                docClient.send(getRoleplayCommand),
                docClient.send(getRecordCommand)
            ]);
            roleplayData.Item.roleplayID = roleplayID;
            roleplayData.Item.study =recordData.Item.study;
            if (roleplayData.Item.study.learnCnt == 0){ //학습 횟수가 0이면 study 객체 제거
                delete roleplayData.Item.study;
            }else{
                //study에서 sentences 데이터처리
                let sorted = Object.entries(roleplayData.Item.study.sentences).sort((a, b) => b[1] - a[1]);
                roleplayData.Item.study.sentence = sorted[0][0];
                delete roleplayData.Item.study.sentences;
            }
            return roleplayData.Item;
        }     
    }catch(error){
        throw error;
    }
};

const getRoleplayChatList = async (roleplayID, auth) => {
    try{   
        const userID = auth.id; 
        let getRoleplayCommand;  
        if (roleplayID.slice(0, 2) == 'rp'){
            getRoleplayCommand = new GetCommand({
                TableName: "LipRead",
                Key: {
                    PK: userID,
                    SK: roleplayID,
                },
                ProjectionExpression: "chatList"
            });
            
        }else if(roleplayID[0] == 'o'){
            getRoleplayCommand = new GetCommand({
                TableName: "LipRead",
                Key: {
                    PK: "t",
                    SK: roleplayID,
                },
                ProjectionExpression: "chatList"
            });
            
        }else if (roleplayID.slice(0, 2) == 'ro'){
            getRoleplayCommand = new GetCommand({
                TableName: "LipRead",
                Key: {
                    PK: "t",
                    SK: roleplayID.slice(1),
                },
                ProjectionExpression: "chatList"
            });
        }
        const response = await docClient.send(getRoleplayCommand);
        response.Item.roleplayID = roleplayID;
        return response.Item;
    }catch(error){
        throw error;
    }
};

export default {
    getOfficialRoleplayList,
    getPersonalRoleplayList,
    getRoleplay,
    getRoleplayChatList
};