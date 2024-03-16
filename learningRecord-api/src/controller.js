import service from "./service.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.jwtSecret;

const OK = 200;
const CREATED =  201;
const NO_CONTENT = 204;
const BAD_REQUEST = 400;
const UNAUTHORIZED = 401;
const FORBIDDEN = 403;
const NOT_FOUND = 404;
const CONFLICT = 409;
const INTERNAL_SERVER_ERROR = 500;
const SERVICE_UNAVAILABLE = 503;
const DB_ERROR = 600;

const auth = async (accessToken) => {
    try {
        const decoded = jwt.verify(accessToken, JWT_SECRET);
        return {
            ok: true,
            id: decoded.id
        };
      } catch (error) {
        return {
            ok: false,
            message: error.message,
        };
    }
};

const postLearningRecord = async (roleplayID, data, auth) => {
    try {
        if (!roleplayID){
            return {
                status: BAD_REQUEST,
                success: false,
                message: "빈 roleplayID 값으로 인한 실패",
            };
        }
        if (!data.study || !data.title || !data.sentenceCnt || !data.emoji){
            return {
                status: BAD_REQUEST,
                success: false,
                message: "빈 값으로 인한 실패",
            };
        }
        if (!data.study.sentenceList || !data.study.totalTime ){
            return {
                status: BAD_REQUEST,
                success: false,
                message: "요소가 누락된 study 값으로 인한 실패",
            };
        }
        await service.postLearningRecord(roleplayID, data, auth);
        return {
            status: OK,
            success: true,
            message: "학습 기록 생성 성공"
        };
    }catch (error){
        return {
        status: INTERNAL_SERVER_ERROR,
        success: false,
        message: error.message,
        };
    }
};

const getUserlearningData = async (auth) =>{
    try {
        const getUserlearningData = await service.getUserlearningData(auth);
        return {
            status: OK,
            success: true,
            message: "사용자 학습 기록 불러오기 성공",
            data: getUserlearningData
        };
    }catch (error){
        return {
        status: INTERNAL_SERVER_ERROR,
        success: false,
        message: error.message,
        };
    }
};

const getUserRoleplayList = async (auth) =>{
    try {
        const getUserRoleplayList = await service.getUserRoleplayList(auth);
        return {
            status: OK,
            success: true,
            message: "사용자 역할극 리스트 불러오기 성공",
            data: getUserRoleplayList
        };
    }catch (error){
        return {
        status: INTERNAL_SERVER_ERROR,
        success: false,
        message: error.message,
        };
    }
};

const getUserMonthlyData = async (queryStringParameters, auth) => {
    try {
        if (!queryStringParameters.year || !queryStringParameters.month){
            return {
                status: BAD_REQUEST,
                success: false,
                message: "잘못된 쿼리 스트링으로 인한 오류",
            };
        }
        if (Number(queryStringParameters.month)<=0 || Number(queryStringParameters.month)>=13){
            return {
                status: BAD_REQUEST,
                success: false,
                message: "월 표기 오류로 인한 오류",
            };
        }
        const getUserMonthlyData = await service.getUserMonthlyData(queryStringParameters, auth);
        return {
            status: OK,
            success: true,
            message: "월별 사용자 학습 기록 불러오기 성공",
            data: getUserMonthlyData
        };
    }catch (error){
        return {
        status: INTERNAL_SERVER_ERROR,
        success: false,
        message: error.message,
        };
    }
};

const getLearningRecord = async (recordID, auth) => {
    try {
        if (!recordID){
            return {
                status: BAD_REQUEST,
                success: false,
                message: "빈 recordID 값으로 인한 실패",
            };
        }
        const getLearningRecord = await service.getLearningRecord(recordID, auth);
        return {
            status: OK,
            success: true,
            message: "학습 기록 불러오기 성공",
            data: getLearningRecord
        };
    }catch (error){
        return {
        status: INTERNAL_SERVER_ERROR,
        success: false,
        message: error.message,
        };
    }
};





export default {
    auth,
    postLearningRecord,
    getUserlearningData,
    getUserRoleplayList,
    getUserMonthlyData,
    getLearningRecord
};