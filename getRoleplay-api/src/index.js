import controller from './controller.js';

export const handler = async (event, context) => {
    let responseBody;
    
    const accessToken = event.headers.authorization.split('Bearer ') [1];
    if (!accessToken){
        const UNAUTHORIZED = 401;
        responseBody = {
            status: UNAUTHORIZED,
            success: false,
            message:  "빈 accessToken으로 인한 실패"
        };
    }else{
        const auth = await controller.auth(accessToken);
        if (auth.ok == false) {
            const UNAUTHORIZED = 401;
            responseBody = {
                status: UNAUTHORIZED,
                success: false,
                message:  "accessToken 만료로 인한 실패. Token Refresh 필요"
            };
        
        }else{
            const routeKey =  event.routeKey;
            const queryStringParameters = event.queryStringParameters;
            switch (routeKey) {
                case "GET /roleplayList/official":
                    responseBody = await controller.getOfficialRoleplayList(queryStringParameters, auth);
                    break;
                case "GET /roleplayList/personal":
                    responseBody = await controller.getPersonalRoleplayList(auth);
                    break;
                case "GET /roleplay/{roleplayID}":
                    responseBody = await controller.getRoleplay(event.pathParameters.roleplayID, auth);
                    break;
                case "GET /roleplay/chatList/{roleplayID}": 
                    responseBody = await controller.getRoleplayChatList(event.pathParameters.roleplayID, auth);
                    break;
                default:
                    const NOT_FOUND = 404;
                    responseBody = {
                        status: NOT_FOUND,
                        success: false,
                        message: "잘못된 API Path로 인한 실패"
                    };
            }
        }
    }
    

    return {
        "statusCode": responseBody.status,
        "headers": {"content-type": "application/json"},
        "body": JSON.stringify(responseBody),
        "isBase64Encoded": false
    };
};