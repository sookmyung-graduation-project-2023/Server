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

const createNewTopicRolePlay = async (data, auth) => {
    try {
        if (!data.title || !data.description || !data.role1 || !data.role1Desc || !data.role1Type || !data.role2 || !data.role2Desc || !data.role2Type || !Array.isArray(data.mustWords)){
            return  {
                status: BAD_REQUEST,
                success: false,
                message: "빈 값으로 인한 생성 실패",
            };
        }
        const createNewTopicRolePlay = await service.createNewTopicRolePlay(data, auth);
        return {
            status: CREATED,
            success: true,
            message: "역할극 생성 시작",
            data: createNewTopicRolePlay,
        };
    }catch (error){
        return {
        status: INTERNAL_SERVER_ERROR,
        success: false,
        message: error.message,
        };
    }
};

const createUsedTopicRolePlay = async (data, auth) => {
    try {
        if (!data.title || !data.parentRoleplayID || !Array.isArray(data.mustWords)){
            return {
                status: BAD_REQUEST,
                success: false,
                message: "빈 값으로 인한 전송 실패",
            };
        }
        const createUsedTopicRolePlay = await service.createUsedTopicRolePlay(data, auth);
        return {
            status: CREATED,
            success: true,
            message: "역할극 생성 시작",
            data: createUsedTopicRolePlay,
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
    createNewTopicRolePlay,
    createUsedTopicRolePlay,
};