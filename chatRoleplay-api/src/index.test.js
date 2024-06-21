import { handler } from './index.js';
import controller from './controller.js';
jest.mock('./controller.js');

beforeEach(() => {
    jest.clearAllMocks();
  });

describe('index Basic', () => {
    test('잘못된 API path 라우터는 404 에러가 발생한다', async () => {
        const event = {
            routeKey: "POST /wrongPath",
            headers: {
                authorization: "Bearer testAccesstoken"
            },
            body: '{"test": "test"}'
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
    
    test('accessToken 만료로 인한 실패. Token Refresh 필요', async () => {
        const event = {
            routeKey: "POST /path",
            headers: {
                authorization: "Bearer testAccesstoken"
            },
            body:  '{"test": "test"}'
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
    
    test('POST /roleplay/newTopic 새로운 롤플레이 생성', async () => {
        const event = {
            routeKey: "POST /roleplay/newTopic",
            headers: {
                authorization: "Bearer testAccesstoken"
            },
            body:  '{"test": "test"}'
        };
        controller.auth.mockResolvedValue({
            ok: true
        });
        controller.createNewTopicRolePlay.mockResolvedValue({
            status: 200,
            success: true,
            message: "역할극 생성 성공",
            data: {test: "test"},
        });
        const response = await handler(event);
        expect(controller.createNewTopicRolePlay).toHaveBeenCalledTimes(1);
        expect(response.statusCode).toEqual(200);
        const responseBody = JSON.parse(response.body);
        expect(responseBody.status).toEqual(200);
        expect(responseBody.message).toEqual("역할극 생성 성공");
    });
    
    test('POST /roleplay/usedTopic 새로운 롤플레이 생성', async () => {
        const event = {
            routeKey: "POST /roleplay/usedTopic",
            headers: {
                authorization: "Bearer testAccesstoken"
            },
            body:  '{"test": "test"}'
        };
        controller.auth.mockResolvedValue({
            ok: true
        });
        controller.createUsedTopicRolePlay.mockResolvedValue({
            status: 200,
            success: true,
            message: "역할극 생성 성공",
            data: {test: "test"},
        });
        const response = await handler(event);
        expect(controller.createUsedTopicRolePlay).toHaveBeenCalledTimes(1);
        expect(response.statusCode).toEqual(200);
        const responseBody = JSON.parse(response.body);
        expect(responseBody.status).toEqual(200);
        expect(responseBody.message).toEqual("역할극 생성 성공");
    });
    
});