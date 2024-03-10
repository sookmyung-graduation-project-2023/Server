import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import OpenAI from 'openai';
import jwt from "jsonwebtoken";
import axios from 'axios';

const JWT_SECRET = process.env.jwtSecret;
const AWS_REGION = process.env.AWS_REGION;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const videoUrlOrigin = "https://dyxryua47v6ay.cloudfront.net/";

const ddbClient = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const auth = async (accessToken) => {
    try {
        const decoded = jwt.verify(accessToken, JWT_SECRET);
        return {
            ok: true,
            id: decoded.id,
            name: decoded.name,
        };
    } catch (error) {
        return {
            ok: false,
            message: error.message,
        };
    }
};

const createID = () => {
    const random = Math.random().toString(36).substring(2, 11);
    const now = Date.now();
    const nowStr = now.toString(36);
    return random + nowStr;
};

const createText = async (data, roleplayID) =>{
    try{
        //프롬프트 생성
        let prompt = `다음 글을 읽고 이모지 1개와 상황극 대사를 만들어. 1. 주제는 ${data.description}이다.
            2. 첫번째 역할은 ${data.role1}이며 "${data.role1Desc}"라는 특징이 있다. 3. 두번째 역할은 ${data.role2}이며 "${data.role2Desc}"라는 특징이 있다. 
            4. 응답은 아래와 같은 JSON 형식으로 만든다. 이때 chatList의 요소 개수는 6개 이상, 10개 이하 다.
            {
                "emoji": 
                "chatList": [{"text": , "role": }, {"text": , "role": }],
            } `;
        if (data.mustWords){
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

const createNewTopicRolePlay = async function* (data, auth) {
    try{
        const userID = auth.id;
        const roleplayID = "rp"+createID();
        const updatedAt = Date.now();
        
        const gptText = await createText(data, roleplayID);
        yield {
            roleplayID: roleplayID,
            event: "채팅 생성 완료"
        };
        
        const putUserCommand = new PutCommand({
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
                emoji: gptText.emoji,
                chatList: gptText.chatList,
                study: {
                    correctRate: 0,
                    sentences: {},
                    totatlTime: 0,
                    learnCnt: 0
                },
                updatedAt: updatedAt
            },
        });
        await docClient.send(putUserCommand);
        yield {
            roleplayID: roleplayID,
            event: "채팅 업로드 완료"
        };
        
        let idx = 0;
        for (let chat of gptText.chatList){
            const body = {
                chat: chat
            };
            let response = await axios.post('http://54.86.126.77:8000/video', body);
            const { data } = response;
            if (data.success == true){
                yield {
                    roleplayID: roleplayID,
                    event: `${idx}번째 영상 생성 완료`
                };
            }else{
                yield {
                    roleplayID: roleplayID,
                    event: "영상 생성 시 오류 발생" ,
                    error: response.message //오류
                };
            }
            idx += 1;
        }
        
    }catch(error){
        throw error;
    }
};

const createUsedTopicRolePlay = async (data, auth) => {
    try{
        const userID = auth.id;
        const roleplayID = "rp"+createID();
        const updatedAt = Date.now();
        
        let response;
        //roleplayID를 통한 부모 역할극 데이터 불러오기
        if (roleplayID.slice(0, 2) == 'rp'){ //맞춤형 역할극인 경우
            const getRoleplayCommand = new GetCommand({
                TableName: "LipRead",
                Key: {
                    PK: userID,
                    SK: roleplayID,
                },
                ProjectionExpression: "title, description, emoji, role1, role1Desc, role1Type, role2, role2Desc, role2Type"
            });
            response = await docClient.send(getRoleplayCommand);
            
        }else if(roleplayID.slice(0, 2) == 'ro'){
            const getRoleplayCommand = new GetCommand({ //공식 역할극 정보 불러오기
                TableName: "LipRead",
                Key: {
                    PK: 't',
                    SK: roleplayID.slice(1),
                },
                ProjectionExpression: "title, description, emoji, role1, role1Desc, role1Type, role2, role2Desc, role2Type"
            });
            response = await docClient.send(getRoleplayCommand);
        }
        const newData = {
            title: data.title,
            description: response.Item.description,
            role1: response.Item.role1,
            role1Desc: response.Item.role1Desc,
            role1Type: response.Item.role1Type,
            role2: response.Item.role2,
            role2Desc: response.Item.role2Desc,
            role2Type: response.Item.role2Type,
            mustWords: data.mustWords
        };
        //채팅 및 영상 생성
        const gptText = await createText(newData);
        
        //Rolrplay 생성
        const putUserCommand = new PutCommand({
            TableName: "LipRead",
            Item: {
                PK: userID,
                SK: roleplayID,
                title: data.title,
                description: newData.description,
                role1: newData.role1,
                role1Desc: newData.role1Desc,
                role1Type: newData.role1Type,
                role2: newData.role2,
                role2Desc: newData.role2Desc,
                role2Type: newData.role2Type,
                emoji: gptText.emoji,
                chatList: gptText.chatList,
                study: {
                    correctRate: 0,
                    sentences: {},
                    totatlTime: 0,
                    learnCnt: 0
                },
                updatedAt: updatedAt
            },
        });
        //await docClient.send(putUserCommand);
        
        return {
            gptText: gptText,
            roleplayID: roleplayID
        };
        
    }catch(error){
        throw error;
    }
};

export default {
    auth,
    createNewTopicRolePlay,
    createUsedTopicRolePlay,
};