# 빠른 시작 체크리스트

프로젝트를 실행하기 위한 필수 단계를 순서대로 체크하세요.

---

## ☑️ 사전 준비

- [ ] Node.js 18 이상 설치됨 (`node --version` 확인)
- [ ] npm 설치됨 (`npm --version` 확인)
- [ ] 인터넷 연결 가능
- [ ] 텍스트 에디터/IDE 준비 (VS Code 권장)

---

## ☑️ 1. Supabase 설정 (10분)

### 프로젝트 생성
- [ ] https://supabase.com 접속
- [ ] 계정 생성 또는 로그인
- [ ] "New Project" 클릭
- [ ] 프로젝트 이름: `tworld-chatbot` 입력
- [ ] 데이터베이스 비밀번호 설정 (어딘가에 기록!)
- [ ] Region: `Northeast Asia (Seoul)` 선택
- [ ] "Create new project" 클릭 (생성까지 2-3분 소요)

### API Keys 복사
- [ ] 프로젝트 대시보드 좌측 메뉴 → `Settings` 클릭
- [ ] `API` 클릭
- [ ] 다음 값 복사:
  - [ ] Project URL: `https://xxxxx.supabase.co`
  - [ ] `anon` `public` 키
  - [ ] `service_role` 키 (Show 클릭 후)

---

## ☑️ 2. OpenAI API Key 발급 (5분)

- [ ] https://platform.openai.com/api-keys 접속
- [ ] OpenAI 계정 로그인 (없으면 생성)
- [ ] "Create new secret key" 클릭
- [ ] 이름 입력 (예: `tworld-chatbot`)
- [ ] "Create secret key" 클릭
- [ ] **중요**: 생성된 키 즉시 복사 (다시 볼 수 없음!)
- [ ] OpenAI 계정에 크레딧 확인 (https://platform.openai.com/usage)
  - 최소 $5 크레딧 필요 (테스트용으로 충분)

---

## ☑️ 3. 환경변수 설정 (2분)

- [ ] 프로젝트 폴더에서 `.env.local` 파일 생성
- [ ] 다음 내용 복사 후 실제 값으로 교체:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] 모든 값이 정확히 입력되었는지 확인
- [ ] 파일 저장

---

## ☑️ 4. 데이터베이스 스키마 생성 (5분)

### Supabase Dashboard에서:

- [ ] 좌측 메뉴에서 `SQL Editor` 클릭
- [ ] "New query" 버튼 클릭

### 파일 1: 테이블 생성
- [ ] `supabase/migrations/001_schema.sql` 파일 열기
- [ ] 전체 내용 복사 → SQL Editor에 붙여넣기
- [ ] "Run" 버튼 클릭
- [ ] 성공 메시지 확인: "Success. No rows returned"

### 파일 2: RLS 정책
- [ ] "New query" 버튼 클릭
- [ ] `supabase/migrations/002_rls.sql` 파일 열기
- [ ] 전체 내용 복사 → SQL Editor에 붙여넣기
- [ ] "Run" 버튼 클릭
- [ ] 성공 메시지 확인

### 파일 3: 함수 및 트리거
- [ ] "New query" 버튼 클릭
- [ ] `supabase/migrations/003_functions.sql` 파일 열기
- [ ] 전체 내용 복사 → SQL Editor에 붙여넣기
- [ ] "Run" 버튼 클릭
- [ ] 성공 메시지 확인

### 확인하기
- [ ] 좌측 메뉴 `Table Editor` 클릭
- [ ] 다음 테이블들이 보이는지 확인:
  - [ ] profiles
  - [ ] customer_sessions
  - [ ] conversations
  - [ ] messages
  - [ ] conversation_summaries
  - [ ] purchase_predictions
  - [ ] agency_assignments
  - [ ] knowledge_base
  - [ ] audit_logs

---

## ☑️ 5. 의존성 설치 (3분)

터미널에서:

```bash
cd C:\Users\SKTelecom\Desktop\PROJECT\tworld-chatbot
npm install
```

- [ ] 설치 완료 (약 2-3분 소요)
- [ ] 에러 없이 완료됨

---

## ☑️ 6. 지식 베이스 구축 (2분)

터미널에서:

```bash
npx tsx scripts/seed-knowledge.ts
```

- [ ] "Starting knowledge base seeding..." 메시지 확인
- [ ] 10개의 "✓ Document inserted successfully" 메시지 확인
- [ ] "Knowledge base seeding completed!" 메시지 확인

### Supabase에서 확인
- [ ] Table Editor → `knowledge_base` 테이블 선택
- [ ] 10개의 레코드 존재 확인

---

## ☑️ 7. 개발 서버 실행 (1분)

터미널에서:

```bash
npm run dev
```

- [ ] "▲ Next.js 15.x.x" 메시지 확인
- [ ] "Local: http://localhost:3000" 확인
- [ ] "Ready in xxxms" 메시지 확인

---

## ☑️ 8. 애플리케이션 테스트 (5분)

### 메인 페이지
- [ ] 브라우저에서 http://localhost:3000 접속
- [ ] "T-world 지능형 챗봇 시스템" 제목 확인
- [ ] 두 개의 카드 (고객 챗봇 / 대리점 대시보드) 표시됨

### 고객 챗봇 테스트
- [ ] "고객 챗봇" 카드 클릭 또는 http://localhost:3000/chat 직접 접속
- [ ] 채팅 인터페이스 로딩됨
- [ ] 환영 메시지 표시: "안녕하세요! T-world 상담 챗봇입니다..."

#### 테스트 대화
- [ ] 입력: "안녕하세요"
- [ ] AI 응답 수신됨
- [ ] 입력: "5G 요금제 추천해주세요"
- [ ] AI가 5G 프리미어, 스탠다드 플랜 정보 제공
- [ ] 입력: "데이터 쉐어링이 뭔가요?"
- [ ] AI가 데이터 쉐어링 서비스 설명
- [ ] 입력: "해외 로밍 요금은?"
- [ ] AI가 로밍 요금 정보 제공

#### 대화 종료
- [ ] "대화 종료" 버튼 클릭
- [ ] 로딩 표시 (몇 초)
- [ ] 요약 화면 표시:
  - [ ] 요약 텍스트
  - [ ] 카테고리 (예: plan_change, general_inquiry 등)
  - [ ] 키워드 배지들
- [ ] "새 상담 시작" 버튼 클릭
- [ ] 새 대화 시작됨

### Supabase에서 데이터 확인
- [ ] Table Editor → `customer_sessions` 테이블
- [ ] 새 세션 레코드 확인
- [ ] Table Editor → `conversations` 테이블
- [ ] 새 대화 레코드 확인 (status: ended)
- [ ] Table Editor → `messages` 테이블
- [ ] 주고받은 메시지들 확인
- [ ] `content_masked` 필드에 PII 마스킹 확인
- [ ] Table Editor → `conversation_summaries` 테이블
- [ ] 생성된 요약 확인

---

## ☑️ 9. 대리점 기능 테스트 (선택사항)

### 테스트 데이터 추가
Supabase SQL Editor에서:

```sql
INSERT INTO customer_sessions (session_token, customer_phone, customer_name)
VALUES ('test-001', '010-1234-5678', '홍길동');
```

- [ ] 실행 완료

### 고객 검색 테스트
- [ ] http://localhost:3000/search 접속
- [ ] 검색창에 "홍길동" 입력
- [ ] "검색" 버튼 클릭
- [ ] 고객 카드 표시됨
- [ ] 고객 카드 클릭 → 상세 페이지 이동
- [ ] 고객 정보 표시 확인

---

## ✅ 완료!

모든 체크가 완료되었다면 시스템이 정상 작동하는 것입니다!

---

## 🚨 문제 해결

### 에러: "Cannot find module"
```bash
npm install
```

### 에러: "Invalid API Key" (OpenAI)
- `.env.local`의 `OPENAI_API_KEY` 확인
- OpenAI 계정에 크레딧 확인
- API 키 다시 생성

### 에러: "Database connection failed"
- `.env.local`의 Supabase URL과 Keys 확인
- Supabase 프로젝트가 활성 상태인지 확인

### 챗봇이 응답하지 않음
- 브라우저 콘솔 (F12) 에러 확인
- 터미널 에러 확인
- `.env.local` 모든 값 재확인

### 지식 베이스 seeding 실패
- `.env.local`에 `SUPABASE_SERVICE_ROLE_KEY` 확인
- Supabase에서 `knowledge_base` 테이블 존재 확인
- pgvector extension 활성화 확인:
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```

---

## 📚 다음 단계

- [ ] README.md 읽기 (전체 기능 이해)
- [ ] IMPLEMENTATION_STATUS.md 읽기 (구현 현황)
- [ ] 더 많은 지식 베이스 문서 추가 (`scripts/seed-knowledge.ts` 수정)
- [ ] UI 커스터마이징 (색상, 레이아웃 등)
- [ ] 인증 시스템 구현 (Week 5)
- [ ] 프로덕션 배포 준비

---

**예상 소요 시간**: 총 30-40분

**도움이 필요하면**: SETUP.md 또는 README.md 참조
