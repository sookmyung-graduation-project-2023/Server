import { handler } from './index.js';
import controller from './controller.js';
jest.mock('./controller');

beforeEach(() => {
    jest.clearAllMocks();
  });

describe('index Basic', () => {
    test('잘못된 API path 라우터는 404 에러가 발생한다', async () => {
        const event = {
            routeKey: "POST /wrongPath",
            headers: {
                authorization: "Bearer testAccesstoken"
            }
        };
        controller.auth.mockResolvedValue({
            ok: true
        });
        const response = await handler(event);
        expect(response.statusCode).toEqual(404);
        const responseBody = JSON.parse(response.body);
        expect(responseBody.status).toEqual(404);
        expect(responseBody.success).toEqual(false);
        expect(responseBody.message).toEqual("잘못된 API Path로 인한 실패");
    });
    
    test('빈 accessToken으로 인한 실패', async () => {
        const event = {
            routeKey: "POST /path",
            headers: {
                authorization: "Bearer"
            }
        };
        const response = await handler(event);
        expect(response.statusCode).toEqual(401);
        const responseBody = JSON.parse(response.body);
        expect(responseBody.status).toEqual(401);
        expect(responseBody.success).toEqual(false);
        expect(responseBody.message).toEqual("빈 accessToken으로 인한 실패");
    });
    
    test('accessToken 만료로 인한 실패. Token Refresh 필요', async () => {
        const event = {
            routeKey: "POST /path",
            headers: {
                authorization: "Bearer testAccesstoken"
            }
        };
        controller.auth.mockResolvedValue({
            ok: false
        });
        const response = await handler(event);
        expect(response.statusCode).toEqual(401);
        const responseBody = JSON.parse(response.body);
        expect(responseBody.status).toEqual(401);
        expect(responseBody.success).toEqual(false);
        expect(responseBody.message).toEqual("accessToken 만료로 인한 실패. Token Refresh 필요");
    });
    
    test('GET /roleplayList/official 공식 롤플레이 리스트 불러오기 성공', async () => {
        const event = {
            routeKey: "GET /roleplayList/official",
            headers: {
                authorization: "Bearer testAccesstoken"
            },
            queryStringParameters: {
                category: "testCategory"
            }
        };
        controller.auth.mockResolvedValue({
            ok: true
        });
        controller.getOfficialRoleplayList.mockResolvedValue({
            status: 200,
            success: true,
            message: "공식 롤플레이 리스트 불러오기 성공",
            data: "testData",
        });
        const response = await handler(event);
        expect(controller.getOfficialRoleplayList).toHaveBeenCalledTimes(1);
        expect(response.statusCode).toEqual(200);
        const responseBody = JSON.parse(response.body);
        expect(responseBody.status).toEqual(200);
        expect(responseBody.message).toEqual("공식 롤플레이 리스트 불러오기 성공");
    });
    
    test('GET /roleplayList/personal 맞춤형 롤플레이 리스트 불러오기 성공', async () => {
        const event = {
            routeKey: "GET /roleplayList/personal",
            headers: {
                authorization: "Bearer testAccesstoken"
            }
        };
        controller.auth.mockResolvedValue({
            ok: true
        });
        controller.getPersonalRoleplayList.mockResolvedValue({
            status: 200,
            success: true,
            message: "맞춤형 롤플레이 리스트 불러오기 성공",
            data: "testData",
        });
        const response = await handler(event);
        expect(controller.getPersonalRoleplayList).toHaveBeenCalledTimes(1);
        expect(response.statusCode).toEqual(200);
        const responseBody = JSON.parse(response.body);
        expect(responseBody.status).toEqual(200);
        expect(responseBody.message).toEqual("맞춤형 롤플레이 리스트 불러오기 성공");
    });
    
    test('GET /roleplay/{roleplayID} 롤플레이 불러오기 성공', async () => {
        const event = {
            routeKey: "GET /roleplay/{roleplayID}",
            headers: {
                authorization: "Bearer testAccesstoken"
            },
            pathParameters: {
                roleplayID: "testRoleplayID"
            }
        };
        controller.auth.mockResolvedValue({
            ok: true
        });
        controller.getRoleplay.mockResolvedValue({
            status: 200,
            success: true,
            message: "롤플레이 불러오기 성공",
            data: "testData",
        });
        const response = await handler(event);
        expect(controller.getRoleplay).toHaveBeenCalledTimes(1);
        expect(response.statusCode).toEqual(200);
        const responseBody = JSON.parse(response.body);
        expect(responseBody.status).toEqual(200);
        expect(responseBody.message).toEqual("롤플레이 불러오기 성공");
    });
    
    test('GET /roleplay/chatList/{roleplayID} 롤플레이 채팅 리스트 불러오기 성공', async () => {
        const event = {
            routeKey: "GET /roleplay/chatList/{roleplayID}",
            headers: {
                authorization: "Bearer testAccesstoken"
            },
            pathParameters: {
                roleplayID: "testRoleplayID"
            }
        };
        controller.auth.mockResolvedValue({
            ok: true
        });
        controller.getRoleplayChatList.mockResolvedValue({
            status: 200,
            success: true,
            message: "롤플레이 채팅 리스트 불러오기 성공",
            data: "testData",
        });
        const response = await handler(event);
        expect(controller.getRoleplayChatList).toHaveBeenCalledTimes(1);
        expect(response.statusCode).toEqual(200);
        const responseBody = JSON.parse(response.body);
        expect(responseBody.status).toEqual(200);
        expect(responseBody.message).toEqual("롤플레이 채팅 리스트 불러오기 성공");
    });
});