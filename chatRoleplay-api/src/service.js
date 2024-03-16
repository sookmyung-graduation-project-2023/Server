import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import OpenAI from 'openai';
import axios from 'axios';

const AWS_REGION = process.env.AWS_REGION;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const videoUrlOrigin = process.env.videoUrlOrigin;
const VIDEO_SERVER_URL = process.env.VIDEO_SERVER_URL;

const ddbClient = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const createID = () => {
    const random = Math.random().toString(36).substring(2, 11);
    const now = Date.now();
    const nowStr = now.toString(36);
    return random + nowStr;
};

const pushAlarm = async (userID, title) => {
    const getUserCommand = new GetCommand({
        TableName: "LipRead",
        Key: {
            PK: userID,
            SK: userID,////////////////////////////
        },
        ProjectionExpression: "endpointArn, name"
    });
    const getUserResponse = await docClient.send(getUserCommand);
    
    const client = new SNSClient({ region: AWS_REGION });
    const input = {
        TargetArn: getUserResponse.Item.endpointArn,
        Subject: "역할극 생성 완료",
        Message: `${getUserResponse.Item.name} 님이 만든 ${title} 역할극 생성이 완료 되었습니다.`
    };
    const command = new PublishCommand(input);
    await client.send(command);
};

const createChat = async (data, roleplayID) =>{
    try{
        //프롬프트 생성
        let prompt = `다음 글을 읽고 이모지 1개와 상황극 대사를 만들어. 1. 주제는 ${data.description}이다.
            2. 첫번째 역할은 ${data.role1}이며 "${data.role1Desc}"라는 특징이 있다. 3. 두번째 역할은 ${data.role2}이며 "${data.role2Desc}"라는 특징이 있다. 
            4. 응답은 아래와 같은 JSON 형식으로 만들어. 이때 chatList의 요소 개수는 6개 이상, 10개 이하 다.
            {
                "emoji": 
                "chatList": [{"text": , "role": }, {"text": , "role": }],
            } `;
        if (data.mustWords != []){
            let wordStr = "";
            for(let i of data.mustWords){
                wordStr = wordStr + i +", ";
            }
            prompt = prompt + `5. 대사에는 ${wordStr}라는 말이 들어가 있어야 한다.`;
        }
        
        //OPpenAI 요청
        const openai = new OpenAI({ apiKey: OPENAI_API_KEY });  
        const chatCompletion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ "role":"system", "content":prompt }],
            max_tokens: 1000,
            temperature: 0.8, //degree of diversity
        });
        const gptText = JSON.parse(chatCompletion.choices[0].message.content);
  
        const roleDict = {};
        roleDict[data.role1] = data.role1Type;
        roleDict[data.role2] = data.role2Type;
        //영상 videoUrl, roleType 생성
        let idx = 0;
        for (let chat of gptText.chatList){ //인덱스 i
            chat.videoUrl = videoUrlOrigin + roleplayID + "_" + idx.toString() + ".mp4";
            chat.roleType = roleDict[chat.role];
            idx += 1;
        }        
        return gptText;
        
    }catch(error){
        throw error;
    }
};

const createNewTopicRolePlay = async (data, auth) => {
    try{
        const userID = auth.id;
        const roleplayID = "rp"+createID();
        const updatedAt = Date.now();
        const putRoleplayCommand = new PutCommand({
            TableName: "LipRead",
            Item: {
                PK: userID,
                SK: roleplayID,
                title: data.title,
                description: data.description,
                role1: data.role1,
                role1Desc: data.role1Desc,
                role1Type: data.role1Type,
                role2: data.role2,
                role2Desc: data.role2Desc,
                role2Type: data.role2Type,
                study: {
                    correctRate: 0,
                    sentences: {},
                    totalTime: 0,
                    learnCnt: 0
                },
                updatedAt: updatedAt,
                status: "inprogress",
                percentage: 0
            },
        });
        const [putRoleplay, gptText] = await Promise.all([
            docClient.send(putRoleplayCommand), 
            createChat(data, roleplayID)
        ]);
        console.log("역할극 업로드 완료");
        console.log("채팅 생성 완료");
        //역할극 채팅 업데이트
        const updateRoleplayCommand = new UpdateCommand({
            TableName: "LipRead",
            Key: {
                PK: userID,
                SK: roleplayID,
            },
            UpdateExpression: "set chatList = :chatList, emoji = :emoji, percentage = :percentage",
            ExpressionAttributeValues: {
                ":chatList": gptText.chatList,
                ":emoji": gptText.emoji,
                ":percentage": 10,
            },
            ReturnValues: "NONE",
        });
        await docClient.send(updateRoleplayCommand);
        console.log("채팅 업로드 완료");
        //영상 생성 시작
        const body = {
            chatList: gptText.chatList,
            userID: userID,
            roleplayID: roleplayID
        };
        axios.post(VIDEO_SERVER_URL, body);
        //ML 요청이 갈 시간 주기
        await new Promise(r => setTimeout(r, 2000));
        //알림 전송
        //pushAlarm(userID, data.title);
        return {
            gptText: gptText,
            roleplayID: roleplayID
        };
    }catch(error){
        console.log(error);
        throw error;
    }
};

const createUsedTopicRolePlay = async (data, auth) => {
    try{
        const userID = auth.id;
        const roleplayID = "rp"+createID();
        const updatedAt = Date.now();
        
        const putRoleplayCommand = new PutCommand({
            TableName: "LipRead",
            Item: {
                PK: userID,
                SK: roleplayID,
                title: data.title,
                study: {
                    correctRate: 0,
                    sentences: {},
                    totalTime: 0,
                    learnCnt: 0
                },
                updatedAt: updatedAt,
                status: "inprogress",
                percentage: 0
            },
        });
        await docClient.send(putRoleplayCommand);
        console.log("역할극 업로드 완료");
        
        let response;
        //roleplayID를 통한 부모 역할극 데이터 불러오기
        if (data.parentRoleplayID.slice(0, 2) == 'rp'){ //맞춤형 역할극인 경우
            const getRoleplayCommand = new GetCommand({
                TableName: "LipRead",
                Key: {
                    PK: userID,
                    SK: data.parentRoleplayID,
                },
                ProjectionExpression: "title, description, role1, role1Desc, role1Type, role2, role2Desc, role2Type"
            });
            response = await docClient.send(getRoleplayCommand);
            
        }else if(roleplayID.slice(0, 2) == 'ro'){
            const getRoleplayCommand = new GetCommand({ //공식 역할극 정보 불러오기
                TableName: "LipRead",
                Key: {
                    PK: 't',
                    SK: data.parentRoleplayID.slice(1),
                },
                ProjectionExpression: "title, description, role1, role1Desc, role1Type, role2, role2Desc, role2Type"
            });
            response = await docClient.send(getRoleplayCommand);
        }
        console.log("부모 역할극 데이터 가져오기 완료");
        console.log(response.Item);
        
        //채팅 및 영상 생성
        const gptText = await createChat(
            {
                description: response.Item.description,
                role1: response.Item.role1,
                role1Desc: response.Item.role1Desc,
                role1Type: response.Item.role1Type,
                role2: response.Item.role2,
                role2Desc: response.Item.role2Desc,
                role2Type: response.Item.role2Type,
                mustWords: data.mustWords
            }, 
            roleplayID
        );
        console.log("채팅 생성 완료");
        console.log(gptText.chatList);
        
        
        //역할극 채팅 및 데이터 업데이트
        const updateRoleplayCommand = new UpdateCommand({
            TableName: "LipRead",
            Key: {
                PK: userID,
                SK: roleplayID,
            },
            UpdateExpression: "set description = :description, role1 = :role1, role1Desc = :role1Desc, role1Type = :role1Type, role2 = :role2, role2Desc = :role2Desc, role2Type = :role2Type, chatList = :chatList, parentTitle = :parentTitle, emoji = :emoji, percentage = :percentage",
            ExpressionAttributeValues: {
                ":description": response.Item.description,
                ":role1": response.Item.role1,
                ":role1Desc": response.Item.role1Desc,
                ":role1Type": response.Item.role1Type,
                ":role2": response.Item.role2,
                ":role2Desc": response.Item.role2Desc,
                ":role2Type": response.Item.role2Type,
                ":chatList": gptText.chatList,
                ":parentTitle": response.Item.title,
                ":emoji": gptText.emoji,
                ":percentage": 10,
            },
            ReturnValues: "NONE",
        });
        await docClient.send(updateRoleplayCommand);
        console.log("채팅 및 데이터 업로드 완료");
        
        //영상 생성 시작
        const body = {
            chatList: gptText.chatList,
            userID: userID,
            roleplayID: roleplayID
        };
        axios.post(VIDEO_SERVER_URL, body);
        //ML 요청이 갈 시간 주기
        await new Promise(r => setTimeout(r, 2000));
        //알림 전송
        //pushAlarm(userID, data.title);
        return {
            gptText: gptText,
            roleplayID: roleplayID
        };
        
    }catch(error){
        throw error;
    }
};

export default {
    createNewTopicRolePlay,
    createUsedTopicRolePlay,
};