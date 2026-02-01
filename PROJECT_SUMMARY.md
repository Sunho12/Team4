# T-world 지능형 챗봇 프로젝트 요약

## 📋 프로젝트 정보

**프로젝트명**: T-world 지능형 챗봇 및 판매 지원 시스템
**위치**: `C:\Users\SKTelecom\Desktop\PROJECT\tworld-chatbot`
**상태**: Week 1 완료 (MVP 기반 80% 완성)
**개발 기간**: Week 1/6 완료

---

## 🎯 프로젝트 목표

1. **고객용 AI 챗봇** - 통신 업무 상담 자동화
2. **대화 요약** - GPT-4o 기반 자동 분석 및 분류
3. **대리점 지원** - 고객 검색 및 상담 이력 조회
4. **구매 예측** - AI 기반 구매 의향 분석

---

## 🛠️ 기술 스택

| 구분 | 기술 |
|------|------|
| **프론트엔드** | Next.js 15, React 19, TypeScript, Tailwind CSS |
| **UI 라이브러리** | shadcn/ui, Radix UI |
| **백엔드** | Next.js API Routes (Server Actions) |
| **데이터베이스** | Supabase (PostgreSQL) |
| **벡터 DB** | pgvector (Supabase 내장) |
| **AI/LLM** | OpenAI GPT-4o, text-embedding-3-small |
| **인증** | Supabase Auth (미구현, 예정) |
| **배포** | Vercel (예정) |

---

## 📁 프로젝트 구조

```
tworld-chatbot/
├── app/                                # Next.js App Router
│   ├── (customer)/chat/               # 고객 챗봇 페이지
│   ├── (agency)/                      # 대리점 페이지
│   │   ├── search/                    # 고객 검색
│   │   └── customers/[customerId]/    # 고객 상세
│   ├── api/                           # API Routes
│   │   ├── chat/                      # 챗봇 API (5개 엔드포인트)
│   │   └── agency/                    # 대리점 API (3개 엔드포인트)
│   └── auth/login/                    # 로그인 페이지
│
├── components/
│   ├── ui/                            # shadcn/ui 기본 컴포넌트 (6개)
│   ├── chat/                          # 챗봇 컴포넌트 (3개)
│   └── agency/                        # 대리점 컴포넌트 (2개)
│
├── lib/
│   ├── supabase/                      # DB 클라이언트
│   ├── ai/                            # AI/LLM 통합
│   │   ├── openai.ts                  # OpenAI 클라이언트
│   │   ├── rag.ts                     # RAG 파이프라인
│   │   ├── summarize.ts               # 대화 요약
│   │   └── predict.ts                 # 구매 예측
│   ├── services/                      # 비즈니스 로직
│   │   ├── chatService.ts             # 채팅 관리
│   │   ├── customerService.ts         # 고객 관리
│   │   └── auditService.ts            # 감사 로그
│   └── utils/                         # 유틸리티
│
├── supabase/
│   ├── migrations/                    # DB 마이그레이션 (3개)
│   │   ├── 001_schema.sql             # 테이블 생성
│   │   ├── 002_rls.sql                # RLS 정책
│   │   └── 003_functions.sql          # 트리거/함수
│   └── seed.sql                       # 샘플 데이터
│
├── scripts/
│   └── seed-knowledge.ts              # 지식 베이스 구축
│
├── types/                             # TypeScript 타입 정의
│
└── 문서/
    ├── README.md                      # 프로젝트 개요
    ├── SETUP.md                       # 설정 가이드
    ├── QUICKSTART_CHECKLIST.md        # 빠른 시작 체크리스트
    ├── IMPLEMENTATION_STATUS.md       # 구현 현황
    └── PROJECT_SUMMARY.md             # 이 문서
```

---

## 💾 데이터베이스 스키마

### 9개 테이블

1. **profiles** - 사용자 프로필 (customer, agency_staff, admin)
2. **customer_sessions** - 고객 세션 (익명 챗봇 사용자)
3. **conversations** - 대화 (active/ended)
4. **messages** - 메시지 (PII 자동 마스킹)
5. **conversation_summaries** - 대화 요약 (카테고리, 키워드, 감정)
6. **purchase_predictions** - 구매 의도 예측
7. **agency_assignments** - 대리점 직원 할당
8. **knowledge_base** - RAG용 지식 베이스 (벡터 임베딩)
9. **audit_logs** - 감사 로그

### 보안 기능

- **Row Level Security (RLS)**: 역할 기반 데이터 접근 제어
- **PII 마스킹**: 전화번호, 이메일, 주민번호 자동 마스킹
- **감사 로그**: 모든 중요 작업 자동 기록

---

## 🔑 핵심 기능

### ✅ 구현 완료

#### 1. RAG 기반 고객 챗봇
- 실시간 대화 (세션 자동 생성)
- pgvector 기반 유사도 검색
- 컨텍스트 기반 응답 생성
- 대화 기록 저장 (PII 마스킹)

#### 2. 자동 대화 요약
- 대화 종료 시 GPT-4o 분석
- 카테고리 자동 분류 (7가지)
- 키워드 추출
- 감정 분석 (긍정/중립/부정)

#### 3. 대리점 고객 검색
- 이름/전화번호 검색
- 상담 이력 타임라인
- 요약 카드 뷰

#### 4. AI 구매 예측
- 최근 대화 이력 분석
- 기기 변경/요금제 변경/서비스 가입 확률
- 신뢰도 점수
- 추천 행동 제공

### ⏳ 미구현 (향후 개발)

- 대리점 인증 시스템 (Supabase Auth)
- 실시간 대화 (Supabase Realtime)
- 스트리밍 응답
- 관리자 대시보드
- 통계/분석 차트
- 모바일 앱

---

## 📊 코드 통계

| 항목 | 수량 |
|------|------|
| **총 파일 수** | 45개 |
| **TypeScript/TSX** | 39개 |
| **SQL 스크립트** | 3개 |
| **총 코드 라인** | ~3,200 lines |
| **컴포넌트** | 11개 |
| **API 엔드포인트** | 8개 |
| **데이터베이스 테이블** | 9개 |
| **지식 베이스 문서** | 10개 |

---

## 🚀 시작하기

### 필수 요구사항

- Node.js 18 이상
- npm 또는 yarn
- Supabase 계정
- OpenAI API 키 ($5 크레딧 권장)

### 빠른 시작 (30분)

1. **환경 설정**
   ```bash
   cd tworld-chatbot
   cp .env.example .env.local
   # .env.local 편집 (Supabase + OpenAI 키 입력)
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **데이터베이스 스키마 적용**
   - Supabase Dashboard → SQL Editor
   - `supabase/migrations/` 파일 순서대로 실행

4. **지식 베이스 구축**
   ```bash
   npx tsx scripts/seed-knowledge.ts
   ```

5. **개발 서버 실행**
   ```bash
   npm run dev
   ```

6. **테스트**
   - http://localhost:3000/chat 접속
   - "5G 요금제 추천해주세요" 입력

📖 **상세 가이드**: `QUICKSTART_CHECKLIST.md` 참조

---

## 🧪 테스트 시나리오

### 시나리오 1: 요금제 문의
```
사용자: "5G 요금제 추천해주세요"
AI: [5G 프리미어, 스탠다드 플랜 정보 제공]

사용자: "가격 차이가 뭔가요?"
AI: [가격 및 데이터 용량 비교]

사용자: "80,000원짜리로 하고 싶어요"
AI: [5G 프리미어 플랜 상세 안내]

[대화 종료]
→ 요약: "고객이 5G 요금제를 문의하고 프리미어 플랜에 관심 표명"
→ 카테고리: plan_change
→ 키워드: ["5G", "프리미어", "요금제"]
→ 감정: positive
```

### 시나리오 2: 서비스 문의
```
사용자: "데이터 쉐어링이 뭔가요?"
AI: [데이터 쉐어링 서비스 설명]

사용자: "가족이 5명인데 가능한가요?"
AI: [최대 5명까지 가능하다고 안내]

[대화 종료]
→ 요약: "데이터 쉐어링 서비스 문의 및 가족 구성원 수 확인"
→ 카테고리: add_service
→ 키워드: ["데이터 쉐어링", "가족", "5명"]
→ 감정: neutral
```

---

## 📈 개발 로드맵

### Week 1 ✅ 완료
- 프로젝트 초기화
- 데이터베이스 스키마
- RAG 파이프라인
- 기본 챗봇 UI
- 대화 요약
- 구매 예측

### Week 2-3 📅 예정
- UI/UX 개선
- 스트리밍 응답
- 실시간 대화
- 대화 기록 조회
- 추천 질문

### Week 4 📅 예정
- 요약 정확도 개선
- 카테고리 분류 고도화
- 멀티턴 대화 컨텍스트

### Week 5-6 📅 예정
- Supabase Auth 통합
- 대리점 대시보드
- 통계 및 분석
- 프로덕션 배포

---

## 📝 주요 설정 파일

| 파일 | 용도 |
|------|------|
| `.env.local` | 환경변수 (API 키, DB 연결) |
| `package.json` | 의존성 관리 |
| `tsconfig.json` | TypeScript 설정 |
| `tailwind.config.ts` | Tailwind CSS 설정 |
| `next.config.js` | Next.js 설정 |

---

## 🔒 보안 고려사항

### 구현됨
- ✅ 환경변수로 API 키 관리
- ✅ Row Level Security (RLS)
- ✅ PII 자동 마스킹
- ✅ 감사 로그

### 향후 필요
- ⏳ Rate limiting
- ⏳ HTTPS 강제 (프로덕션)
- ⏳ Input validation (Zod)
- ⏳ CSRF 보호

---

## 💰 예상 비용 (월간, 사용자 1000명 기준)

| 항목 | 비용 |
|------|------|
| **OpenAI API** | $200-500 |
| **Supabase Pro** | $25 |
| **Vercel Pro** | $20 (선택사항) |
| **총계** | $245-545 |

---

## 🐛 알려진 이슈

1. **인증 미구현** - 현재 대리점 기능은 인증 없이 접근 가능
2. **RLS 부분 동작** - 인증 없이는 RLS 정책이 완전히 적용되지 않음
3. **스트리밍 미지원** - OpenAI 응답을 한 번에 받음 (느릴 수 있음)
4. **모바일 최적화 부족** - 반응형이지만 추가 최적화 필요

---

## 📚 참고 문서

- **프로젝트 설정**: `SETUP.md`
- **빠른 시작**: `QUICKSTART_CHECKLIST.md`
- **구현 상세**: `IMPLEMENTATION_STATUS.md`
- **전체 개요**: `README.md`

---

## 🤝 기여 방법

1. 지식 베이스 확장 (`scripts/seed-knowledge.ts`)
2. UI 컴포넌트 개선
3. 새로운 카테고리 추가
4. 프롬프트 엔지니어링 개선
5. 테스트 코드 작성

---

## 📞 지원

- **문서**: 프로젝트 루트의 `.md` 파일들 참조
- **Supabase**: https://supabase.com/docs
- **OpenAI**: https://platform.openai.com/docs
- **Next.js**: https://nextjs.org/docs

---

## ✨ 핵심 성과

- ✅ **완전 동작하는 AI 챗봇** (RAG 기반)
- ✅ **자동 대화 분석 및 요약**
- ✅ **확장 가능한 아키텍처**
- ✅ **보안 기능 내장** (RLS, PII 마스킹)
- ✅ **프로덕션 준비 40%**

---

**현재 상태**: MVP 완성, 테스트 가능, 즉시 데모 가능
**다음 단계**: 인증 시스템 구현 및 UI/UX 개선

**마지막 업데이트**: 2026-02-01
