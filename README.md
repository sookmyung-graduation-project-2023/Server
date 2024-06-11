# LipRead - Server

## 🦻🏻 프로젝트 소개
> 청각장애인을 위한 구어 학습 서비스

청각 장애인들이 실생활에서 자주 쓰이는 문장을 중심으로 구어를 학습할 수 있는 서비스 입니다.   
LipRead는 AI를 통해 제작된 대화 영상을 통해 청각장애인들의 독화 훈련과 청능 훈련을 도와 다양한 상황에서 의사소통을 원활히 할 수 있도록 도움을 주고자 합니다. 

LipRead PPT (https://github.com/sookmyung-graduation-project-2023/Server/blob/main/PPT.md)


## 📚개발 기간
2023.11.2 ~ 2024.03.19 

[Yun JaeEun](https://github.com/yunjaeeun44) : Back-end Developer  
[Lee YuJin](https://github.com/Ujaa) : Front-end Developer


## 🛠️ Server 기능

![image](https://github.com/sookmyung-graduation-project-2023/Server/assets/70003845/c3a57ba4-945a-4a76-99af-46aada547ce0)

 LipRead는 기본적으로 REST API를 통해 클라이언트와 통신합니다. Python 또는 Node.js로 구현된 Lambda를 통해 전반적인 CRUD를 수행합니다.  
영상 생성 시 Lambda는 chat GPT를 통해 대화 텍스트를 생성하고 이를 EC2에 전송합니다. EC2는 OpenAI TTS를 통해 음성을 생성하고 DINet을 통해 대화 영상을 생성하며 이를 dynamoDB와 S3에 반영합니다.   
클라이언트는 CloudFront를 통해 S3에 저장된 영상을 스트리밍하며, Websocket API와 DynamoDB Stream을 통해 EC2의 영상 생성 진행 상황을 실시간으로 확인합니다.


## 🔎 상세 소개

### 1. Login - API

![image](https://github.com/sookmyung-graduation-project-2023/ML-Server/assets/70003845/94534eec-28ff-4eed-b828-9f2f14800e1f)

Login-API에는 JWT를 활용한 로그인 및 토큰 리프레시를 수행합니다. 

### 2. Get Roleplay - API

![image](https://github.com/sookmyung-graduation-project-2023/ML-Server/assets/70003845/73fa31f9-9d94-4d1e-8462-0a14cc80f651)

롤플레이(대화 + 영상)과 관련된 GET API 입니다.  
생성된 대화와 영상들을 불러오는 기능을 수행합니다.

### 3. Learning Record - API

![image](https://github.com/sookmyung-graduation-project-2023/Server/assets/70003845/db0328bf-da7c-4cbe-8458-affc3f844e34)

사용자의 학습 기록과 관련된 POST, GET API 입니다.  
사용자의 학습 기록을 불러오는 기능을 수행합니다.

### 4. Check Sentence - API

![image](https://github.com/sookmyung-graduation-project-2023/Server/assets/70003845/ef1f74bf-5372-4358-bb24-43741a6c95c8)

사용자의 답변과 실제 정답을 비교하는 API 입니다.   
파이썬의 diff_match_patch 라이브러리를 활용해 사용자가 녹음한 문장과 실제 대화의 문장을 비교하는 기능을 수행합니다.

### 5. Chat Roleplay - API

![image](https://github.com/sookmyung-graduation-project-2023/ML-Server/assets/70003845/886e60e0-277f-4bb2-be14-3736ad411703)

chat GPT를 통해 대화 텍스트를 생성한 후 영상 생성을 위해 ML 서버에 이를 전송합니다.  
ML - Server 설명 (https://github.com/sookmyung-graduation-project-2023/ML-Server/blob/main/README.md)  
(chatRoleplay-api-with-SSE: 영상 생성 시 SSE를 이용한 실시간 진행 상황 전송)

### 6. Roleplay Status - API

![image](https://github.com/sookmyung-graduation-project-2023/Server/assets/70003845/c79b19f6-9610-4d90-92e5-5b2aa1a7ad7d)


실시간으로 대화 생성 진행상황을 알기 위해 클라이언트와 Websocket 연결을 수행합니다.

### 7. check DynamoDB - API

![image](https://github.com/sookmyung-graduation-project-2023/Server/assets/70003845/f0f63946-5728-4a3c-a4f9-27f031993224)

Websocket API와 DynamoDB Stream을 통해 실시간으로 클라이언트에게 대화 생성 진행 상황을 전송합니다.

### 8. Push Alarm - API

![image](https://github.com/sookmyung-graduation-project-2023/ML-Server/assets/70003845/f94fbfa1-8e21-4d14-9d26-970724289b86)

영상 생성 완료 시 사용자의 디바이스로 알림을 전송합니다.