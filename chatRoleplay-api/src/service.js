import dynamoDB from "./dynamoDB.js";
import OpenAI from 'openai';
import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const videoUrlOrigin = process.env.videoUrlOrigin;
const VIDEO_SERVER_URL = process.env.VIDEO_SERVER_URL;

const createID = () => {
    const random = Math.random().toString(36).substring(2, 11);
    const now = Date.now();
    const nowStr = now.toString(36);
    return random + nowStr;
};

const createChat = async (data, roleplayID) =>{
    try{
        //프롬프트 생성
        let prompt = `다음 글을 읽고 이모지 1개와 상황극 대사를 만들어. 1. 주제는 ${data.description}이다.
            2. 첫번째 역할은 ${data.role1}이며 "${data.role1Desc}"라는 특징이 있다. 3. 두번째 역할은 ${data.role2}이며 "${data.role2Desc}"라는 특징이 있다. 
            4. 응답은 아래와 같은 JSON 형식으로 만들어. 이때 chatList의 요소 개수는 4개 이하 다.
            {
                "emoji": 
                "chatList": [{"text": , "role": }, {"text": , "role": }],
            } `;
        if (data.mustWords != [] ){
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
        console.log(data.title);
        
        const putRoleplayCommand = {
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
        };
        const [putRoleplay, gptText] = await Promise.all([
            dynamoDB.put(putRoleplayCommand), 
            createChat(data, roleplayID)
        ]);
        console.log("역할극 업로드 완료");
        console.log("채팅 생성 완료");
        console.log(gptText);
        //역할극 채팅 업데이트
        const updateRoleplayCommand = {
            TableName: "LipRead",
            Key: {
                PK: userID,
                SK: roleplayID,
            },
            UpdateExpression: "set chatList = :chatList, emoji = :emoji, percentage = :percentage",
            ExpressionAttributeValues: {
                ":chatList": gptText.chatList,
                ":emoji": gptText.emoji,
                ":percentage": 10
            },
            ReturnValues: "NONE",
        };
        await dynamoDB.update(updateRoleplayCommand);
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
        console.log(roleplayID);
        
        const putRoleplayCommand = {
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
        };
        await dynamoDB.put(putRoleplayCommand);
        console.log("역할극 업로드 완료");
        
        console.log("부모 역할극");
        console.log(data.parentRoleplayID);
        let response;
        //roleplayID를 통한 부모 역할극 데이터 불러오기
        if (data.parentRoleplayID.slice(0, 2) == 'rp'){ //맞춤형 역할극인 경우
            const getRoleplayCommand = {
                TableName: "LipRead",
                Key: {
                    PK: userID,
                    SK: data.parentRoleplayID,
                },
                ProjectionExpression: "title, description, role1, role1Desc, role1Type, role2, role2Desc, role2Type"
            };
            response = await dynamoDB.get(getRoleplayCommand);
            
        }else if(data.parentRoleplayID.slice(0, 2) == 'ro'){
            console.log(data.parentRoleplayID.substr(1));
            const getRoleplayCommand = { //공식 역할극 정보 불러오기
                TableName: "LipRead",
                Key: {
                    PK: 't',
                    SK: data.parentRoleplayID.substr(1),
                },
                ProjectionExpression: "title, description, role1, role1Desc, role1Type, role2, role2Desc, role2Type"
            };
            response = await dynamoDB.get(getRoleplayCommand);
        }
        console.log("부모 역할극 데이터 가져오기 완료");
        if (!response.Item){
            const error = new Error("부모 역할극 ID 비정상");
            error.statusCode = 400;
            throw error;
        }
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
        const updateRoleplayCommand = {
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
        };
        await dynamoDB.update(updateRoleplayCommand);
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
        return {
            gptText: gptText,
            roleplayID: roleplayID
        };
        
    }catch(error){
        console.log(error);
        throw error;
    }
};

export default {
    createChat,
    createNewTopicRolePlay,
    createUsedTopicRolePlay,
};