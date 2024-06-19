import service from "./service.js";
import dynamoDB from "./dynamoDB.js";

jest.mock('./dynamoDB.js');

afterEach(() => {
    jest.clearAllMocks();
});

describe('getOfficialRoleplayList', () => {   
    const queryStringParameters = {
        category: "testQueryStringParameters"
    };
    const auth = {id : "testId"}
    
    test('getOfficialRoleplayList 성공', async () =>{
        dynamoDB.query.mockResolvedValue({ 
            Items: [{SK: "testSK", category: "testQueryStringParameters"}] 
        });
        const response = await service.getOfficialRoleplayList(queryStringParameters, auth);
        expect(dynamoDB.query).toBeCalledTimes(2);  
        expect(response[0].roleplayID).toEqual("testSK");
    });
    
    test('getOfficialRoleplayList 성공 roleplayID 대체', async () =>{
        dynamoDB.query
            .mockResolvedValueOnce({ 
                Items: [{SK: "otest", category: "testQueryStringParameters"}] 
            })
            .mockResolvedValueOnce({ 
                Items: [{SK: "rotest"}] 
            });
        const response = await service.getOfficialRoleplayList(queryStringParameters, auth);
        expect(dynamoDB.query).toBeCalledTimes(2);  
        expect(response[0].roleplayID).toEqual("rotest");
    });
    
    test('getOfficialRoleplayList 성공 카테고리 없는 경우', async () =>{
        dynamoDB.query
            .mockResolvedValue({ 
                Items: [{SK: "otest", category: "testQueryStringParameters"}] 
            })
        const response = await service.getOfficialRoleplayList(null, auth);
        expect(dynamoDB.query).toBeCalledTimes(2);  
        expect(response[0].roleplayID).toEqual("otest");
    });
    
    test('getOfficialRoleplayList 실패', async () =>{
        dynamoDB.query.mockRejectedValue(new Error("test error"));
        const response = service.getOfficialRoleplayList(queryStringParameters, auth);
        await expect(response).rejects.toThrow(new Error("test error"));
    });
});

describe('getPersonalRoleplayList', () => {   
    const auth = {id : "testId"}
    
    test('getPersonalRoleplayList 성공', async () =>{
        dynamoDB.query.mockResolvedValue({ 
            Items: [{SK: "testSK", updatedAt: 1 ,status: "done"}] 
        });
        const response = await service.getPersonalRoleplayList(auth);
        expect(dynamoDB.query).toBeCalledTimes(1);  
        expect(response[0].roleplayID).toEqual("testSK");
        expect(response[0].status).toEqual("done");
    });
    
    test('getPersonalRoleplayList 실패', async () =>{
        dynamoDB.query.mockRejectedValue(new Error("test error"));
        const response = service.getPersonalRoleplayList(auth);
        await expect(response).rejects.toThrow(new Error("test error"));
    });
});

describe('getRoleplay', () => {  
    const auth = {id : "testId"};
    
    test('getRoleplay 맞춤형 역할극인 경우', async () =>{
        const roleplayID = "rptest";
        dynamoDB.get.mockResolvedValue({ 
            Item: {
                SK: roleplayID, 
                study: {
                    learnCnt: 1,
                    sentences: {"testSentence1.":1, "testSentence2":2}
                },
            } 
        });
        const response = await service.getRoleplay(roleplayID, auth);
        expect(dynamoDB.get).toBeCalledTimes(1);  
        expect(response.roleplayID).toEqual(roleplayID);
        expect(response.study.sentence).toEqual("testSentence2");
        expect(response.study.sentences).toEqual(undefined);
    });
    
    test('getRoleplay 맞춤형 역할극인 경우', async () =>{
        const roleplayID = "rptest";
        dynamoDB.get.mockResolvedValue({ 
            Item: {
                SK: roleplayID, 
                study: {
                    learnCnt: 0,
                },
            } 
        });
        const response = await service.getRoleplay(roleplayID, auth);
        expect(dynamoDB.get).toBeCalledTimes(1);  
        expect(response.roleplayID).toEqual(roleplayID);
        expect(response.study).toEqual(undefined);
    });
    
    test('getRoleplay 학습 기록 없는 공식 역할극인 경우', async () =>{
        const roleplayID = "otest";
        dynamoDB.get.mockResolvedValue({ 
            Item: {
                SK: roleplayID, 
            } 
        });
        const response = await service.getRoleplay(roleplayID, auth);
        expect(dynamoDB.get).toBeCalledTimes(1);  
        expect(response.roleplayID).toEqual(roleplayID);
    });
    
    test('getRoleplay 학습 기록 있는 공식 역할극인 경우', async () =>{
        const roleplayID = "rotest";
        dynamoDB.get.mockResolvedValue({ 
            Item: {
                study: {
                    learnCnt: 0
                }, 
            } 
        });
        const response = await service.getRoleplay(roleplayID, auth);
        expect(dynamoDB.get).toBeCalledTimes(2);  
        expect(response.roleplayID).toEqual(roleplayID);
    });

    test('getRoleplay 학습 기록 있는 공식 역할극인 경우', async () =>{
        const roleplayID = "rotest";
        dynamoDB.get.mockResolvedValue({ 
            Item: {
                study: {
                    learnCnt: 1,
                    sentences: {"testSentence1.":1, "testSentence2":2}
                }, 
            } 
        });
        const response = await service.getRoleplay(roleplayID, auth);
        expect(dynamoDB.get).toBeCalledTimes(2);  
        expect(response.roleplayID).toEqual(roleplayID);
        expect(response.study.sentence).toEqual("testSentence2");
        expect(response.study.sentences).toEqual(undefined);
    });
    
    test('getRoleplay 실패', async () =>{
        const roleplayID = "rptest";
        dynamoDB.get.mockRejectedValue(new Error("test error"));
        const response = service.getRoleplay(roleplayID, auth);
        await expect(response).rejects.toThrow(new Error("test error"));
    });
});

describe('getRoleplayChatList', () => {
    const auth = {id : "testId"};
    
    test('getRoleplayChatList 맞춤형 롤플레이 성공', async () =>{
        const roleplayID = "rptest";
        dynamoDB.get.mockResolvedValue({ 
            Item: {
                chatList: [{chat: "teatChat"}], 
            } 
        });
        const response = await service.getRoleplayChatList(roleplayID, auth);
        expect(dynamoDB.get).toBeCalledTimes(1);  
        expect(response.roleplayID).toEqual(roleplayID);
        expect(response.chatList).toEqual([{chat: "teatChat"}]);
    });
    
    test('getRoleplayChatList 공식 롤플레이 성공', async () =>{
        const roleplayID = "otest";
        dynamoDB.get.mockResolvedValue({ 
            Item: {
                chatList: [{chat: "teatChat"}], 
            } 
        });
        const response = await service.getRoleplayChatList(roleplayID, auth);
        expect(dynamoDB.get).toBeCalledTimes(1);  
        expect(response.roleplayID).toEqual(roleplayID);
        expect(response.chatList).toEqual([{chat: "teatChat"}]);
    });
    
    test('getRoleplayChatList 학습 기록 있는 공식 롤플레이 성공', async () =>{
        const roleplayID = "rotest";
        dynamoDB.get.mockResolvedValue({ 
            Item: {
                chatList: [{chat: "teatChat"}], 
            } 
        });
        const response = await service.getRoleplayChatList(roleplayID, auth);
        expect(dynamoDB.get).toBeCalledTimes(1);  
        expect(response.roleplayID).toEqual(roleplayID);
        expect(response.chatList).toEqual([{chat: "teatChat"}]);
    });
    
    test('getRoleplayChatList 실패', async () =>{
        const roleplayID = "rptest";
        dynamoDB.get.mockRejectedValue(new Error("test error"));
        const response = service.getRoleplayChatList(roleplayID, auth);
        await expect(response).rejects.toThrow(new Error("test error"));
    });
})


