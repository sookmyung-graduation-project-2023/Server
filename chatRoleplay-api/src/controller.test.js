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
});

describe('controller createNewTopicRolePlay', () => {
    const data = {
        title: "testTitle",
        description: "description",
        role1: "role1",
        role1Desc: "role1Desc",
        role1Type: "role1Type",
        role2: "role2",
        role2Desc: "role2Desc",
        role2Type: "role2Type",
        mustWords: []
    };
    const auth = "testAuth";
    
    test('createNewTopicRolePlay 빈 값으로 인한 로그인 실패', async () =>{
        const dataWithNull = { };
        const response = await controller.createNewTopicRolePlay(dataWithNull);
        expect(service.createNewTopicRolePlay).toBeCalledTimes(0);
        expect(response.status).toEqual(400);
        expect(response.success).toEqual(false);
        expect(response.message).toEqual("빈 값으로 인한 생성 실패");
    });
    
    test('createNewTopicRolePlay 역할극 생성 시작', async () =>{
        service.createNewTopicRolePlay.mockResolvedValue({
            data: "serviceData"
        });
        const response = await controller.createNewTopicRolePlay(data, auth);
        expect(service.createNewTopicRolePlay).toBeCalledTimes(1);
        expect(service.createNewTopicRolePlay).toBeCalledWith(data, auth);
        expect(response.status).toEqual(201);
        expect(response.success).toEqual(true);
        expect(response.message).toEqual("역할극 생성 시작");
        expect(response.data).toEqual({
            data: "serviceData"
        });
    });
       
    test('createNewTopicRolePlay unexpected 에러 발생', async () =>{
        const error = new Error("unexpected error");
        error.statusCode = 500;
        service.createNewTopicRolePlay.mockRejectedValue(
            error
        );
        const response = await controller.createNewTopicRolePlay(data, auth);
        expect(service.createNewTopicRolePlay).toBeCalledTimes(1);
        expect(service.createNewTopicRolePlay).toBeCalledWith(data, auth);
        expect(response.status).toEqual(500);
        expect(response.success).toEqual(false);
        expect(response.message).toEqual("unexpected error");
    });
});


describe('controller createUsedTopicRolePlay', () => {
    const data = {
        title: "testTitle",
        parentRoleplayID: "parentRoleplayID",
        mustWords: []
    };
    const auth = "testAuth";
    
    test('createUsedTopicRolePlay 빈 값으로 인한 로그인 실패', async () =>{
        const dataWithNull = { };
        const response = await controller.createUsedTopicRolePlay(dataWithNull);
        expect(service.createUsedTopicRolePlay).toBeCalledTimes(0);
        expect(response.status).toEqual(400);
        expect(response.success).toEqual(false);
        expect(response.message).toEqual("빈 값으로 인한 전송 실패");
    });
    
    test('createUsedTopicRolePlay 역할극 생성 시작', async () =>{
        service.createUsedTopicRolePlay.mockResolvedValue({
            data: "serviceData"
        });
        const response = await controller.createUsedTopicRolePlay(data, auth);
        expect(service.createUsedTopicRolePlay).toBeCalledTimes(1);
        expect(service.createUsedTopicRolePlay).toBeCalledWith(data, auth);
        expect(response.status).toEqual(201);
        expect(response.success).toEqual(true);
        expect(response.message).toEqual("역할극 생성 시작");
        expect(response.data).toEqual({
            data: "serviceData"
        });
    });
       
    test('createUsedTopicRolePlay unexpected 에러 발생', async () =>{
        const error = new Error("unexpected error");
        error.statusCode = 500;
        service.createUsedTopicRolePlay.mockRejectedValue(
            error
        );
        const response = await controller.createUsedTopicRolePlay(data, auth);
        expect(service.createUsedTopicRolePlay).toBeCalledTimes(1);
        expect(service.createUsedTopicRolePlay).toBeCalledWith(data, auth);
        expect(response.status).toEqual(500);
        expect(response.success).toEqual(false);
        expect(response.message).toEqual("unexpected error");
    });
});