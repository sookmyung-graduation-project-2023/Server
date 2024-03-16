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

const login = async (data) => {
    try {
        if (!data.id || !data.email || !data.name || !data.deviceToken ){
            return {
                status: BAD_REQUEST,
                success: false,
                message: "빈 값으로 인한 로그인 실패",
            };
        }
        const login = await service.login(data);
        return {
            status: CREATED,
            success: true,
            message: login.message,
            data: login.data,
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
};

const refresh = async (accessToken, refreshToken, deviceToken) =>{
    try {
        if (!accessToken || !refreshToken || !deviceToken){
            return {
                status: BAD_REQUEST,
                success: false,
                message: "빈 값으로 인한 토큰 재발급 실패",
            };
        }
        const refresh = await service.refresh(accessToken, refreshToken, deviceToken);
        return {
            status: CREATED,
            success: true,
            message: "토큰 재발급 성공",
            data: refresh,
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
};

export default {
    login,
    refresh,
};