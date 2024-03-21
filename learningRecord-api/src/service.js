import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const AWS_REGION = process.env.AWS_REGION;

const ddbClient = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const postLearningRecord = async(roleplayID, data, auth) =>{
    try{
        const userID = auth.id;
        const ceatedAt = Date.now();
        if (roleplayID[0] == 'r'){ //맞춤형 역할극 or 학습 기록이 있는 공식 역할극
            //2-1. 해당 역할극에 대한 총 학습 기록 수정을 위한 확인
            const getRoleplayCommand = new GetCommand({
                TableName: "LipRead",
                Key: {
                    PK: userID,
                    SK: roleplayID,
                },
                ProjectionExpression: "study"
            });
            const studyData = await docClient.send(getRoleplayCommand);
            console.log("기존 역할극 학습 데이터");
            console.log(studyData.Item.study);
            //2-2. 역할극에 대한 총 학습 기록 업데이트
            const newSentences = studyData.Item.study.sentences;
            for (let i of data.study.sentenceList){
                if (newSentences[i.sentence]){//해당 key가 있다면
                    newSentences[i.sentence] +=1;
                }else{ //해당 key가 없다면
                    newSentences[i.sentence] = 1;
                }
            }
            const newStudy = {
                correctRate: (studyData.Item.study.correctRate*studyData.Item.study.learnCnt + data.study.correctRate)/(studyData.Item.study.learnCnt+1),
                totalTime: studyData.Item.study.totalTime+data.study.totalTime,
                sentences: newSentences,
                learnCnt: studyData.Item.study.learnCnt+1
            };
            const updateRoleplayCommand = new UpdateCommand({
                TableName: "LipRead",
                Key: {
                    PK: userID,
                    SK: roleplayID,
                },
                UpdateExpression: "set study = :study, updatedAt = :updatedAt",
                ExpressionAttributeValues: {
                    ":study": newStudy,
                    ":updatedAt": ceatedAt,
                },
                ReturnValues: "NONE",
            });
            await docClient.send(updateRoleplayCommand);
            console.log("기존 역할극 학습 데이터 수정 후");
            console.log(newStudy);
            
        }else if(roleplayID[0] == 'o'){ //학습 기록이 없는 공식 역할극
            roleplayID = "r"+roleplayID;
            //2. 역할극 총 학습 통계를 저장
            const newSentences = {};
            for (let i of data.study.sentenceList){
                newSentences[i.sentence] = 1;
            }
            const putRoleCommand = new PutCommand({
                TableName: "LipRead",
                Item: {
                    PK: userID,
                    SK: roleplayID,
                    study: {
                        sentences: newSentences, //List
                        learnCnt: 1,
                        totalTime: data.study.totalTime,
                        correctRate: data.study.correctRate
                    },
                    updatedAt: ceatedAt,
                    title: data.title,
                    emoji: data.emoji
                },
            });
            await docClient.send(putRoleCommand);
            console.log("기존 역할극 학습 데이터 수정 후")
            console.log({
                sentences: newSentences, //List
                learnCnt: 1,
                totalTime: data.study.totalTime,
                correctRate: data.study.correctRate
            });
        }
        
        //--------공통 작업 사항--------
        //3-1. 사용자 학습 기록 수정을 위한 확인
        const getUserCommand = new GetCommand({
            TableName: "LipRead",
            Key: {
                PK: userID,
                SK: userID,
            },
            ProjectionExpression: "sentenceCnt, totalTime"
        });
        const UserData = await docClient.send(getUserCommand);
        console.log("기존 사용자 학습량");
        console.log(UserData.Item.sentenceCnt);
        console.log(UserData.Item.totalTime);
        //3-2. 사용자 학습기록 업데이트
        const updateUserCommand = new UpdateCommand({
            TableName: "LipRead",
            Key: {
                PK: userID,
                SK: userID,
            },
            UpdateExpression: "set sentenceCnt = :sentenceCnt, totalTime = :totalTime",
            ExpressionAttributeValues: {
                ":sentenceCnt": UserData.Item.sentenceCnt + data.sentenceCnt,
                ":totalTime": UserData.Item.totalTime + data.study.totalTime
            },
            ReturnValues: "NONE",
        });
        console.log("기존 사용자 학습량 수정 후");
        console.log(UserData.Item.sentenceCnt + data.sentenceCnt);
        console.log(UserData.Item.totalTime + data.study.totalTime);
        //1. 학습에 대한 기록 생성
        const putRecordCommand = new PutCommand({
            TableName: "LipRead",
            Item: {
                PK: userID,
                SK: "l"+ceatedAt.toString()+roleplayID,
                title: data.title,
                emoji: data.emoji,
                study: {
                    sentenceList: data.study.sentenceList, //List
                    totalTime: data.study.totalTime,
                    correctRate: data.study.correctRate
                }
            },
        });
        //DB에 요청 전송
        await Promise.all([
            docClient.send(updateUserCommand),
            docClient.send(putRecordCommand)
        ]);
    }catch(error){
        throw error;
    }
};

const getUserlearningData = async (auth) =>{
    try{
        const userID = auth.id;
        const getUserCommand = new GetCommand({
            TableName: "LipRead",
            Key: {
                PK: userID,
                SK: userID,
            },
            ProjectionExpression: "sentenceCnt, totalTime"
        });
        const userData = await docClient.send(getUserCommand);        
        return {
            sentenceCnt: userData.Item.sentenceCnt,
            totalTime: userData.Item.totalTime,
        };
    }catch(error){
        throw error;
    }
};

const getUserRoleplayList = async (auth) => {
    try{
        const userID = auth.id;
        const getRoleplayListCommand = new QueryCommand({
            TableName: "LipRead",
            KeyConditionExpression: "PK = :pk AND begins_with( SK, :sk )",
            ExpressionAttributeValues: {
                ":pk": userID,
                ":sk": "r"
            },
            ProjectionExpression: "SK, title, emoji, updatedAt, #s",
            ExpressionAttributeNames: {'#s': 'status'},
        });   
        const roleplayListdata = await docClient.send(getRoleplayListCommand);
        const roleplayList = roleplayListdata.Items;
        console.log("데이터베이스에 저장된 것");
        console.log(roleplayList);
        
        const doneRoleplayList = [];
        for (let roleplay of roleplayList){
            if (roleplay.status != 'inprogress'){
                doneRoleplayList.push(roleplay);
            }
        }
        console.log("inprogress 제외한 것");
        console.log(roleplayList);
        //최신 순으로 정렬
        let newRoleplayList = doneRoleplayList.sort((a,b) => (b.updatedAt - a.updatedAt));
        
        //가장 최근 10개만 추출
        let finalRoleplayList = [];
        for (let i of newRoleplayList){
            if (finalRoleplayList.length < 10){
                i.roleplayID = i.SK;
                delete i.SK;
                delete i.updatedAt;
                delete i.status;
                finalRoleplayList.push(i);
            }
        } 
        return finalRoleplayList;   
        
    }catch(error){
        throw error;
    }
};

const getUserMonthlyData = async (queryStringParameters, auth) => {
    try{
        const userID = auth.id;
        const year = Number(queryStringParameters.year);
        const month = Number(queryStringParameters.month);
        let begin, end;
        
        begin = "l"+new Date(year, month-1, 1, 0, 0).getTime(); //0월부터 시작하므로.
        end = "l"+new Date(year, month, 1, 0, 0).getTime();
        
        const getRecordListCommand = new QueryCommand({
            TableName: "LipRead",
            KeyConditionExpression: "PK = :pk AND (SK BETWEEN :begin AND :end)",
            ExpressionAttributeValues: {
                ":pk": userID,
                ":begin": begin,
                ":end": end
            },
            ProjectionExpression: "SK, title, emoji",
            ScanIndexForward: false //최신순
        });
        const recordListdata = await docClient.send(getRecordListCommand);
        
        const newRecordList = [];
        const checkDateList = [];
        for (let i of recordListdata.Items){
            const day = new Date(Number(i.SK.slice(1, 14))).getDate();
            const date = new Date(year, month-1, day, 0, 0).getTime();
            if (checkDateList.indexOf(date) < 0){ //date 객체 없으면
                const tmp = {
                    date:date,
                    study: [
                        {
                            recordID: i.SK,
                            title: i.title,
                            emoji: i.emoji
                        }
                    ]
                };
                newRecordList.push(tmp);
                checkDateList.push(date);
            }else{ //date 객체 있으면
                for (let j of newRecordList){
                    if (j.date == date){
                        const tmpStudy = {
                            recordID: i.SK,
                            title: i.title,
                            emoji: i.emoji
                        };
                        j.study.push(tmpStudy);
                    }
                }
            }
        }
        return newRecordList;
    }catch(error){
        throw error;
    }
};

const getLearningRecord = async (recordID, auth) => {
    try{
        const userID = auth.id;
        const getRecordCommand = new GetCommand({
            TableName: "LipRead",
            Key: {
                PK: userID,
                SK: recordID,
            },
            ProjectionExpression: "SK, title, emoji, study"
        });
        const recordData = await docClient.send(getRecordCommand);
        recordData.Item.recordID = recordData.Item.SK;
        delete recordData.Item.SK;
        return recordData.Item
    }catch(error){
        throw error;
    }
};

export default {
    postLearningRecord,
    getUserlearningData,
    getUserRoleplayList,
    getUserMonthlyData,
    getLearningRecord
};