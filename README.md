# T-world 지능형 챗봇 및 판매 지원 시스템

T-world 고객용 LLM 챗봇과 대리점 판매 지원 시스템입니다.

## 핵심 기능

1. **고객용 웹 챗봇** - 통신 업무 상담 (요금제, 부가서비스 등)
2. **자동 대화 요약 생성** - GPT-4o 기반 대화 분석 및 요약
3. **대리점용 고객 검색** - 고객 검색 및 상담 내역 조회
4. **구매 의도 예측** - LLM 기반 기기 변경, 요금제 변경 예측

## 기술 스택

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI/LLM**: OpenAI GPT-4o, text-embedding-3-small
- **Auth**: Supabase Auth (현재 미구현, 데모용)

## 설치 및 실행

### 1. 의존성 설치

```bash
cd tworld-chatbot
npm install
```

### 2. Supabase 프로젝트 생성

1. https://supabase.com 접속
2. 새 프로젝트 생성
3. Project URL, anon key, service role key 복사

### 3. 환경변수 설정

`.env.local` 파일 생성:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-proj-your-openai-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. 데이터베이스 스키마 적용

Supabase Dashboard → SQL Editor에서 다음 파일들을 순서대로 실행:

1. `supabase/migrations/001_schema.sql` - 테이블 생성 + pgvector 활성화
2. `supabase/migrations/002_rls.sql` - Row Level Security 정책
3. `supabase/migrations/003_functions.sql` - 트리거 및 함수

### 5. 지식 베이스 구축 (RAG용)

```bash
npx tsx scripts/seed-knowledge.ts
```

이 스크립트는 T-world 요금제, 서비스 정보를 벡터 임베딩으로 변환하여 저장합니다.

### 6. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 접속

## 주요 페이지

- `/` - 메인 페이지 (고객 챗봇 / 대리점 대시보드 선택)
- `/chat` - 고객용 챗봇 인터페이스
- `/auth/login` - 대리점 로그인 (현재 데모용)
- `/search` - 대리점 고객 검색
- `/customers/[id]` - 고객 상세 정보 및 구매 예측

## 프로젝트 구조

```
tworld-chatbot/
├── app/                          # Next.js App Router
│   ├── (customer)/chat/         # 고객 챗봇 페이지
│   ├── (agency)/                # 대리점 페이지
│   ├── api/                     # API Routes
│   │   ├── chat/                # 챗봇 API
│   │   └── agency/              # 대리점 API
│   └── auth/                    # 인증 페이지
│
├── components/
│   ├── ui/                      # shadcn/ui 컴포넌트
│   ├── chat/                    # 챗봇 컴포넌트
│   └── agency/                  # 대리점 컴포넌트
│
├── lib/
│   ├── supabase/                # Supabase 클라이언트
│   ├── ai/                      # AI/LLM 통합
│   │   ├── openai.ts
│   │   ├── rag.ts               # RAG 파이프라인
│   │   ├── summarize.ts         # 대화 요약
│   │   └── predict.ts           # 구매 예측
│   ├── services/                # 비즈니스 로직
│   └── utils/
│
├── supabase/
│   ├── migrations/              # DB 마이그레이션
│   └── seed.sql                 # 샘플 데이터
│
└── scripts/
    └── seed-knowledge.ts        # 지식 베이스 구축
```

## 데이터베이스 스키마

### 주요 테이블

- `profiles` - 사용자 프로필 (customer, agency_staff, admin)
- `customer_sessions` - 고객 세션 (익명 챗봇 사용자)
- `conversations` - 대화
- `messages` - 메시지 (PII 자동 마스킹)
- `conversation_summaries` - 대화 요약
- `purchase_predictions` - 구매 의도 예측
- `agency_assignments` - 대리점 직원 할당
- `knowledge_base` - RAG용 지식 베이스 (벡터 임베딩)
- `audit_logs` - 감사 로그

## API 엔드포인트

### 고객 챗봇 API

- `POST /api/chat/session` - 새 세션 생성
- `POST /api/chat/conversation` - 대화 시작
- `GET /api/chat/messages` - 메시지 조회
- `POST /api/chat` - 메시지 전송 (RAG 기반 응답)
- `POST /api/chat/end` - 대화 종료 + 요약 생성

### 대리점 API

- `GET /api/agency/search` - 고객 검색
- `GET /api/agency/customer/[id]` - 고객 상세 조회
- `POST /api/agency/predict` - 구매 의도 분석

## 보안 기능

- **Row Level Security (RLS)**: 대리점 직원은 할당된 고객만 조회 가능
- **PII 자동 마스킹**: 전화번호, 이메일, 주민번호 자동 마스킹
- **감사 로그**: 모든 중요 작업 기록

## 테스트 방법

### 1. 고객 챗봇 테스트

1. http://localhost:3000/chat 접속
2. "안녕하세요, 5G 요금제 추천해주세요" 입력
3. RAG 기반 응답 확인
4. "대화 종료" 버튼 클릭 → 요약 확인

### 2. 대리점 기능 테스트

1. http://localhost:3000/search 접속
2. 고객 이름 또는 전화번호로 검색 (예: "홍길동")
3. 고객 카드 클릭 → 상세 페이지 이동
4. "구매 의향 분석" 버튼 클릭 → 예측 결과 확인

## 향후 개발 계획

### Week 1 완료 항목
- ✅ Next.js 프로젝트 초기화
- ✅ Supabase 데이터베이스 스키마 생성
- ✅ OpenAI 통합
- ✅ 기본 UI 컴포넌트

### Week 2-3 (진행 예정)
- 고객 챗봇 UI/UX 개선
- RAG 파이프라인 최적화
- 실시간 대화 (Supabase Realtime)
- 스트리밍 응답 구현

### Week 4 (진행 예정)
- 대화 요약 정확도 개선
- 카테고리 분류 고도화
- 감정 분석 정확도 향상

### Week 5 (진행 예정)
- 대리점 인증 시스템 구축 (Supabase Auth)
- 역할 기반 접근 제어 (RBAC)
- 대리점 직원 할당 기능

### Week 6 (진행 예정)
- 구매 예측 알고리즘 개선
- 추천 행동 자동 생성
- A/B 테스트 프레임워크

## 문제 해결

### pgvector extension 오류

Supabase에서 pgvector가 활성화되지 않은 경우:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### OpenAI API 오류

`.env.local`에 올바른 API 키가 설정되어 있는지 확인하세요.

### Supabase RLS 오류

Service Role Key를 사용하는 API에서는 RLS가 우회됩니다. 클라이언트 사이드에서는 Anon Key를 사용합니다.

## 라이선스

MIT License

## 개발자

T-world 지능형 챗봇 개발팀
