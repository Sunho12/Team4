-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector extension for RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Profiles (사용자 정보)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('customer', 'agency_staff', 'admin')),
  full_name TEXT,
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Customer Sessions (익명 챗봇 사용자)
CREATE TABLE customer_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_token TEXT UNIQUE NOT NULL,
  customer_phone TEXT,
  customer_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Conversations (대화)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES customer_sessions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Messages (메시지)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  content_masked TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Conversation Summaries (대화 요약)
CREATE TABLE conversation_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID UNIQUE REFERENCES conversations(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  category TEXT,
  keywords TEXT[],
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Purchase Predictions (구매 예측)
CREATE TABLE purchase_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES customer_sessions(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL,
  probability_score DECIMAL(3,2) CHECK (probability_score >= 0 AND probability_score <= 1),
  confidence TEXT CHECK (confidence IN ('low', 'medium', 'high')),
  reasoning TEXT,
  recommended_actions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Agency Assignments (대리점 할당)
CREATE TABLE agency_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_staff_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  customer_session_id UUID REFERENCES customer_sessions(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_staff_id, customer_session_id)
);

-- 8. Knowledge Base (RAG용)
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  embedding vector(1536),
  document_type TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Audit Logs (감사 로그)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_customer_sessions_token ON customer_sessions(session_token);
CREATE INDEX idx_customer_sessions_phone ON customer_sessions(customer_phone);
CREATE INDEX idx_agency_assignments_staff ON agency_assignments(agency_staff_id);
CREATE INDEX idx_agency_assignments_customer ON agency_assignments(customer_session_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Create vector index for similarity search
CREATE INDEX idx_knowledge_base_embedding ON knowledge_base
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
