# 🪑 Ghost Seat Detector — 도서관 좌석 유령 예약 감지 시스템

카메라 1대로 번호표(1, 2, 3)가 부착된 3개 좌석을 촬영하고, Amazon Bedrock Claude Haiku로 AI 분석하여 유령 예약을 자동 감지·경고·반납 처리하는 시스템입니다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React 18 + JavaScript + Vite |
| 백엔드 | Python 3.12, AWS Lambda (단일 함수) |
| API | API Gateway (REST, 프록시 통합) |
| AI | Amazon Bedrock Claude Haiku (이미지 분석) |
| DB | DynamoDB Single Table Design |
| 알림 | Slack Incoming Webhook |
| 호스팅 | AWS Amplify Hosting (프론트엔드) |

## 프로젝트 구조

```
backend/
  lambda_function.py          # 단일 Lambda — 모든 백엔드 로직
frontend/
  src/
    pages/
      StudentPage.jsx         # 학생 페이지 (/, 예약/취소)
      AdminPage.jsx           # 관리자 페이지 (/admin, 카메라+대시보드)
    api.js                    # API 호출 함수
    constants.js              # 상수, 색상 매핑
    utils.js                  # 유틸리티 함수
    App.jsx                   # 라우팅
    main.jsx                  # 엔트리포인트
```

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | /seats | 전체 좌석 조회 |
| GET | /seats/{seat_id} | 개별 좌석 조회 |
| GET | /events | 이벤트 로그 조회 |
| POST | /seats/{seat_id}/reserve | 좌석 예약 |
| POST | /seats/{seat_id}/cancel | 좌석 취소 |
| POST | /snapshot | 스냅샷 분석 + 상태 전이 |

## 좌석 상태 전이

```
AVAILABLE → RESERVED (학생 예약)
RESERVED → OCCUPIED (사람 감지)
RESERVED/OCCUPIED → ABSENT_WITH_STUFF (사람 없음 + 짐 있음)
RESERVED/OCCUPIED → ABSENT_EMPTY (사람 없음 + 짐 없음)
ABSENT_WITH_STUFF → WARNING_SENT (임계값 도달, 경고 1회)
WARNING_SENT → AVAILABLE (임계값 재도달, 자동 반납)
ABSENT_EMPTY → AVAILABLE (임계값 도달, 자동 반납)
```

## 로직

![로직 플로우차트](docs/logic-flow.png)

## 시작하기

### 프론트엔드

```bash
cd frontend
cp .env.example .env
# .env에서 VITE_API_BASE_URL을 실제 API Gateway URL로 수정
npm install
npm run dev
```

### 백엔드

1. AWS 콘솔에서 Lambda 함수 생성 (Python 3.12, 타임아웃 90초)
2. `backend/lambda_function.py` 내용을 인라인 에디터에 붙여넣기
3. 환경변수 설정:
   - `SEATS_TABLE` — DynamoDB 테이블명 (기본: `ghost-seat-detector-seats`)
   - `ABSENCE_THRESHOLD` — 부재 임계값 (기본: 5)
   - `SLACK_STUDENT_WEBHOOK` — 학생 경고용 Slack Webhook URL
   - `SLACK_ADMIN_WEBHOOK` — 관리자 알림용 Slack Webhook URL
4. Lambda 권한: AmazonBedrockFullAccess, AmazonDynamoDBFullAccess
5. API Gateway에서 프록시 통합으로 모든 라우트를 Lambda에 연결

### DynamoDB

테이블명: `ghost-seat-detector-seats`
- Partition Key: `PK` (String)
- Sort Key: `SK` (String)

초기 데이터로 A1, A2, A3 좌석 3개를 AVAILABLE 상태로 입력합니다.

## 페이지

- `/` — 학생 페이지: 학번+이름 로그인, 좌석 예약/취소, 경고 배너
- `/admin` — 관리자 페이지: 좌석 대시보드, 카메라 모니터링, 이벤트 로그
