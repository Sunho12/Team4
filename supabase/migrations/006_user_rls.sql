-- Migration: Add Row Level Security policies for user data access control
-- This ensures users can only access their own data

-- Enable RLS on tables (if not already enabled)
ALTER TABLE customer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_predictions ENABLE ROW LEVEL SECURITY;

-- 1. Customer Sessions - users can only view their own sessions
CREATE POLICY "Users can view own sessions"
  ON customer_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON customer_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 2. Conversations - users can only view conversations from their sessions
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM customer_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM customer_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM customer_sessions WHERE user_id = auth.uid()
    )
  );

-- 3. Messages - users can only view messages from their conversations
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT c.id FROM conversations c
      INNER JOIN customer_sessions cs ON c.session_id = cs.id
      WHERE cs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own messages"
  ON messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT c.id FROM conversations c
      INNER JOIN customer_sessions cs ON c.session_id = cs.id
      WHERE cs.user_id = auth.uid()
    )
  );

-- 4. Conversation Summaries - users can only view their own summaries
CREATE POLICY "Users can view own summaries"
  ON conversation_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own summaries"
  ON conversation_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Purchase Predictions - users can only view their own predictions
CREATE POLICY "Users can view own predictions"
  ON purchase_predictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own predictions"
  ON purchase_predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Note: Service role bypasses RLS, so backend operations will still work
