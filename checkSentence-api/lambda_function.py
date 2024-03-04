import json
import string
import jwt
import os

from diff_match_patch import diff_match_patch

JWT_SECRET = os.environ.get("jwtSecret")

def lambda_handler(event, context):
    responseBody = {}
    try:
        #토큰 검증
        accessToken = event['headers']['authorization'][7:]
        auth = verify_token(accessToken)
        if auth['ok'] == False:
            responseBody = {
                'status': 401,
                'message': auth['message'],
                'success': False,
            }
        else :
            #대화 틀린 부분 체크
            req_data = json.loads(event['body'])
            inputData = req_data['input']
            answer = req_data['answer']
            anwer_punctuation_removed = remove_punctuation(answer)
            
            dmp = diff_match_patch()
            diff = dmp.diff_main(inputData, anwer_punctuation_removed)
            dmp.diff_cleanupSemantic(diff)
            
            responseBody = {
                'status': 200,
                'success': True,
                'message': "채팅 체크 성공",
                'data': {'check': diff}
            }
    
    except KeyError:
        responseBody = {
            'status': 400,
            'success': False,
            'message': "빈 값으로 인한 채팅 체크 실패"
        }
    except Exception as e:
        responseBody = {
            'status': 400,
            'success': False, 
            'message': str(e)
        }
    finally :
        return {
            'statusCode': responseBody['status'],
            'headers': {"content-type": "application/json"},
            'body': json.dumps(responseBody),
            'isBase64Encoded': False
        }    
        

def remove_punctuation(text): # 기호 제거
  translator = str.maketrans('', '', string.punctuation)
  return text.translate(translator)



def verify_token(token):
        try:
            payload = jwt.decode(token, key=JWT_SECRET, algorithms='HS256')
            return {
                'ok': True,
                'id': payload['id'],
                'name': payload['name']
            }
        except jwt.ExpiredSignatureError:
            return {
                'ok': False,
                'message': "accessToken 만료로 인한 실패. Token Refresh 필요"
            }
        except jwt.InvalidTokenError:
            return {
                'ok': False,
                'message': "토큰 검증 실패"
            }
        except Exception as e:
            return {
                'ok': False,
                'message': e
            }