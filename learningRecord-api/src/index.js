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
    }
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
        switch (routeKey) {
            case "POST /learningRecord/{roleplayID}":
                const body = JSON.parse(event.body);
                responseBody = await controller.postLearningRecord(event.pathParameters.roleplayID, body, auth);
                break;
            case "GET /user/learningData":
                responseBody = await controller.getUserlearningData(auth);
                break;
            case "GET /user/roleplayList":
                responseBody = await controller.getUserRoleplayList(auth);
                break;
            case "GET /user/monthlyData": 
                const queryStringParameters = event.queryStringParameters;
                responseBody = await controller.getUserMonthlyData(queryStringParameters, auth);
                break; 
            case "GET /learningRecord/{recordID}":
                responseBody = await controller.getLearningRecord(event.pathParameters.recordID, auth);
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