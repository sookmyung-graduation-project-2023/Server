import service from "./service.js";
import dynamoDB from "./dynamoDB.js";
import { SNSClient, CreatePlatformEndpointCommand } from "@aws-sdk/client-sns";
import jwt from "jsonwebtoken";

jest.mock('./dynamoDB.js');
jest.mock('@aws-sdk/client-sns');
jest.mock('jsonwebtoken');

SNSClient.mockReturnValue({
    send: jest.fn().mockResolvedValue({
        EndpointArn: "testEndpointArn"
    })
});
jwt.sign.mockReturnValue("testToken");
jwt.sign.mockReturnValue("testToken");

afterEach(() => {
    jest.clearAllMocks();
});

describe('createPlatformEndpoint', () => {      
    test('createPlatformEndpoint', async () =>{
        await service.createPlatformEndpoint();
        expect(SNSClient().send).toBeCalledTimes(1); 
        expect(CreatePlatformEndpointCommand).toBeCalledTimes(1); 
    });
});


describe('userSignUp', () => {    
    const data = {
        id: "1234",
        email: "123@gmail.com",
        name: "testName",
        deviceToken: "testDeviceToken"
    };
    const userID ="u" + data.id;
    const refreshToken = "testRefreshToken";
    
    test('userSignUp 플랫폼 엔드포인트 생성 후 dynamoDB를 추가 한다.', async () =>{
        await service.userSignUp(userID, data, refreshToken);
        expect(SNSClient().send).toBeCalledTimes(1); 
        expect(dynamoDB.put).toHaveBeenCalled(); 
    });
});


describe('userLogin', () => {    
    const data = {
        id: "1234",
        email: "123@gmail.com",
        name: "testName",
        deviceToken: "testDeviceToken"
    };
    const userID ="u" + data.id;
    const refreshToken = "testRefreshToken";
    
    test('userLogin 해당 디바이스로 로그인 기록이 있으면 dynamoDB 업데이트만 한다.', async () =>{
        dynamoDB.get.mockResolvedValue({
            Item: true
        });
        await service.userLogin(userID, data, refreshToken);
        expect(dynamoDB.update).toBeCalledTimes(1); 
    });
    
    test('userLogin 해당 디바이스로 로그인 기록이 없으면 플랫폼 엔드포인트 생성 후 dynamoDB를 추가 한다.', async () =>{
        dynamoDB.get.mockResolvedValue({
            Item: false
        });
        await service.userLogin(userID, data, refreshToken);
        expect(SNSClient().send).toBeCalledTimes(1); 
        expect(dynamoDB.put).toBeCalledTimes(1); 
    });
});
  

describe('service login', () => {
    const data = {
        id: "12345",
        email: "123@gmail.com",
        name: "testName",
        deviceToken: "testDeviceToken"
    }; 

    test('login 로그인 성공', async () => {  
        dynamoDB.get.mockResolvedValue({
            Item: true
        });
        const response = await service.login(data);
        expect(dynamoDB.get).toHaveBeenCalled();
        expect(response.message).toEqual("로그인 성공"); 
        expect(response.data).toEqual({ 
            UID: "u" + data.id,
            email: data.email,
            name: data.name,
            accessToken: "testToken",
            refreshToken: "testToken",
        });
    });
    
    test('login 회원가입 성공', async () => {  
        dynamoDB.get.mockResolvedValue({
            Item: false
        });
        const response = await service.login(data);
        expect(dynamoDB.get).toHaveBeenCalled();
        expect(response.message).toEqual("회원가입 성공"); 
        expect(response.data).toEqual({ 
            UID: "u" + data.id,
            email: data.email,
            name: data.name,
            accessToken: "testToken",
            refreshToken: "testToken",
        });
    });
});

describe('service refresh', () => {
    const accessToken = "testAccessToken";
    const refreshToken = "testRefreshToken";
    const deviceToken = "testDeviceToken";
    
    test('refresh 비정상 access token으로 인한 실패', async () => {
        jwt.decode.mockReturnValue(null);
        const response = service.refresh(accessToken, refreshToken, deviceToken);
        await expect(response).rejects.toThrow(new Error("비정상 access token으로 인한 실패"));
    }); 
    
    test('refresh 만료되지 않은 access token으로 인한 실패', async () => {
        jwt.decode.mockReturnValue(true);
        jwt.verify.mockReturnValueOnce({
            id: "testId",
        });
        const response = service.refresh(accessToken, refreshToken, deviceToken);
        await expect(response).rejects.toThrow(new Error("만료되지 않은 access token으로 인한 실패"));
    });
     
    test('refresh 비정상 refresh token으로 인한 실패', async () => {
        jwt.decode.mockReturnValue(true);
        jwt.verify.mockImplementationOnce(() => {throw new Error('test error')});
        dynamoDB.get.mockResolvedValue({
            Item: false
        });
        const response = service.refresh(accessToken, refreshToken, deviceToken);
        await expect(response).rejects.toThrow(new Error("비정상 refresh token으로 인한 실패"));
    }); 
     
    test('refresh refresh token의 불일치로 인한 실패', async () => {
        jwt.decode.mockReturnValue(true);
        jwt.verify.mockImplementationOnce(() => {throw new Error('test error')});
        dynamoDB.get.mockResolvedValue({
            Item: {
                rfToken : "diff_rfToken"
            }
        });
        const response = service.refresh(accessToken, refreshToken, deviceToken);
        await expect(response).rejects.toThrow(new Error("refresh token의 불일치로 인한 실패"));
    }); 
     
    test('refresh 만료된 refresh token으로 인한 실패 login 필요', async () => {
        jwt.decode.mockReturnValue(true);
        jwt.verify.mockImplementationOnce(() => {throw new Error('test error')});
        dynamoDB.get.mockResolvedValue({
            Item: {
                rfToken : "testRefreshToken"
            }
        });
        const response = service.refresh(accessToken, refreshToken, deviceToken);
        await expect(response).rejects.toThrow(new Error("만료된 refresh token으로 인한 실패 login 필요"));
    }); 
    
    test('refresh 정상 실행', async () => {
        jwt.decode.mockReturnValue(true);
        jwt.verify
            .mockImplementationOnce(() => {throw new Error('test error')})
            .mockReturnValueOnce({ id: "testId" });
        dynamoDB.get.mockResolvedValue({
            Item: {
                rfToken : "testRefreshToken"
            }
        });
        const response = await service.refresh(accessToken, refreshToken, deviceToken);
        expect(jwt.sign).toHaveBeenCalledTimes(1);
        expect(response).toEqual({
            accessToken: "testToken"
        });
    }); 
});

describe('token', () => {
    const id = "testId"; 
    const accessToken = "testAccessToken";
    
    test('getAccessToken', async () => {
        const response = service.getAccessToken(id);
        expect(jwt.sign).toHaveBeenCalledTimes(1);
        expect(response).toEqual("testToken");
    }); 
    
    test('getRefreshToken', async () => {
        const response = service.getRefreshToken(id);
        expect(jwt.sign).toHaveBeenCalledTimes(1);
        expect(response).toEqual("testToken");
    }); 
    
    test('verifyToken 유효 기간 지남', async () => {
        jwt.verify.mockImplementationOnce(() => {throw new Error('test error')})
        const response = await service.verifyToken(accessToken);
        expect(response.ok).toEqual(false);
    }); 
    
    test('verifyToken 유효 기간 유효함', async () => {
        jwt.verify.mockReturnValueOnce({ id: "testId" });
        const response = await service.verifyToken(accessToken);
        expect(response.ok).toEqual(true);
    }); 
});