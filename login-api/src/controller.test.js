import controller from './controller.js';
import service from "./service.js";
jest.mock('./service.js');

beforeEach(() => {
    service.login.mockClear();
    service.refresh.mockClear();
  });

describe('controller login', () => {
    const data = {
        id: "12345",
        email: "123@gmail.com",
        name: "testName",
        deviceToken: "test"
    };
    
    test('login 빈 값으로 인한 로그인 실패', async () =>{
        const dataWithNull = {
            id: null,
            email: "123@gmail.com",
            name: "testName",
            deviceToken: "test"
        };
        const response = await controller.login(dataWithNull);
        expect(service.login).toBeCalledTimes(0);
        expect(response.status).toEqual(400);
        expect(response.success).toEqual(false);
        expect(response.message).toEqual("빈 값으로 인한 로그인 실패");
    });
    
    test('정상 login', async () =>{
        const serviceData = {
            UID: "12345",
            email: data.email,
            name: data.name,
            accessToken: "testAccessToken",
            refreshToken: "testRefreshToken",
        };
        service.login.mockResolvedValue({
            message: "로그인 성공",
            data: serviceData
        });
        const response = await controller.login(data);
        expect(service.login).toBeCalledTimes(1);
        expect(service.login).toBeCalledWith(data);
        expect(response.status).toEqual(201);
        expect(response.success).toEqual(true);
        expect(response.message).toEqual("로그인 성공");
        expect(response.data).toEqual(serviceData);
    });
    
    test('login 400 에러 발생', async () =>{
        const error400 = new Error("400 error");
        error400.statusCode = 400;
        service.login.mockRejectedValue(
            error400
        );
        const response = await controller.login(data);
        expect(service.login).toBeCalledTimes(1);
        expect(service.login).toBeCalledWith(data);
        expect(response.status).toEqual(400);
        expect(response.success).toEqual(false);
        expect(response.message).toEqual("400 error");
    });
    
    test('login unexpected 에러 발생', async () =>{
        const error500 = new Error("unexpected error");
        error500.statusCode = 500;
        service.login.mockRejectedValue(
            error500
        );
        const response = await controller.login(data);
        expect(service.login).toBeCalledTimes(1);
        expect(service.login).toBeCalledWith(data);
        expect(response.status).toEqual(500);
        expect(response.success).toEqual(false);
        expect(response.message).toEqual("unexpected error");
    });
});

describe('controller refresh', () => {
    const accessToken = "testAccesstoken";
    const refreshToken = "testRefreshToken";
    const deviceToken = "testDevicetoken";
    
    test('refresh 빈 값으로 인한 토큰 재발급 실패', async () =>{
        const nullAccessToken = null;
        const response = await controller.refresh(nullAccessToken, refreshToken, deviceToken);
        expect(service.refresh).toBeCalledTimes(0);
        expect(response.status).toEqual(400);
        expect(response.success).toEqual(false);
        expect(response.message).toEqual("빈 값으로 인한 토큰 재발급 실패");
    });
    
    test('정상 refresh', async () =>{
        service.refresh.mockResolvedValue({
            accessToken: "newTestAccessToken",
        });
        const response = await controller.refresh(accessToken, refreshToken, deviceToken);
        expect(service.refresh).toBeCalledTimes(1);
        expect(service.refresh).toBeCalledWith(accessToken, refreshToken, deviceToken);
        expect(response.status).toEqual(201);
        expect(response.success).toEqual(true);
        expect(response.data).toEqual({
            accessToken: "newTestAccessToken",
        });
        expect(response.message).toEqual("토큰 재발급 성공");
    });
    
    test('refresh 400 에러 발생', async () =>{
        const error400 = new Error("400 error");
        error400.statusCode = 400;
        service.refresh.mockRejectedValue(
            error400
        );
        const response = await controller.refresh(accessToken, refreshToken, deviceToken);
        expect(service.refresh).toBeCalledTimes(1);
        expect(service.refresh).toBeCalledWith(accessToken, refreshToken, deviceToken);
        expect(response.status).toEqual(400);
        expect(response.success).toEqual(false);
        expect(response.message).toEqual("400 error");
    });
    
    test('refresh unexpected 에러 발생', async () =>{
        const error500 = new Error("unexpected error");
        error500.statusCode = 500;
        service.refresh.mockRejectedValue(
            error500
        );
        const response = await controller.refresh(accessToken, refreshToken, deviceToken);
        expect(service.refresh).toBeCalledTimes(1);
        expect(service.refresh).toBeCalledWith(accessToken, refreshToken, deviceToken);
        expect(response.status).toEqual(500);
        expect(response.success).toEqual(false);
        expect(response.message).toEqual("unexpected error");
    });
});