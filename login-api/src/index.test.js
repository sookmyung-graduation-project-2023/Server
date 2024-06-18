import { handler } from './index.js';
import controller from './controller.js';
jest.mock('./controller');

beforeEach(() => {
    controller.login.mockClear();
    controller.refresh.mockClear();
  });

describe('index Basic', () => {
    test('잘못된 API path 라우터는 400에러가 발생한다', async () => {
        const event = {
            routeKey: "POST /wrongPath"
        };
        const response = await handler(event);
        expect(response.statusCode).toEqual(400);
        
        const responseBody = JSON.parse(response.body);
        expect(responseBody.status).toEqual(400);
        expect(responseBody.success).toEqual(false);
        expect(responseBody.message).toEqual("잘못된 API path로 인한 실패");
    });
    
    test('정상적 POST /login 요청에 controller.login이 호출된다', async () => {
        const body = {
            id: "12345",
            email: "123@gmail.com",
            name: "testName",
            deviceToken: "test"
        };
        const event = {
            routeKey: "POST /login",
            body: JSON.stringify(body)
        };
        controller.login.mockResolvedValue({
            status: 201
        });

        const response = await handler(event);
        expect(controller.login).toBeCalledTimes(1);
        expect(controller.refresh).toBeCalledTimes(0);
    });
    
    test('정상적 GET /refresh 요청에 controller.refresh가 호출된다.', async () => {
        const event = {
            routeKey: "GET /refresh",
            headers: {
                authorization: "Bearer testAccessToken",
                refresh: "testRefreshtoken",
                devicetoken: "testDevicetoken"
            }
        };
        controller.refresh.mockResolvedValue({
            status: 201
        });

        const response = await handler(event);
        expect(controller.refresh).toBeCalledTimes(1);
        expect(controller.login).toBeCalledTimes(0);
    });
});