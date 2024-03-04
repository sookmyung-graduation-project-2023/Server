import controller from './controller.js';

export const handler = async (event, context) => {
    const routeKey =  event.routeKey;
    let responseBody;
    switch (routeKey) {
        case "POST /login":
            const body = JSON.parse(event.body);
            responseBody = await controller.login(body);
            break;
        case "GET /refresh":
            const accessToken = event.headers.authorization.split('Bearer ') [1];
            const refreshToken = event.headers.refresh;
            responseBody = await controller.refresh(accessToken, refreshToken);
            break;
        default:
            const BAD_REQUEST = 400;
            responseBody = {
                status: BAD_REQUEST,
                success: false,
                message: "잘못된 API path로 인한 실패",
            };
    }
    return {
        "statusCode": responseBody.status,
        "headers": {"content-type": "application/json"},
        "body": JSON.stringify(responseBody),
        "isBase64Encoded": false
    };
};