# 시스템 아키텍처

## 전체 시스템 구조

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐           ┌──────────────────┐       │
│  │  Customer Chat   │           │  Agency Dashboard│       │
│  │   (Next.js UI)   │           │   (Next.js UI)   │       │
│  │                  │           │                  │       │
│  │  - ChatInterface │           │  - CustomerSearch│       │
│  │  - MessageList   │           │  - Timeline      │       │
│  │  - MessageInput  │           │  - Predictions   │       │
│  └────────┬─────────┘           └────────┬─────────┘       │
│           │                              │                 │
└───────────┼──────────────────────────────┼─────────────────┘
            │                              │
            ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER (Next.js)                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              API Routes (8 endpoints)                │  │
│  │                                                      │  │
│  │  Chat API              Agency API                   │  │
│  │  ├── POST /session     ├── GET  /search            │  │
│  │  ├── POST /conversation├── GET  /customer/[id]     │  │
│  │  ├── GET  /messages    └── POST /predict           │  │
│  │  ├── POST / (send)                                  │  │
│  │  └── POST /end                                      │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                      │
│  ┌──────────────────┴───────────────────────────────────┐  │
│  │              Services Layer                          │  │
│  │                                                      │  │
│  │  ├── chatService      (세션, 대화, 메시지 관리)      │  │
│  │  ├── customerService  (고객 검색, 조회)             │  │
│  │  └── auditService     (감사 로그)                   │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                      │
└─────────────────────┼──────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
┌────────────────┐          ┌────────────────┐
│  AI/LLM Layer  │          │  Database      │
├────────────────┤          ├────────────────┤
│                │          │                │
│ ┌────────────┐ │          │  Supabase      │
│ │ OpenAI API │ │          │  (PostgreSQL)  │
│ │            │ │          │                │
│ │ GPT-4o     │ │          │  9 Tables:     │
│ │ Embeddings │ │          │  - profiles    │
│ └────────────┘ │          │  - sessions    │
│                │          │  - conversations│
│ ┌────────────┐ │          │  - messages    │
│ │ RAG Pipeline│ │          │  - summaries   │
│ │            │ │          │  - predictions │
│ │ ├─ Retrieve│◄┼──────────┤  - assignments │
│ │ ├─ Embed   │ │          │  - knowledge   │
│ │ └─ Generate│ │          │  - audit_logs  │
│ └────────────┘ │          │                │
│                │          │  Extensions:   │
│ ┌────────────┐ │          │  - pgvector    │
│ │ Summarize  │ │          │                │
│ └────────────┘ │          │  Features:     │
│                │          │  - RLS         │
│ ┌────────────┐ │          │  - Triggers    │
│ │ Predict    │ │          │  - Functions   │
│ └────────────┘ │          │                │
│                │          │                │
└────────────────┘          └────────────────┘
```

---

## 데이터 흐름

### 1. 고객 챗봇 대화 플로우

```
[사용자]
   │
   ▼ "5G 요금제 추천해주세요"
   │
[ChatInterface]
   │
   ├─► POST /api/chat/session (최초 1회)
   │   └─► DB: customer_sessions 생성
   │
   ├─► POST /api/chat/conversation
   │   └─► DB: conversations 생성
   │
   ▼ 메시지 전송
   │
POST /api/chat
   │
   ├─► DB: messages 저장 (role: user)
   │   └─► Trigger: PII 자동 마스킹
   │
   ├─► RAG Pipeline
   │   ├─► Embeddings API
   │   │   └─► 질문 벡터화
   │   │
   │   ├─► pgvector 검색
   │   │   └─► knowledge_base 유사도 검색
   │   │
   │   └─► 관련 컨텍스트 추출
   │
   ├─► OpenAI GPT-4o
   │   ├─► 시스템 프롬프트 + 컨텍스트
   │   ├─► 사용자 질문
   │   └─► 응답 생성
   │
   ├─► DB: messages 저장 (role: assistant)
   │
   └─► 응답 반환
       │
       ▼
   [ChatInterface] 메시지 표시
```

### 2. 대화 종료 및 요약 플로우

```
[사용자] "대화 종료" 클릭
   │
   ▼
POST /api/chat/end
   │
   ├─► DB: conversations.status = 'ended'
   │
   ├─► DB: messages 조회
   │   └─► 대화 내역 전체 로딩
   │
   ├─► OpenAI GPT-4o
   │   ├─► 시스템 프롬프트 (요약 지시)
   │   ├─► 전체 대화 내역
   │   └─► JSON 응답
   │       {
   │         summary: "...",
   │         category: "plan_change",
   │         keywords: ["5G", "요금제"],
   │         sentiment: "positive"
   │       }
   │
   ├─► DB: conversation_summaries 저장
   │
   └─► 요약 반환
       │
       ▼
   [ChatInterface] 요약 화면 표시
```

### 3. 대리점 고객 검색 플로우

```
[대리점 직원] 검색어 입력 "홍길동"
   │
   ▼
GET /api/agency/search?q=홍길동
   │
   ├─► DB: customer_sessions 검색
   │   ├─► WHERE customer_name ILIKE '%홍길동%'
   │   │   OR customer_phone ILIKE '%홍길동%'
   │   │
   │   └─► JOIN conversations
   │       └─► JOIN conversation_summaries
   │
   ├─► RLS 정책 적용
   │   └─► 할당된 고객만 필터링
   │       (agency_assignments 확인)
   │
   └─► 고객 목록 반환
       │
       ▼
   [SearchPage] 고객 카드 표시
```

### 4. 구매 의도 예측 플로우

```
[대리점 직원] "구매 의향 분석" 클릭
   │
   ▼
POST /api/agency/predict
   │
   ├─► DB: conversations 조회
   │   ├─► WHERE session_id = ?
   │   ├─► ORDER BY started_at DESC
   │   ├─► LIMIT 5 (최근 5개)
   │   └─► JOIN conversation_summaries
   │
   ├─► OpenAI GPT-4o
   │   ├─► 시스템 프롬프트 (예측 지시)
   │   ├─► 대화 요약 이력
   │   └─► JSON 응답
   │       {
   │         predictions: [
   │           {
   │             prediction_type: "device_upgrade",
   │             probability_score: 0.75,
   │             confidence: "high",
   │             reasoning: "...",
   │             recommended_actions: [...]
   │           }
   │         ]
   │       }
   │
   ├─► DB: purchase_predictions 저장
   │
   └─► 예측 결과 반환
       │
       ▼
   [PredictionScoreCard] 예측 카드 표시
```

---

## 보안 레이어

```
┌─────────────────────────────────────────┐
│          Security Layers                │
├─────────────────────────────────────────┤
│                                         │
│  1. Environment Variables               │
│     └─ API Keys (OpenAI, Supabase)      │
│                                         │
│  2. Row Level Security (RLS)            │
│     ├─ Customer: 자신의 대화만          │
│     ├─ Agency: 할당된 고객만            │
│     └─ Admin: 모든 데이터               │
│                                         │
│  3. PII Masking (Trigger)               │
│     ├─ 전화번호: 010-****-5678          │
│     ├─ 이메일: u***@example.com         │
│     └─ 주민번호: 123456-*******         │
│                                         │
│  4. Audit Logging                       │
│     └─ 모든 중요 작업 기록              │
│                                         │
│  5. Input Validation (Future)           │
│     └─ Zod 스키마                       │
│                                         │
└─────────────────────────────────────────┘
```

---

## RAG 파이프라인 상세

```
┌─────────────────────────────────────────────────────────┐
│              RAG (Retrieval-Augmented Generation)       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  사용자 질문: "5G 요금제 추천해주세요"                  │
│       │                                                 │
│       ▼                                                 │
│  ┌─────────────────┐                                   │
│  │ 1. Embedding    │                                   │
│  │   Generation    │                                   │
│  │                 │                                   │
│  │ OpenAI API      │                                   │
│  │ text-embedding  │                                   │
│  │ -3-small        │                                   │
│  │                 │                                   │
│  │ Output:         │                                   │
│  │ [0.123, -0.456, │                                   │
│  │  0.789, ...]    │                                   │
│  │ (1536 dims)     │                                   │
│  └────────┬────────┘                                   │
│           │                                            │
│           ▼                                            │
│  ┌─────────────────┐                                   │
│  │ 2. Vector       │                                   │
│  │   Search        │                                   │
│  │                 │                                   │
│  │ pgvector        │                                   │
│  │ Cosine          │                                   │
│  │ Similarity      │                                   │
│  │                 │                                   │
│  │ SELECT *        │                                   │
│  │ FROM knowledge  │                                   │
│  │ ORDER BY        │                                   │
│  │ embedding <=>   │                                   │
│  │ query_vector    │                                   │
│  │ LIMIT 3         │                                   │
│  └────────┬────────┘                                   │
│           │                                            │
│           ▼                                            │
│  ┌─────────────────┐                                   │
│  │ 3. Context      │                                   │
│  │   Retrieval     │                                   │
│  │                 │                                   │
│  │ 관련 문서:      │                                   │
│  │                 │                                   │
│  │ 1. "5G 프리미어 │                                   │
│  │    플랜: 월     │                                   │
│  │    80,000원..." │                                   │
│  │                 │                                   │
│  │ 2. "5G 스탠다드 │                                   │
│  │    플랜: 월     │                                   │
│  │    60,000원..." │                                   │
│  │                 │                                   │
│  │ 3. "LTE 베이직  │                                   │
│  │    플랜: 월     │                                   │
│  │    40,000원..." │                                   │
│  └────────┬────────┘                                   │
│           │                                            │
│           ▼                                            │
│  ┌─────────────────┐                                   │
│  │ 4. Response     │                                   │
│  │   Generation    │                                   │
│  │                 │                                   │
│  │ OpenAI GPT-4o   │                                   │
│  │                 │                                   │
│  │ System:         │                                   │
│  │ "당신은 T-world │                                   │
│  │  상담 AI입니다" │                                   │
│  │                 │                                   │
│  │ Context:        │                                   │
│  │ [관련 문서들]   │                                   │
│  │                 │                                   │
│  │ User:           │                                   │
│  │ "5G 요금제      │                                   │
│  │  추천해주세요"  │                                   │
│  │                 │                                   │
│  │ ↓               │                                   │
│  │                 │                                   │
│  │ Assistant:      │                                   │
│  │ "5G 요금제는    │                                   │
│  │  두 가지가      │                                   │
│  │  있습니다..."   │                                   │
│  └─────────────────┘                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 데이터베이스 스키마 관계도

```
┌──────────────┐
│   profiles   │
│              │
│ • id (PK)    │
│ • role       │
│ • full_name  │
└───────┬──────┘
        │
        │ (FK)
        ▼
┌──────────────────┐         ┌──────────────────┐
│agency_assignments│         │customer_sessions │
│                  │         │                  │
│ • id (PK)        │    ┌───►│ • id (PK)        │
│ • agency_staff_id├────┘    │ • session_token  │
│ • customer_id    ├────────►│ • customer_phone │
└──────────────────┘         │ • customer_name  │
                             └────────┬─────────┘
                                      │
                                      │ (FK)
                                      ▼
                             ┌────────────────┐
                             │ conversations  │
                             │                │
                        ┌───►│ • id (PK)      │◄────┐
                        │    │ • session_id   │     │
                        │    │ • status       │     │
                        │    └────────┬───────┘     │
                        │             │             │
                        │             │ (FK)        │ (FK)
                        │             ▼             │
                        │    ┌────────────────┐    │
                        │    │   messages     │    │
                        │    │                │    │
                        │    │ • id (PK)      │    │
                        │    │ • conversation │    │
                        │    │ • role         │    │
                        │    │ • content      │    │
                        │    │ • content_     │    │
                        │    │   masked       │    │
                        │    └────────────────┘    │
                        │                          │
                        │ (FK: conversation_id)    │
                        │                          │
         ┌──────────────┴────────┐  ┌──────────────┴──────────┐
         │                       │  │                         │
    ┌────▼─────────────┐  ┌──────▼──────────┐                │
    │ conversation_    │  │  purchase_      │                │
    │   summaries      │  │  predictions    │                │
    │                  │  │                 │                │
    │ • id (PK)        │  │ • id (PK)       │                │
    │ • conversation   │  │ • session_id    │                │
    │ • summary        │  │ • prediction_   │                │
    │ • category       │  │   type          │                │
    │ • keywords       │  │ • probability_  │                │
    │ • sentiment      │  │   score         │                │
    └──────────────────┘  │ • confidence    │                │
                          │ • reasoning     │                │
                          │ • recommended_  │                │
                          │   actions       │                │
                          └─────────────────┘                │
                                                             │
         ┌───────────────────────────────────────────────────┘
         │
    ┌────▼──────────┐
    │ knowledge_    │
    │   base        │
    │               │
    │ • id (PK)     │
    │ • content     │
    │ • embedding   │  ◄─── pgvector (1536 dims)
    │ • document_   │
    │   type        │
    │ • metadata    │
    └───────────────┘

         ┌──────────────┐
         │ audit_logs   │
         │              │
         │ • id (PK)    │
         │ • user_id    │
         │ • action     │
         │ • resource   │
         │ • details    │
         └──────────────┘
```

---

## 기술 스택 상세

```
┌─────────────────────────────────────────────────┐
│              Technology Stack                   │
├─────────────────────────────────────────────────┤
│                                                 │
│ Frontend                                        │
│ ├── Next.js 15 (App Router)                    │
│ ├── React 19                                    │
│ ├── TypeScript 5.7                              │
│ ├── Tailwind CSS 3.4                            │
│ └── shadcn/ui + Radix UI                        │
│                                                 │
│ Backend                                         │
│ ├── Next.js API Routes                          │
│ ├── Server Actions                              │
│ └── Edge Runtime (선택사항)                      │
│                                                 │
│ Database                                        │
│ ├── Supabase (PostgreSQL 15)                   │
│ ├── pgvector 0.5+                               │
│ ├── Row Level Security                          │
│ └── Triggers & Functions                        │
│                                                 │
│ AI/ML                                           │
│ ├── OpenAI GPT-4o                               │
│ ├── text-embedding-3-small                      │
│ └── RAG Pipeline (Custom)                       │
│                                                 │
│ Development                                     │
│ ├── ESLint                                      │
│ ├── Prettier (권장)                             │
│ └── Git                                         │
│                                                 │
│ Deployment (향후)                               │
│ ├── Vercel                                      │
│ ├── Railway (대안)                              │
│ └── Cloudflare Workers (대안)                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 확장 가능성

### 수평 확장 (Horizontal Scaling)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Next.js    │     │  Next.js    │     │  Next.js    │
│  Instance 1 │     │  Instance 2 │     │  Instance 3 │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Load Balancer│
                    │  (Vercel)    │
                    └──────┬───────┘
                           │
           ┌───────────────┴───────────────┐
           │                               │
           ▼                               ▼
    ┌─────────────┐                 ┌─────────────┐
    │  Supabase   │                 │   OpenAI    │
    │  (managed)  │                 │  (managed)  │
    └─────────────┘                 └─────────────┘
```

### 수직 확장 (Vertical Scaling)

- Supabase: Free → Pro → Team → Enterprise
- OpenAI: 처리량 증가 (Tier 1 → Tier 5)
- Next.js: Edge Functions 활용

---

## 성능 최적화 전략

1. **캐싱**
   - Next.js ISR (Incremental Static Regeneration)
   - Redis 캐싱 (향후)
   - OpenAI 응답 캐싱

2. **데이터베이스**
   - 인덱스 최적화 (이미 구현됨)
   - 쿼리 최적화
   - Connection Pooling

3. **AI/LLM**
   - 프롬프트 캐싱
   - 배치 처리
   - 스트리밍 응답

---

**마지막 업데이트**: 2026-02-01
