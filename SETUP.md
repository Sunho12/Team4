# 빠른 설정 가이드

## 1단계: Supabase 프로젝트 설정

### Supabase 프로젝트 생성

1. https://supabase.com 접속 후 로그인
2. "New Project" 클릭
3. 프로젝트 이름: `tworld-chatbot`
4. Database Password 설정 (기억해두세요!)
5. Region 선택: `Northeast Asia (Seoul)` 추천
6. "Create new project" 클릭

### API Keys 복사

프로젝트 생성 후:

1. 좌측 메뉴에서 `Settings` → `API` 클릭
2. 다음 값들을 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbG...` (긴 토큰)
   - **service_role key**: `eyJhbG...` (긴 토큰) - Show를 눌러야 보임

## 2단계: 환경변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-openai-api-key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**중요**: 위의 값들을 실제 값으로 교체하세요!

## 3단계: 데이터베이스 스키마 생성

### Supabase Dashboard에서:

1. 좌측 메뉴 `SQL Editor` 클릭
2. "New query" 클릭
3. 다음 파일 내용을 순서대로 복사 → 붙여넣기 → Run:

#### 3-1. Schema 생성

`supabase/migrations/001_schema.sql` 내용 전체 복사 후 실행

#### 3-2. RLS 정책 적용

`supabase/migrations/002_rls.sql` 내용 전체 복사 후 실행

#### 3-3. 함수 및 트리거

`supabase/migrations/003_functions.sql` 내용 전체 복사 후 실행

### 확인하기

1. 좌측 메뉴 `Table Editor` 클릭
2. 다음 테이블들이 생성되었는지 확인:
   - profiles
   - customer_sessions
   - conversations
   - messages
   - conversation_summaries
   - purchase_predictions
   - agency_assignments
   - knowledge_base
   - audit_logs

## 4단계: OpenAI API Key 발급

1. https://platform.openai.com/api-keys 접속
2. "Create new secret key" 클릭
3. 이름 설정 (예: "tworld-chatbot")
4. 생성된 키 복사 → `.env.local`의 `OPENAI_API_KEY`에 붙여넣기

**중요**: API 키는 한 번만 표시되므로 반드시 복사해두세요!

## 5단계: 지식 베이스 구축

터미널에서:

```bash
cd C:\Users\SKTelecom\Desktop\PROJECT\tworld-chatbot
npx tsx scripts/seed-knowledge.ts
```

출력 예시:
```
Starting knowledge base seeding...
Processing: 5G 프리미어 플랜: 월 80,000원, 데이터 무제한...
✓ Document inserted successfully
...
Knowledge base seeding completed!
```

### 확인하기

Supabase Dashboard → Table Editor → `knowledge_base` 테이블에 10개의 레코드가 있어야 합니다.

## 6단계: 개발 서버 실행

```bash
npm run dev
```

출력:
```
  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
  - Ready in xxxms
```

## 7단계: 애플리케이션 테스트

### 고객 챗봇 테스트

1. 브라우저에서 http://localhost:3000/chat 접속
2. 메시지 입력: "안녕하세요, 5G 요금제 추천해주세요"
3. AI 응답 확인 (지식 베이스 기반)
4. 여러 메시지 주고받기
5. "대화 종료" 버튼 클릭
6. 요약 화면 확인 (카테고리, 키워드, 감정 분석)

### 대리점 검색 테스트

1. http://localhost:3000/search 접속
2. 검색창에 임의의 텍스트 입력 (예: "test")
3. 아직 고객 데이터가 없으므로 빈 결과 표시됨

**테스트 데이터 추가하기:**

Supabase Dashboard → SQL Editor:

```sql
-- 테스트 고객 추가
INSERT INTO customer_sessions (session_token, customer_phone, customer_name)
VALUES ('test-001', '010-1234-5678', '홍길동');
```

실행 후 다시 검색하면 결과가 나타납니다.

## 문제 해결

### "Cannot find module" 오류

```bash
npm install
```

### pgvector extension 오류

Supabase SQL Editor에서:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### OpenAI API 오류 (401, 429 등)

- API 키가 올바른지 확인
- OpenAI 계정에 크레딧이 있는지 확인 (https://platform.openai.com/usage)

### Supabase 연결 오류

- `.env.local`의 URL과 Keys가 정확한지 확인
- Supabase 프로젝트가 활성화 상태인지 확인

### TypeScript 오류

```bash
npm run build
```

빌드가 성공하면 타입 오류가 없는 것입니다.

## 다음 단계

1. 챗봇으로 여러 질문 테스트 (요금제, 서비스, 정책 등)
2. 대화 종료 후 요약 품질 확인
3. 지식 베이스에 더 많은 데이터 추가 (`scripts/seed-knowledge.ts` 수정)
4. 대리점 기능 개발 (Week 5-6)
5. 프로덕션 배포 준비

## 도움이 필요하신가요?

- README.md 파일 참조
- Supabase 문서: https://supabase.com/docs
- OpenAI API 문서: https://platform.openai.com/docs
- Next.js 문서: https://nextjs.org/docs
