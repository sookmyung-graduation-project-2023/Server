import { SNSClient, CreatePlatformEndpointCommand } from "@aws-sdk/client-sns";
import dynamoDB from "./dynamoDB.js";
import jwt from "jsonwebtoken";

const AWS_REGION = process.env.AWS_REGION;
const JWT_SECRET = process.env.jwtSecret;
const PLATFORM_APPLICATION_ARN = process.env.PLATFORM_APPLICATION_ARN;

const createPlatformEndpoint = async (input) => {
    const client = new SNSClient({ region: AWS_REGION });
    const createPlatformEndpointCommand = new CreatePlatformEndpointCommand(input);
    const platformEndpointResponse = await client.send(createPlatformEndpointCommand);
    return platformEndpointResponse;
};

//사용자 회원가입
const userSignUp = async (userID, data, refreshToken) => {
    //DB 사용자 정보 저장
    await dynamoDB.put({
        TableName: "LipRead",
        Item: {
            PK: userID,
            SK: userID,
            email: data.email,
            name: data.name,
            totalTime: 0,
            sentenceCnt: 0,
        },
    });
    //엔드포인트 생성
    const input = { // CreatePlatformEndpointInput
        PlatformApplicationArn: PLATFORM_APPLICATION_ARN, 
        Token: data.deviceToken, 
    };
    const platformEndpointResponse = await createPlatformEndpoint(input);
    //DB 사용자 디바이스 정보 저장
    await dynamoDB.put({
        TableName: "LipRead",
        Item: {
            PK: userID,
            SK: 'd'+data.deviceToken,
            rfToken: refreshToken,
            endpointArn: platformEndpointResponse.EndpointArn
        },
    });
};

const userLogin = async (userID, data, refreshToken) => {
    //디바이스 로그인 기록 체크
    const getUserDeviceResponse = await dynamoDB.get({
        TableName: "LipRead",
        Key: {
            PK: userID,
            SK: 'd'+data.deviceToken,
        },
        ProjectionExpression: "PK"
    });
    if (getUserDeviceResponse.Item){ //해당 디바이스로 로그인 기록 O
        //리프레시 토큰 업데이트
        await dynamoDB.update({
            TableName: "LipRead",
            Key: {
                PK: userID,
                SK: 'd'+data.deviceToken,
            },
            UpdateExpression: "set rfToken = :rfToken",
            ExpressionAttributeValues: {
                ":rfToken": refreshToken,
            },
            ReturnValues: "NONE",
        });
    }else{ //해당 디바이스로 로그인 기록 X
        //엔드포인트 생성
        const input = { // CreatePlatformEndpointInput
            PlatformApplicationArn: PLATFORM_APPLICATION_ARN, 
            Token: data.deviceToken, 
        };
        const platformEndpointResponse = await createPlatformEndpoint(input);
        //DB 사용자 디바이스 정보 저장
        await dynamoDB.put({
            TableName: "LipRead",
            Item: {
                PK: userID,
                SK: 'd'+data.deviceToken,
                rfToken: refreshToken,
                endpointArn: platformEndpointResponse.EndpointArn
            },
        });
    }
};

const login = async (data) => {
    try {
        let message;
        const userID = "u" + data.id;
        //토큰 생성
        const accessToken = getAccessToken(userID);
        const refreshToken = getRefreshToken();
        //DB에 이미 존재하는 사용자인지 확인
        const getUserResponse = await dynamoDB.get({
            TableName: "LipRead",
            Key: {
                PK: userID,
                SK: userID,
            },
            ProjectionExpression: "PK"
        });
        if (getUserResponse.Item) { // 로그인 처리
            message = "로그인 성공";
            await userLogin(userID, data, refreshToken); 
        }else{ //회원가입 처리
            message = "회원가입 성공";
            await userSignUp(userID, data, refreshToken);
        }
        return {
            message: message,
            data: { 
                UID: userID,
                email: data.email,
                name: data.name,
                accessToken: accessToken,
                refreshToken: refreshToken,
            }
        };
    } catch (error) {
        throw error;
    }
};

const refresh = async (accessToken, refreshToken, deviceToken) => {
    try{
        //access token 디코딩하여 user의 정보를 가져옵니다.
        const decoded = jwt.decode(accessToken);
        if (decoded == null){ //액세스 토큰의 디코딩 결과가 없으면 에러
            const error = new Error("비정상 access token으로 인한 실패");
            error.statusCode = 400;
            throw error;
        }
        const userID = decoded.id;
        // access token 검증 -> expired여야 함.
        const accessTokenResult = await verifyToken(accessToken);
        if (accessTokenResult.ok == true){ //만료되지 않은 액세스 토큰이면 에러
            const error = new Error("만료되지 않은 access token으로 인한 실패");
            error.statusCode = 400;
            throw error;
        }
        //refresh 토큰 검증
        const response = await dynamoDB.get({
            TableName: "LipRead",
            Key: {
                PK: userID,
                SK: 'd'+deviceToken,
            },
            ProjectionExpression: "rfToken"
        });
        if (!response.Item) {
            const error = new Error("비정상 refresh token으로 인한 실패");
            error.statusCode = 400;
            throw error;
        }
        if (response.Item.rfToken != refreshToken){ //DB에 저장된 refresh토큰과 다르면 에러
            const error = new Error("refresh token의 불일치로 인한 실패");
            error.statusCode = 400;
            throw error;
        }
        const refreshTokenResult = await verifyToken(refreshToken);
        if(refreshTokenResult.ok == false){ //만료된 refresh token이면 에러
            const error = new Error("만료된 refresh token으로 인한 실패 login 필요");
            error.statusCode = 400;
            throw error;
        }
        const newToken = getAccessToken(userID);
        return {
            accessToken: newToken,
        };
    }catch(error){
        throw error;
    }
};

const getAccessToken = (id) => {
    const payload = {
        id: id
    };
    const token = jwt.sign(
        payload,
        JWT_SECRET,
        { expiresIn: '2d' }, //1시간 지속
    );
    return token;
};

const getRefreshToken = () => {
    const token = jwt.sign(
        {},
        JWT_SECRET,
        { expiresIn: '14d' }, //14일 지속
    );
    return token;
};

const verifyToken = async (accessToken) => {
    try {
        const decoded = jwt.verify(accessToken, JWT_SECRET);
        return {
            ok: true,
            id: decoded.id
        };
    } catch (err) {
        return {
            ok: false,
            message: err.message,
        };
    }
};

export default {
    login,
    refresh,
    userSignUp,
    userLogin,
    createPlatformEndpoint,
    getAccessToken,
    getRefreshToken,
    verifyToken
};

