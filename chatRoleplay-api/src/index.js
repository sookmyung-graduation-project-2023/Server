//handler: ./src/index.handler
import controller from './controller.js';

export const handler = async (event, context) => {
    let responseBody;
    const accessToken = event.headers.authorization.split('Bearer ') [1];
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
        const body = JSON.parse(event.body);
        switch (routeKey) {
            case "POST /roleplay/newTopic":
                responseBody = await  controller.createNewTopicRolePlay(body, auth);
                break;
            case "POST /roleplay/usedTopic":
                responseBody = await  controller.createUsedTopicRolePlay(body, auth);
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
    return {
        "statusCode": responseBody.status,
        "headers": {"content-type": "application/json"},
        "body": JSON.stringify(responseBody),
        "isBase64Encoded": false
    };   
};