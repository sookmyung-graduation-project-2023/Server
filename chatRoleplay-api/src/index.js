//handler: ./src/index.handler
import service from './service.js';

const OK = 200;
const CREATED =  201;
const UNAUTHORIZED = 401;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const INTERNAL_SERVER_ERROR = 500;

export const handler = awslambda.streamifyResponse(async (event, responseStream, _context) => {
    const metadata = {
        statusCode: 201,
        headers: {
            "Content-Type": "text/event-stream",
            "Connection": "keep-alive",
            "charset": "UTF-8",
            "Transfer-Encoding": "chunked",
            "X-Accel-Buffering": "no",
            "Cache-Control": "no-cache"
          }
    };
    let responseBody;
    try{  
        //------------인증------------
        const accessToken = event.headers.authorization.split('Bearer ') [1];
        const auth = await service.auth(accessToken);
        if (auth.ok == false) {
            responseBody = {
                status: UNAUTHORIZED,
                success: false,
                message:  "accessToken 만료로 인한 실패. Token Refresh 필요"
            };
        }else{
            //------------라우팅------------
            const routeKey =  event.requestContext.http.method +" "+ event.requestContext.http.path;
            const body = JSON.parse(event.body);
            switch (routeKey) {
                case "POST /roleplay/newTopic":
                    //요청 오류 체크
                    if (!body.title || !body.description || !body.role1 || !body.role1Desc || !body.role1Type || !body.role2 || !body.role2Desc || !body.role2Type){
                        responseBody =  {
                            status: BAD_REQUEST,
                            success: false,
                            message: "빈 값으로 인한 생성 실패",
                        };
                    }else{
                        //비즈니스 로직
                        metadata.statusCode = CREATED;
                        responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
                        const chuncks = service.createNewTopicRolePlay(body, auth);
                        for await (const chunk of chuncks) {
                            responseBody =  {
                                status: CREATED,
                                success: true,
                                message: "역할극 생성 성공",
                                data: chunk,
                            };
                            responseStream.write("data: "+ JSON.stringify(responseBody)+ "\n\n");
                        }
                        responseStream.end();
                    }
                    break;
                case "POST /roleplay/usedTopic":
                    responseBody = await  service.createUsedTopicRolePlay(body, auth);
                    break;
                default:
                    responseBody = {
                        status: NOT_FOUND,
                        success: false,
                        message: "잘못된 API Path로 인한 실패",
                    };
            }
        } 
        metadata.statusCode = responseBody.status;
        responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
        responseStream.write("data: "+ JSON.stringify(responseBody)+ "\n\n");
        responseStream.end();
        
    }catch(err){
        const message = err instanceof Error ? err.message : String(err);
        responseBody = {
            status: INTERNAL_SERVER_ERROR,
            success: false,
            message: message,
        };
        metadata.statusCode = responseBody.status;
        responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
        responseStream.write("data: "+ JSON.stringify(responseBody)+ "\n\n");
        responseStream.end();
    }   
});