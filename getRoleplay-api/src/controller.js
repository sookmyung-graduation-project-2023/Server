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
            id: decoded.id,
            name: decoded.name,
        };
      } catch (error) {
        return {
            ok: false,
            message: error.message,
        };
    }
};


const getOfficialRoleplayList = async (queryStringParameters, auth) => {
    try {
        if (queryStringParameters){ //쿼리스트링이 있는데 카테고리가 아닌 경우
            if (!queryStringParameters.category){
                return {
                    status: BAD_REQUEST,
                    success: false,
                    message: "잘못된 쿼리 스트링으로 인한 오류",
                };
            }
        }
        const getOfficialRoleplayList = await service.getOfficialRoleplayList(queryStringParameters, auth);
        return {
            status: OK,
            success: true,
            message: "공식 롤플레이 리스트 불러오기 성공",
            data: getOfficialRoleplayList,
        };
    }catch (error){
        if (error.statusCode == BAD_REQUEST){
            return {
                status: BAD_REQUEST,
                success: false,
                message: error.message,
            };
        }
        return {
        status: INTERNAL_SERVER_ERROR,
        success: false,
        message: error.message,
        };
    }
}

const getPersonalRoleplayList = async (auth) => {
    try{
        const getPersonalRoleplayList = await service.getPersonalRoleplayList(auth);
        return {
            status: OK,
            success: true,
            message: "맞춤형 롤플레이 리스트 불러오기 성공",
            data: getPersonalRoleplayList,
        };
    }catch(error){
        if (error.statusCode == BAD_REQUEST){
            return {
                status: BAD_REQUEST,
                success: false,
                message: error.message,
            };
        }
        return {
        status: INTERNAL_SERVER_ERROR,
        success: false,
        message: error.message,
        };
    }
}

const getRoleplay = async (roleplayID, auth) => {
    try {
        if (!roleplayID){
            return {
                status: BAD_REQUEST,
                success: false,
                message: "빈 roleplayID 값으로 인한 실패",
            };
        }
        const getRoleplay = await service.getRoleplay(roleplayID, auth);
        return {
            status: OK,
            success: true,
            message: "롤플레이 불러오기 성공",
            data: getRoleplay,
        };
    }catch (error){
        return {
        status: INTERNAL_SERVER_ERROR,
        success: false,
        message: error.message,
        };
    }
}

const getRoleplayChatList = async (roleplayID, auth) => {
    try {
        if (!roleplayID){
            return {
                status: BAD_REQUEST,
                success: false,
                message: "빈 roleplayID 값으로 인한 실패",
            };
        }
        const getRoleplayChatList = await service.getRoleplayChatList(roleplayID, auth);
        return {
            status: OK,
            success: true,
            message: "롤플레이 채팅 리스트 불러오기 성공",
            data: getRoleplayChatList,
        };
    }catch (error){
        return {
        status: INTERNAL_SERVER_ERROR,
        success: false,
        message: error.message,
        };
    }
}

export default {
    auth,
    getOfficialRoleplayList,
    getPersonalRoleplayList,
    getRoleplay,
    getRoleplayChatList,
};