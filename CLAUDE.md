# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

T-Bridge (T-world 지능형 챗봇 및 판매 지원 시스템) is an AI-powered customer support chatbot with an agency staff sales dashboard for SK Telecom. Built with Next.js 15, Supabase, and OpenAI GPT-4o.

**Status**: MVP complete (~80%), Week 1/6 of development

## Essential Commands

### Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev  # Starts on http://localhost:3000

# Build for production
npm run build

# Run production server
npm start

# Type checking
npx tsc --noEmit
```

### Database Operations
```bash
# Generate TypeScript types from Supabase schema
npx supabase gen types typescript --project-id <project-id> > lib/supabase/types.ts

# Seed knowledge base with vector embeddings
npx tsx scripts/seed-knowledge.ts

# Seed customer conversations and summaries
npx tsx scripts/seed-all-conversations.ts

# Test API endpoints
npx tsx scripts/test-conversations-api.ts
```

### Testing
```bash
# Run manual tests (no automated test suite yet)
npm run dev
# Navigate to /chat for customer chatbot
# Navigate to /agency/search for agency dashboard
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes with Server Actions
- **Database**: Supabase (PostgreSQL 15 + pgvector)
- **AI**: OpenAI GPT-4o (chat), text-embedding-3-small (RAG embeddings)
- **External APIs**: Kakao Maps API (store location search)

### Core Data Flow Architecture

The system follows a **profiles → customer_sessions → conversations → messages** chain:

```
profiles (user_id)
  ↓
customer_sessions (user_id FK)
  ↓
conversations (session_id FK)
  ↓ (parallel)
  ├─ messages (conversation_id FK) + PII auto-masking
  ├─ conversation_summaries (conversation_id FK) - AI-generated
  └─ purchase_predictions (session_id FK) - AI-analyzed
```

**Critical**: When querying customer data, always follow this chain:
1. Start with `profiles.id` (the user_id)
2. Query `customer_sessions` by `user_id`
3. Query `conversations` by `session_id`
4. Query related data by `conversation_id`

### Key Data Flows

#### 1. Customer Chat Flow
```
User Message
  → POST /api/chat
  → Save to messages table (PII auto-masked by trigger)
  → Check for store search keywords → Kakao Maps API if needed
  → Retrieve RAG context via pgvector similarity search
  → Build system prompt with context
  → OpenAI GPT-4o streaming response
  → Save assistant response
  → Return (with store results if applicable)
```

#### 2. Conversation Summarization
```
End Conversation
  → POST /api/chat/end
  → Fetch all messages
  → OpenAI GPT-4o with SUMMARIZE prompt
  → Parse JSON: {summary, category, keywords, sentiment}
  → Insert into conversation_summaries
```

#### 3. Purchase Prediction
```
Agency Analysis
  → POST /api/agency/predict
  → Fetch conversations + summaries
  → Run keyword-based predictions (device, plan, service, churn)
  → Optional: AI analysis for complex patterns
  → Save to purchase_predictions table
```

### Directory Structure

```
app/
├── (customer)/chat/          # Customer chatbot interface
├── (agency)/                 # Agency dashboard
│   ├── search/              # Customer search
│   └── customers/[id]/      # Customer detail view
├── api/
│   ├── chat/                # Chat endpoints (5 endpoints)
│   ├── agency/              # Agency endpoints (4 endpoints)
│   └── auth/                # Auth endpoints (in development)
└── auth/                    # Login/signup pages

lib/
├── ai/                      # AI layer
│   ├── openai.ts           # OpenAI client
│   ├── rag.ts              # RAG pipeline (embeddings + vector search)
│   ├── summarize.ts        # Conversation summarization
│   ├── predict.ts          # Purchase prediction engine
│   └── prompts.ts          # System prompts
├── services/               # Service layer
│   ├── chatService.ts      # Session/conversation/message management
│   ├── customerService.ts  # Customer search and detail retrieval
│   └── authService.ts      # Authentication logic
└── supabase/
    ├── client.ts           # SSR client (anon key)
    ├── server.ts           # Server-side clients (service role)
    └── types.ts            # Generated types

components/
├── ui/                     # shadcn/ui base components
├── chat/                   # Chat-specific components
└── agency/                 # Agency dashboard components
```

## Critical Patterns & Conventions

### 1. Supabase Client Usage

**ALWAYS use the correct client:**
```typescript
// In API routes and server-side operations
import { createServiceRoleClient } from '@/lib/supabase/server'
const supabase = await createServiceRoleClient()

// In client components (browser)
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
```

**Never use `createClient` in API routes** - it uses the anon key and RLS will block operations.

### 2. Customer Data Query Pattern

**CORRECT** way to query customer data:
```typescript
// 1. Get customer_sessions by user_id (profiles.id)
const { data: sessions } = await supabase
  .from('customer_sessions')
  .select('id')
  .eq('user_id', customerId)  // customerId = profiles.id

// 2. Get conversations by session_id
const sessionIds = sessions.map(s => s.id)
const { data: conversations } = await supabase
  .from('conversations')
  .select('*')
  .in('session_id', sessionIds)

// 3. Get summaries by conversation_id
const { data: summaries } = await supabase
  .from('conversation_summaries')
  .select('*')
  .eq('conversation_id', conversationId)
```

**INCORRECT** - Do NOT query customer_sessions by id when you have profiles.id:
```typescript
// ❌ WRONG - this queries by session id, not user_id
.eq('id', customerId)
```

### 3. Next.js 15 Async Params

All route params in Next.js 15 are async:
```typescript
export async function GET(
  request: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const { customerId } = await params  // ✅ MUST await
}
```

### 4. RAG Context Retrieval

To retrieve relevant context from knowledge_base:
```typescript
import { retrieveContext } from '@/lib/ai/rag'

const context = await retrieveContext(userMessage, {
  topK: 3,
  similarityThreshold: 0.5
})

// Inject into system prompt
const systemPrompt = `${basePrompt}\n\n관련 정보:\n${context}`
```

### 5. PII Masking

The `messages` table has a trigger that automatically masks PII:
- `content` - Original message
- `content_masked` - Auto-masked version (phone numbers, emails, SSN, credit cards, addresses)

**Use `content_masked` for analytics/logging, `content` for display to authorized users only.**

### 6. Store Location Search

Kakao Maps integration is built-in for store searches:
```typescript
import { searchSKTStores } from '@/lib/utils/storeSearch'

// Detect keywords: 매장, 지점, 대리점, etc.
const storeKeywords = ['매장', '지점', '대리점', '샵', '찾아', '어디']
if (storeKeywords.some(kw => message.includes(kw))) {
  const stores = await searchSKTStores(message)
  // Return stores alongside chat response
}
```

## Database Schema Key Points

### Core Tables (9 total)
1. **profiles** - User profiles (role: customer, agency_staff, admin)
2. **customer_sessions** - Anonymous chat sessions (user_id → profiles.id)
3. **conversations** - Chat conversations (session_id → customer_sessions.id)
4. **messages** - Messages with automatic PII masking
5. **conversation_summaries** - AI summaries (conversation_id FK)
6. **purchase_predictions** - AI predictions (session_id FK)
7. **knowledge_base** - RAG vector embeddings (pgvector)
8. **agency_assignments** - (Being phased out)
9. **audit_logs** - (Being phased out)

### Recent Migration Changes (Migration 008)
- Dropped 7 unused tables (purchase_history, demographics, devices, family_members, app_usage_metrics, customer_demographics_new, customer_demographics_backup)
- Fixed FK references: Changed from `auth.users(id)` → `profiles(id)`
- Simplified prediction engine to conversation-only analysis
- Updated RLS policies for cookie-based auth

## API Endpoints Reference

### Chat API
- `POST /api/chat/session` - Create new session (requires auth)
- `POST /api/chat/conversation` - Create new conversation
- `GET /api/chat/messages?conversationId=xxx` - Fetch messages
- `POST /api/chat` - Send message & get AI response
- `POST /api/chat/end` - End conversation & generate summary

### Agency API
- `GET /api/agency/search?q=query` - Search customers
- `GET /api/agency/customer/[customerId]` - Get customer detail
- `GET /api/agency/customer/[customerId]/conversations` - Get conversations
- `POST /api/agency/predict` - Analyze purchase intent

### Auth API (In Development)
- `POST /api/auth/signup` - Register
- `POST /api/auth/signin` - Login
- `POST /api/auth/signout` - Logout
- `GET /api/auth/me` - Get current user

## Environment Variables

Required in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=              # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=         # Public anon key
SUPABASE_SERVICE_ROLE_KEY=             # Secret service role key (never expose)
OPENAI_API_KEY=                        # OpenAI API key
NEXT_PUBLIC_APP_URL=                   # Application base URL
NEXT_PUBLIC_KAKAO_JS_KEY=              # Kakao Maps JS key (client-side)
KAKAO_REST_API_KEY=                    # Kakao Maps REST API key (server-side)
```

## Known Issues & Tech Debt

### Current Issues
1. **Authentication**: Simple auth implemented, but Supabase Auth planned for Week 2
2. **RLS Policies**: Currently bypassed using service role key in all APIs
3. **Input Validation**: No Zod schemas yet - validation is manual
4. **Error Handling**: Basic error responses, needs improvement
5. **Rate Limiting**: Not implemented

### Future Work
- Streaming responses for chat (OpenAI SDK supports it)
- Real-time updates using Supabase subscriptions
- Admin dashboard
- Mobile-responsive optimization
- Comprehensive test suite
- Performance monitoring

## Debugging Tips

### Console Logging Pattern
APIs use prefixed console logs:
```typescript
console.log('[Conversations API] Customer ID:', customerId)
console.log('[Conversations API] Sessions found:', sessions?.length || 0)
```

Use this pattern for consistency when adding new logs.

### Common Errors

**Error: "Cannot coerce the result to a single JSON object"**
- Cause: Using `.single()` on a query that returns 0 or multiple rows
- Fix: Remove `.single()` or use `.maybeSingle()` if 0-1 rows expected

**Error: "Foreign key constraint violation"**
- Cause: Trying to insert with FK referencing auth.users instead of profiles
- Fix: Use `profiles.id` as the FK reference, not `auth.users.id`

**Error: "createClient is not exported from '@/lib/supabase/server'"**
- Cause: Using wrong import in API route
- Fix: Change to `import { createServiceRoleClient } from '@/lib/supabase/server'`

## Additional Documentation

For deeper understanding, read these files in order:
1. **ARCHITECTURE.md** - Comprehensive system architecture (28KB, most detailed)
2. **README.md** - Project overview and quick start
3. **PROJECT_SUMMARY.md** - Development roadmap and status
4. **MIGRATION_008_SUMMARY.md** - Recent database changes

## Korean Language Notes

This codebase uses Korean for:
- UI text and labels
- Chat messages and responses
- Database content (customer names, conversation summaries)
- API response messages
- Console logs (mixed Korean/English)

When writing new features, maintain consistency with existing Korean text patterns.
