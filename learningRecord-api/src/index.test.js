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
    
    test('POST /learningRecord/{roleplayID} 학습 기록 생성 성공', async () => {
        const event = {
            routeKey: "POST /learningRecord/{roleplayID}",
            headers: {
                authorization: "Bearer testAccesstoken"
            },
            pathParameters: {
                roleplayID: "testRoleplayID"
            },
            body: '{"test": "test"}'
        };
        controller.auth.mockResolvedValue({
            ok: true
        });
        controller.postLearningRecord.mockResolvedValue({
            status: 200,
            success: true,
            message: "학습 기록 생성 성공",
            data: "testData",
        });
        const response = await handler(event);
        expect(controller.postLearningRecord).toHaveBeenCalledTimes(1);
        expect(response.statusCode).toEqual(200);
        const responseBody = JSON.parse(response.body);
        expect(responseBody.status).toEqual(200);
        expect(responseBody.message).toEqual("학습 기록 생성 성공");
    });
    
    test('GET /user/learningData 사용자 학습 기록 불러오기 성공', async () => {
        const event = {
            routeKey: "GET /user/learningData",
            headers: {
                authorization: "Bearer testAccesstoken"
            },
        };
        controller.auth.mockResolvedValue({
            ok: true
        });
        controller.getUserlearningData.mockResolvedValue({
            status: 200,
            success: true,
            message: "사용자 학습 기록 불러오기 성공",
            data: "testData",
        });
        const response = await handler(event);
        expect(controller.getUserlearningData).toHaveBeenCalledTimes(1);
        expect(response.statusCode).toEqual(200);
        const responseBody = JSON.parse(response.body);
        expect(responseBody.status).toEqual(200);
        expect(responseBody.message).toEqual("사용자 학습 기록 불러오기 성공");
    });
    
    test('GET /user/roleplayList 사용자 역할극 리스트 불러오기 성공', async () => {
        const event = {
            routeKey: "GET /user/roleplayList",
            headers: {
                authorization: "Bearer testAccesstoken"
            }
        };
        controller.auth.mockResolvedValue({
            ok: true
        });
        controller.getUserRoleplayList.mockResolvedValue({
            status: 200,
            success: true,
            message: "사용자 역할극 리스트 불러오기 성공",
            data: "testData",
        });
        const response = await handler(event);
        expect(controller.getUserRoleplayList).toHaveBeenCalledTimes(1);
        expect(response.statusCode).toEqual(200);
        const responseBody = JSON.parse(response.body);
        expect(responseBody.status).toEqual(200);
        expect(responseBody.message).toEqual("사용자 역할극 리스트 불러오기 성공");
    });
    
    test('GET /user/monthlyData 월별 사용자 학습 기록 불러오기 성공', async () => {
        const event = {
            routeKey: "GET /user/monthlyData",
            headers: {
                authorization: "Bearer testAccesstoken"
            },
            queryStringParameters: {
                month: 1,
                year: 2024
            }
        };
        controller.auth.mockResolvedValue({
            ok: true
        });
        controller.getUserMonthlyData.mockResolvedValue({
            status: 200,
            success: true,
            message: "월별 사용자 학습 기록 불러오기 성공",
            data: "testData",
        });
        const response = await handler(event);
        expect(controller.getUserMonthlyData).toHaveBeenCalledTimes(1);
        expect(response.statusCode).toEqual(200);
        const responseBody = JSON.parse(response.body);
        expect(responseBody.status).toEqual(200);
        expect(responseBody.message).toEqual("월별 사용자 학습 기록 불러오기 성공");
    });
    
    test('GET /learningRecord/{recordID} 학습 기록 불러오기 성공', async () => {
        const event = {
            routeKey: "GET /learningRecord/{recordID}",
            headers: {
                authorization: "Bearer testAccesstoken"
            },
            pathParameters: {
                recordID: "testRecordID"
            }
        };
        controller.auth.mockResolvedValue({
            ok: true
        });
        controller.getLearningRecord.mockResolvedValue({
            status: 200,
            success: true,
            message: "학습 기록 불러오기 성공",
            data: "testData",
        });
        const response = await handler(event);
        expect(controller.getLearningRecord).toHaveBeenCalledTimes(1);
        expect(response.statusCode).toEqual(200);
        const responseBody = JSON.parse(response.body);
        expect(responseBody.status).toEqual(200);
        expect(responseBody.message).toEqual("학습 기록 불러오기 성공");
    });
});