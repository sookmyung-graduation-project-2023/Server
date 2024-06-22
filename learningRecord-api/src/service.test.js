import service from "./service.js";
import dynamoDB from "./dynamoDB.js";

jest.mock('./dynamoDB.js');

afterEach(() => {
    jest.clearAllMocks();
});

describe('postLearningRecord', () => {
    const auth = {id: "testId"};
    const data = {
        title: "testTitle",
        study: {
			sentenceList: [
				{roleType: "man", role: "카페 직원", sentence:"안녕하세요", check:[[0, "안녕하세요"]]},
			],
		    totalTime: 100000,
		    correctRate: 0.5
	    },
        sentenceCnt: 10,
        emoji: "testEmoji"
    };
    
    test('postLearningRecord 맞춤형 역할극인 경우 성공', async () =>{
        const roleplayID = "rtest";
        dynamoDB.get.mockResolvedValue({
            Item: {
                study: {
                    correctRate: 0.7,
				    sentences: {"안녕하세요.":1, "반가워요":2},
				    totatlTime: 100000,
				    learnCnt: 5
                }
            }
        });
        const response = await service.postLearningRecord(roleplayID, data, auth);
        expect(dynamoDB.get).toBeCalledTimes(2);
        expect(dynamoDB.update).toBeCalledTimes(2);
        expect(dynamoDB.put).toBeCalledTimes(1);
    });
    
    test('postLearningRecord 학습 기록이 없는 공식 역할극인 경우 성공', async () =>{
        const roleplayID = "otest";
        dynamoDB.get.mockResolvedValue({
            Item: {
                study: {
                    correctRate: 0.7,
				    sentences: {"안녕하세요.":1, "반가워요":2},
				    totatlTime: 100000,
				    learnCnt: 5
                }
            }
        });
        const response = await service.postLearningRecord(roleplayID, data, auth);
        expect(dynamoDB.get).toBeCalledTimes(1);
        expect(dynamoDB.update).toBeCalledTimes(1);
        expect(dynamoDB.put).toBeCalledTimes(2);
    });
    
    test('postLearningRecord 실패', async () =>{
        const roleplayID = "otest";
        dynamoDB.get.mockRejectedValue(new Error("test error"));
        const response = service.postLearningRecord(roleplayID, data, auth);
        await expect(response).rejects.toThrow(new Error("test error"));
    });
});

describe('getUserlearningData', () => {   
    const auth = {id : "testId"};
    
    test('getUserlearningData 성공', async () =>{
        dynamoDB.get.mockResolvedValue({
            Item: { 
                sentenceCnt: 3, 
                totalTime: 10000
            }
        });
        const response = await service.getUserlearningData(auth);
        expect(dynamoDB.get).toBeCalledTimes(1);  
        expect(response.sentenceCnt).toEqual(3);
        expect(response.totalTime).toEqual(10000);
    });
    
    test('getUserlearningData 실패', async () =>{
        dynamoDB.get.mockRejectedValue(new Error("test error"));
        const response = service.getUserlearningData(auth);
        await expect(response).rejects.toThrow(new Error("test error"));
    });
});

describe('getUserRoleplayList', () => {   
    const auth = {id : "testId"};
    
    test('getUserRoleplayList 성공', async () =>{
        dynamoDB.query.mockResolvedValue({
            Items: [{
                SK: "SK",
                title: "title",
                emoji: "emoji",
                updatedAt: 100000,
                status: "done"
            }]
        });
        const response = await service.getUserRoleplayList(auth);
        expect(dynamoDB.query).toBeCalledTimes(1);  
        expect(response).toHaveLength(1);
        expect(response[0].roleplayID).toEqual("SK");
    });
    
    test('getUserRoleplayList 성공2', async () =>{
        dynamoDB.query.mockResolvedValue({
            Items: [{
                SK: "SK",
                title: "title",
                emoji: "emoji",
                updatedAt: 100000,
                status: "inprogress"
            }]
        });
        const response = await service.getUserRoleplayList(auth);
        expect(dynamoDB.query).toBeCalledTimes(1);  
        expect(response).toHaveLength(0);
    });
    
    test('getUserRoleplayList 실패', async () =>{
        dynamoDB.query.mockRejectedValue(new Error("test error"));
        const response = service.getUserRoleplayList(auth);
        await expect(response).rejects.toThrow(new Error("test error"));
    });
});

describe('getUserMonthlyData', () => {   
    const queryStringParameters =  {
        year: 2024,
        month: 2
    };
    const auth = {id : "testId"};
    
    test('getUserMonthlyData 성공', async () =>{
        dynamoDB.query.mockResolvedValue({ 
            Items: [{SK: "l1708442646224ro1", title: "testTitle", emoji: "testEmoji"}] 
        });
        const response = await service.getUserMonthlyData(queryStringParameters, auth);
        expect(dynamoDB.query).toBeCalledTimes(1);  
        expect(response).toHaveLength(1);
    });
    
    test('getUserMonthlyData 성공2', async () =>{
        dynamoDB.query.mockResolvedValue({ 
            Items: [] 
        });
        const response = await service.getUserMonthlyData(queryStringParameters, auth);
        expect(dynamoDB.query).toBeCalledTimes(1);  
    });

    test('getUserMonthlyData 실패', async () =>{
        dynamoDB.query.mockRejectedValue(new Error("test error"));
        const response = service.getUserMonthlyData(queryStringParameters, auth);
        await expect(response).rejects.toThrow(new Error("test error"));
    });
});

describe('getLearningRecord', () => {   
    const auth = {id : "testId"};
    const recordID = "recordID";
    
    test('getLearningRecord 성공', async () =>{
        dynamoDB.get.mockResolvedValue({
            Item: { 
                SK: 3, 
                title: "testTitle", 
                emoji:1,
                study:{}
            }
        });
        const response = await service.getLearningRecord(recordID, auth);
        expect(dynamoDB.get).toBeCalledTimes(1);  
        expect(response.title).toEqual("testTitle");
        expect(response.SK).toEqual(undefined);
    });
    
    test('getLearningRecord 실패', async () =>{
        dynamoDB.get.mockRejectedValue(new Error("test error"));
        const response = service.getLearningRecord(recordID, auth);
        await expect(response).rejects.toThrow(new Error("test error"));
    });
});





