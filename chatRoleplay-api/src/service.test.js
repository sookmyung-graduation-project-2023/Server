import service from "./service.js";
import dynamoDB from "./dynamoDB.js";
import OpenAI from 'openai';
import axios from 'axios';

jest.mock('./dynamoDB.js');
jest.mock('openai');
jest.mock('axios');

OpenAI.mockReturnValue({
    chat: {
        completions:{
            create: jest.fn().mockResolvedValue({
                choices: [{
                    message: {
                    content: '{"emoji": "testEmoji","chatList": [{"text": "text1", "role": "role1"}, {"text": "text2", "role": "role2"}]}'
                }}]
            })
        }
    }
});

afterEach(() => {
    jest.clearAllMocks();
});

describe('createChat', () => {  
    const data = {
        description: "description", 
        role1: "role1", 
        role1Desc: "role1Desc", 
        role1:"role1", 
        role1Desc: "role1Desc", 
        mustWords: ["word1", "word2"],
    };
    const roleplayID = "roleplayID";
    
    test('createChat 성공', async () => {
        const response = await service.createChat(data, roleplayID);
        expect(OpenAI().chat.completions.create).toHaveBeenCalled(); 
        expect(response.emoji).toEqual("testEmoji");
        expect(response.chatList[0].text).toEqual("text1");
        expect(response.chatList[0].role).toEqual("role1");
        expect(response.chatList[1].text).toEqual("text2");
        expect(response.chatList[1].role).toEqual("role2");
    });
});

describe('createNewTopicRolePlay', () => {  
    const data = {
        description: "description", 
        role1: "role1", 
        role1Desc: "role1Desc", 
        role1:"role1", 
        role1Desc: "role1Desc", 
        mustWords: ["word1", "word2"],
    };
    const auth = {id: "testId"};
    
    test('createNewTopicRolePlay 성공', async () => {
        const response = await service.createNewTopicRolePlay(data, auth);
        expect(dynamoDB.put).toHaveBeenCalled();
        expect(dynamoDB.update).toHaveBeenCalled();
        expect(axios.post).toHaveBeenCalled();
        expect(response.roleplayID.slice(0, 2)).toEqual("rp");
        expect(response.gptText.emoji).toEqual("testEmoji");
        expect(response.gptText.chatList[0].text).toEqual("text1");
        expect(response.gptText.chatList[0].role).toEqual("role1");
        expect(response.gptText.chatList[1].text).toEqual("text2");
        expect(response.gptText.chatList[1].role).toEqual("role2");
    });
});

describe('createUsedTopicRolePlay', () => {  
    const data = {
        description: "description", 
        role1: "role1", 
        role1Desc: "role1Desc", 
        role1:"role1", 
        role1Desc: "role1Desc", 
        mustWords: ["word1", "word2"],
        parentRoleplayID: "rpparentRoleplayID"
    };
    const auth = {id: "testId"};
    
    test('createUsedTopicRolePlay 성공', async () => {
        dynamoDB.get.mockResolvedValue({
            Item: {
                Item : "testItem"
            }
        });
        const response = await service.createUsedTopicRolePlay(data, auth);
        expect(dynamoDB.put).toHaveBeenCalled();
        expect(dynamoDB.get).toHaveBeenCalled();
        expect(dynamoDB.update).toHaveBeenCalled();
        expect(axios.post).toHaveBeenCalled();
        expect(response.roleplayID.slice(0, 2)).toEqual("rp");
        expect(response.gptText.emoji).toEqual("testEmoji");
        expect(response.gptText.chatList[0].text).toEqual("text1");
        expect(response.gptText.chatList[0].role).toEqual("role1");
        expect(response.gptText.chatList[1].text).toEqual("text2");
        expect(response.gptText.chatList[1].role).toEqual("role2");
    });
    
    test('createUsedTopicRolePlay 성공', async () => {
        dynamoDB.get.mockResolvedValue({
            Item: null
        });
        const response = service.createUsedTopicRolePlay(data, auth);
        await expect(response).rejects.toThrow(new Error("부모 역할극 ID 비정상"));
        expect(dynamoDB.put).toHaveBeenCalled();
        expect(dynamoDB.get).toHaveBeenCalled();
    });
});
