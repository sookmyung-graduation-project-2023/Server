import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import jwt from "jsonwebtoken";

const AWS_REGION = process.env.AWS_REGION;
const JWT_SECRET = process.env.jwtSecret;

const ddbClient = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const login = async (data) => {
    try {
        let message;
        const id = "u" + data.id;
        //토큰 생성
        const accessToken = getAccessToken(id, data.name);
        const refreshToken = getRefreshToken();
        //이미 존재하는지 확인
        const getUserCommand = new GetCommand({
            TableName: "LipRead",
            Key: {
                PK: id,
                SK: id,
            },
            ProjectionExpression: "PK"
        });
        const response = await docClient.send(getUserCommand);
        if (response.Item) { // 로그인 처리
            message = "로그인 성공";
            const updateUserCommand = new UpdateCommand({
                TableName: "LipRead",
                Key: {
                    PK: id,
                    SK: id,
                },
                UpdateExpression: "set rfToken = :rfToken",
                ExpressionAttributeValues: {
                    ":rfToken": refreshToken,
                },
                ReturnValues: "NONE",
            });
            await docClient.send(updateUserCommand);
        }else{ //회원가입 처리
            message = "회원가입 성공";
            const putUserCommand = new PutCommand({
                TableName: "LipRead",
                Item: {
                    PK: id,
                    SK: id,
                    email: data.email,
                    name: data.name,
                    timeCnt: 0,
                    sentenceCnt: 0,
                    rfToken: refreshToken,
                },
            });
            await docClient.send(putUserCommand);
        }
        return {
            message: message,
            data: { 
                UID: id,
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

const refresh = async (accessToken, refreshToken) => {
    try{
        //access token 디코딩하여 user의 정보를 가져옵니다.
        const decoded = jwt.decode(accessToken);
        if (decoded == null){ //액세스 토큰의 디코딩 결과가 없으면 에러
            const error = new Error("비정상 access token으로 인한 실패");
            error.statusCode = 400;
            throw error;
        }
        // access token 검증 -> expired여야 함.
        const accessTokenResult = await verifyToken(accessToken);
        if (accessTokenResult.ok == true){ //만료되지 않은 액세스 토큰이면 에러
            const error = new Error("만료되지 않은 access token으로 인한 실패");
            error.statusCode = 400;
            throw error;
        }
        //refresh 토큰 검증
        const getUserCommand = new GetCommand({
            TableName: "LipRead",
            Key: {
                PK: decoded.id,
                SK: decoded.id,
            },
            ProjectionExpression: "rfToken"
        });
        const response = await docClient.send(getUserCommand);
        if (!response.Item) {
            throw new Error;
        }
        if (response.Item.rfToken != refreshToken){ //DB에 저장된 refresh토큰과 다르면 에러
            const error = new Error("비정상 refresh token으로 인한 실패");
            error.statusCode = 400;
            throw error;
        }
        const refreshTokenResult = await verifyToken(refreshToken);
        if(refreshTokenResult.ok == false){ //만료된 refresh token이면 에러
            const error = new Error("만료된 refresh token으로 인한 실패");
            error.statusCode = 400;
            throw error;
        }
        const newToken = getAccessToken(decoded.id, decoded.name);
        return {
            accessToken: newToken,
        };
    }catch(error){
        throw error;
    }

};

const getAccessToken = (id, name) => {
    const payload = {
        id: id,
        name: name,
    };
    const token = jwt.sign(
        payload,
        JWT_SECRET,
        { expiresIn: '1h' }, //1시간 지속
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

const verifyToken = async (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return {
            ok: true,
            id: decoded.id,
            name: decoded.name,
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
};

