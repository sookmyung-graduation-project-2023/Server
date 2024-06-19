import { describe } from 'node:test';
import controller from './controller.js';
import service from "./service.js";
import jwt from "jsonwebtoken";

jest.mock('./service.js');
jest.mock('jsonwebtoken');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('controller auth', () => {
    const accessToken = "testAccessToken";
    test('auth verify 성공 시 ok는 true이다.', async () => {
        jwt.verify.mockReturnValueOnce({
            id: "testId",
        });
        const response = await controller.auth(accessToken);
        expect(jwt.verify).toBeCalledTimes(1);
        expect(response.ok).toEqual(true);
        expect(response.id).toEqual("testId");
    });
    
    test('auth verify 실패 시 ok는 false이다.', async () => {
        jwt.verify.mockImplementationOnce(() => {throw new Error('test error')});
        const response = await controller.auth(accessToken);
        expect(jwt.verify).toBeCalledTimes(1);
        expect(response.ok).toEqual(false);
        expect(response.message).toEqual('test error');
    });
})

describe('controller getOfficialRoleplayList', async () => {
    const auth = "testAuth";
    const queryStringParameters = {
        category: "testQueryStringParameters"
    };
    
    test('잘못된 쿼리 스트링으로 인한 오류', async () => {
        const wrong_queryStringParameters = {
            test: "testQueryStringParameters"
        };
        const response = await controller.getOfficialRoleplayList(wrong_queryStringParameters, auth);
        expect(service.getOfficialRoleplayList).toBeCalledTimes(0);
        expect(response.status).toEqual(400);
        expect(response.success).toEqual(false);
        expect(response.message).toEqual("잘못된 쿼리 스트링으로 인한 오류");
    });
    
    test('카테고리를 활용한 공식 롤플레이 리스트 불러오기 성공', async () => {
        service.getOfficialRoleplayList.mockResolvedValue({
            data: "serviceData"
        });
        const response = await controller.getOfficialRoleplayList(queryStringParameters, auth);
        expect(service.getOfficialRoleplayList).toBeCalledTimes(1);
        expect(response.status).toEqual(200);
        expect(response.success).toEqual(true);
        expect(response.message).toEqual("공식 롤플레이 리스트 불러오기 성공");
    });
    
    test('공식 롤플레이 리스트 불러오기 성공', async () => {
        service.getOfficialRoleplayList.mockResolvedValue({
            data: "serviceData"
        });
        const response = await controller.getOfficialRoleplayList(null, auth);
        expect(service.getOfficialRoleplayList).toBeCalledTimes(1);
        expect(response.status).toEqual(200);
        expect(response.success).toEqual(true);
        expect(response.message).toEqual("공식 롤플레이 리스트 불러오기 성공");
    });
    
    test('400 에러 발생', async () => {
        const error400 = new Error("400 error");
        error400.statusCode = 400;
        service.getOfficialRoleplayList.mockRejectedValue(error400);
        const response = await controller.getOfficialRoleplayList(queryStringParameters, auth);
        expect(service.getOfficialRoleplayList).toBeCalledTimes(1);
        expect(response.status).toEqual(400);
        expect(response.success).toEqual(false);
        expect(response.message).toEqual("400 error");
    });
    
    test('500 에러 발생', async () => {
        const error500 = new Error("500 error");
        error500.statusCode = 500;
        service.getOfficialRoleplayList.mockRejectedValue(error500);
        const response = await controller.getOfficialRoleplayList(queryStringParameters, auth);
        expect(service.getOfficialRoleplayList).toBeCalledTimes(1);
        expect(response.status).toEqual(500);
        expect(response.success).toEqual(false);
        expect(response.message).toEqual("500 error");
    });
});


describe('controller getPersonalRoleplayList', async () => {
    const auth = "testAuth";
    
    test('맞춤형 롤플레이 리스트 불러오기 성공', async () => {
        service.getPersonalRoleplayList.mockResolvedValue({
            data: "serviceData"
        });
        const response = await controller.getPersonalRoleplayList(auth);
        expect(service.getPersonalRoleplayList).toBeCalledTimes(1);
        expect(response.status).toEqual(200);
        expect(response.success).toEqual(true);
        expect(response.message).toEqual("맞춤형 롤플레이 리스트 불러오기 성공");
    });
    
    test('400 에러 발생', async () => {
        const error400 = new Error("400 error");
        error400.statusCode = 400;
        service.getPersonalRoleplayList.mockRejectedValue(error400);
        const response = await controller.getPersonalRoleplayList(auth);
        expect(service.getPersonalRoleplayList).toBeCalledTimes(1);
        expect(response.status).toEqual(400);
        expect(response.success).toEqual(false);
        expect(response.message).toEqual("400 error");
    });
    
    test('500 에러 발생', async () => {
        const error500 = new Error("500 error");
        error500.statusCode = 500;
        service.getPersonalRoleplayList.mockRejectedValue(error500);
        const response = await controller.getPersonalRoleplayList(auth);
        expect(service.getPersonalRoleplayList).toBeCalledTimes(1);
        expect(response.status).toEqual(500);
        expect(response.success).toEqual(false);
        expect(response.message).toEqual("500 error");
    });
});

describe('controller getRoleplay', async () => {
    const auth = "testAuth";
    const roleplayID = "testRoleplayID";
    
    test('빈 roleplayID 값으로 인한 실패', async () => {
        const nullRoleplayID = null;
        const response = await controller.getRoleplay(nullRoleplayID, auth);
        expect(service.getRoleplay).toBeCalledTimes(0);
        expect(response.status).toEqual(400);
        expect(response.success).toEqual(false);
        expect(response.message).toEqual("빈 roleplayID 값으로 인한 실패");
    });
    
    test('롤플레이 불러오기 성공', async () => {
        service.getRoleplay.mockResolvedValue({
            data: "serviceData"
        });
        const response = await controller.getRoleplay(roleplayID, auth);
        expect(service.getRoleplay).toBeCalledTimes(1);
        expect(response.status).toEqual(200);
        expect(response.success).toEqual(true);
        expect(response.message).toEqual("롤플레이 불러오기 성공");
    });
    
    test('에러 발생', async () => {
        const error500 = new Error("500 error");
        error500.statusCode = 500;
        service.getRoleplay.mockRejectedValue(error500);
        const response = await controller.getRoleplay(roleplayID, auth)
        expect(service.getRoleplay).toBeCalledTimes(1);
        expect(response.status).toEqual(500);
        expect(response.success).toEqual(false);
        expect(response.message).toEqual("500 error");
    });
});

describe('controller getRoleplayChatList', async () => {
    const auth = "testAuth";
    const roleplayID = "testRoleplayID";
    
    test('빈 roleplayID 값으로 인한 실패', async () => {
        const nullRoleplayID = null;
        const response = await controller.getRoleplayChatList(nullRoleplayID, auth);
        expect(service.getRoleplayChatList).toBeCalledTimes(0);
        expect(response.status).toEqual(400);
        expect(response.success).toEqual(false);
        expect(response.message).toEqual("빈 roleplayID 값으로 인한 실패");
    });
    
    test('롤플레이 채팅 리스트 불러오기 성공', async () => {
        service.getRoleplayChatList.mockResolvedValue({
            data: "serviceData"
        });
        const response = await controller.getRoleplayChatList(roleplayID, auth);
        expect(service.getRoleplayChatList).toBeCalledTimes(1);
        expect(response.status).toEqual(200);
        expect(response.success).toEqual(true);
        expect(response.message).toEqual("롤플레이 채팅 리스트 불러오기 성공");
    });
    
    test('에러 발생', async () => {
        const error500 = new Error("500 error");
        error500.statusCode = 500;
        service.getRoleplayChatList.mockRejectedValue(error500);
        const response = await controller.getRoleplayChatList(roleplayID, auth)
        expect(service.getRoleplayChatList).toBeCalledTimes(1);
        expect(response.status).toEqual(500);
        expect(response.success).toEqual(false);
        expect(response.message).toEqual("500 error");
    });
});