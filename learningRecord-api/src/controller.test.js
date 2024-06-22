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

describe('controller postLearningRecord', () => {
    const roleplayID = "testRoleplayID";
    const data = {
        title: "testTitle",
        study: {
			sentenceList: [
				{roleType: "man", role: "카페 직원", sentence:"안녕하세요", check:[[0, "안녕하세요"]]},
			],
		    totalTime: 100000,
		    correctRate: 0.5
	    },
        sentenceCnt: 1,
        emoji: "testEmoji"
    };
    const auth = "testAuth";
    
    test('postLearningRecord 빈 roleplayID 값으로 인한 실패', async () =>{
        const roleplayIDNull = null;
        const response = await controller.postLearningRecord(roleplayIDNull, data, auth);
        expect(service.postLearningRecord).toBeCalledTimes(0);
        expect(response.status).toEqual(400);
        expect(response.success).toEqual(false);
        expect(response.message).toEqual("빈 roleplayID 값으로 인한 실패");
    });
    
    test('postLearningRecord 빈 값으로 인한 실패', async () =>{
        const dataWithNull = {
            title: "testTitle",
            study: null,
            sentenceCnt: 1,
            emoji: "testEmoji"
        };
        const response = await controller.postLearningRecord(roleplayID, dataWithNull, auth);
        expect(service.postLearningRecord).toBeCalledTimes(0);
        expect(response.status).toEqual(400);
        expect(response.success).toEqual(false);
        expect(response.message).toEqual("빈 값으로 인한 실패");
    });
    
    test('postLearningRecord 요소가 누락된 study 값으로 인한 실패', async () =>{
        const dataWithNull = {
            title: "testTitle",
            study: {
                sentenceList: null,
                totalTime: 100000,
                correctRate: 0.5
            },
            sentenceCnt: 1,
            emoji: "testEmoji"
        };
        const response = await controller.postLearningRecord(roleplayID, dataWithNull, auth);
        expect(service.postLearningRecord).toBeCalledTimes(0);
        expect(response.status).toEqual(400);
        expect(response.success).toEqual(false);
        expect(response.message).toEqual("요소가 누락된 study 값으로 인한 실패");
    });
    
    test('postLearningRecord 학습 기록 생성 성공', async () =>{
        const response = await controller.postLearningRecord(roleplayID, data, auth);
        expect(service.postLearningRecord).toBeCalledTimes(1);
        expect(service.postLearningRecord).toBeCalledWith(roleplayID, data, auth);
        expect(response.status).toEqual(200);
        expect(response.success).toEqual(true);
        expect(response.message).toEqual("학습 기록 생성 성공");
    });
       
    test('postLearningRecord unexpected 에러 발생', async () =>{
        const error = new Error("unexpected error");
        error.statusCode = 500;
        service.postLearningRecord.mockRejectedValue(
            error
        );
        const response = await controller.postLearningRecord(roleplayID, data, auth);
        expect(service.postLearningRecord).toBeCalledTimes(1);
        expect(service.postLearningRecord).toBeCalledWith(roleplayID, data, auth);
        expect(response.status).toEqual(500);
        expect(response.success).toEqual(false);
        expect(response.message).toEqual("unexpected error");
    });
});

describe('controller getUserlearningData', () => {
    const auth = "testAuth";
    
    test('사용자 학습 기록 불러오기 성공', async () => {
        service.getUserlearningData.mockResolvedValue({
            data: "serviceData"
        });
        const response = await controller.getUserlearningData(auth);
        expect(service.getUserlearningData).toBeCalledTimes(1);
        expect(response.status).toEqual(200);
        expect(response.success).toEqual(true);
        expect(response.message).toEqual("사용자 학습 기록 불러오기 성공");
        expect(response.data).toEqual({
            data: "serviceData"
        });
    });

    test('에러 발생', async () => {
        const error500 = new Error("500 error");
        error500.statusCode = 500;
        service.getUserlearningData.mockRejectedValue(error500);
        const response = await controller.getUserlearningData(auth);
        expect(service.getUserlearningData).toBeCalledTimes(1);
        expect(response.status).toEqual(500);
        expect(response.success).toEqual(false);
        expect(response.message).toEqual("500 error");
    });
});

describe('controller getUserRoleplayList', () => {
    const auth = "testAuth";
    
    test('사용자 역할극 리스트 불러오기 성공', async () => {
        service.getUserRoleplayList.mockResolvedValue({
            data: "serviceData"
        });
        const response = await controller.getUserRoleplayList(auth);
        expect(service.getUserRoleplayList).toBeCalledTimes(1);
        expect(response.status).toEqual(200);
        expect(response.success).toEqual(true);
        expect(response.message).toEqual("사용자 역할극 리스트 불러오기 성공");
        expect(response.data).toEqual({
            data: "serviceData"
        });
    });

    test('에러 발생', async () => {
        const error500 = new Error("500 error");
        error500.statusCode = 500;
        service.getUserRoleplayList.mockRejectedValue(error500);
        const response = await controller.getUserRoleplayList(auth);
        expect(service.getUserRoleplayList).toBeCalledTimes(1);
        expect(response.status).toEqual(500);
        expect(response.success).toEqual(false);
        expect(response.message).toEqual("500 error");
    });
});

describe('controller getUserMonthlyData', () => {
    const auth = "testAuth";
    const queryStringParameters = {
        year: 2024,
        month: 1
    };
    
    test('잘못된 쿼리 스트링으로 인한 오류', async () => {
        const wrong_queryStringParameters = {
            test: "testQueryStringParameters"
        };
        const response = await controller.getUserMonthlyData(wrong_queryStringParameters, auth);
        expect(service.getUserMonthlyData).toBeCalledTimes(0);
        expect(response.status).toEqual(400);
        expect(response.success).toEqual(false);
        expect(response.message).toEqual("잘못된 쿼리 스트링으로 인한 오류");
    });
    
    test('월 표기 오류로 인한 오류', async () => {
        const wrong_queryStringParameters = {
            year: 2024,
            month: 13
        };
        const response = await controller.getUserMonthlyData(wrong_queryStringParameters, auth);
        expect(service.getUserMonthlyData).toBeCalledTimes(0);
        expect(response.status).toEqual(400);
        expect(response.success).toEqual(false);
        expect(response.message).toEqual("월 표기 오류로 인한 오류");
    });
    
    test('월별 사용자 학습 기록 불러오기 성공', async () => {
        service.getUserMonthlyData.mockResolvedValue({
            data: "serviceData"
        });
        const response = await controller.getUserMonthlyData(queryStringParameters, auth);
        expect(service.getUserMonthlyData).toBeCalledTimes(1);
        expect(response.status).toEqual(200);
        expect(response.success).toEqual(true);
        expect(response.message).toEqual("월별 사용자 학습 기록 불러오기 성공");
        expect(response.data).toEqual({
            data: "serviceData"
        });
    });
    
    test('500 에러 발생', async () => {
        const error500 = new Error("500 error");
        error500.statusCode = 500;
        service.getUserMonthlyData.mockRejectedValue(error500);
        const response = await controller.getUserMonthlyData(queryStringParameters, auth);
        expect(service.getUserMonthlyData).toBeCalledTimes(1);
        expect(response.status).toEqual(500);
        expect(response.success).toEqual(false);
        expect(response.message).toEqual("500 error");
    });
});

describe('controller getLearningRecord', () => {
    const recordID = "testRecordID";
    const auth = "testAuth";
    
    test('빈 recordID 값으로 인한 실패', async () => {
        const recordIDNull = null;
        const response = await controller.getLearningRecord(recordIDNull, auth);
        expect(service.getLearningRecord).toBeCalledTimes(0);
        expect(response.status).toEqual(400);
        expect(response.success).toEqual(false);
        expect(response.message).toEqual("빈 recordID 값으로 인한 실패");
    });
    
    test('학습 기록 불러오기 성공', async () => {
        service.getLearningRecord.mockResolvedValue({
            data: "serviceData"
        });
        const response = await controller.getLearningRecord(recordID, auth);
        expect(service.getLearningRecord).toBeCalledTimes(1);
        expect(response.status).toEqual(200);
        expect(response.success).toEqual(true);
        expect(response.message).toEqual("학습 기록 불러오기 성공");
        expect(response.data).toEqual({
            data: "serviceData"
        });
    });
    
    test('500 에러 발생', async () => {
        const error500 = new Error("500 error");
        error500.statusCode = 500;
        service.getLearningRecord.mockRejectedValue(error500);
        const response = await controller.getLearningRecord(recordID, auth);
        expect(service.getLearningRecord).toBeCalledTimes(1);
        expect(response.status).toEqual(500);
        expect(response.success).toEqual(false);
        expect(response.message).toEqual("500 error");
    });
});