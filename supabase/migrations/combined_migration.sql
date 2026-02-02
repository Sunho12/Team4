-- Migration: Add username authentication support
-- This migration adds username-based authentication while using Supabase Auth

-- 1. Add username column to profiles table
ALTER TABLE profiles
ADD COLUMN username TEXT UNIQUE;

-- Create index for username lookups
CREATE INDEX idx_profiles_username ON profiles(username);

-- 2. Add user_id to customer_sessions (make it nullable first, then we'll add NOT NULL constraint after data migration)
ALTER TABLE customer_sessions
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for user_id
CREATE INDEX idx_customer_sessions_user_id ON customer_sessions(user_id);

-- 3. Add user_id to conversation_summaries for denormalization (faster queries)
ALTER TABLE conversation_summaries
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX idx_conversation_summaries_user_id ON conversation_summaries(user_id);

-- 4. Add user_id to purchase_predictions for denormalization
ALTER TABLE purchase_predictions
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX idx_purchase_predictions_user_id ON purchase_predictions(user_id);

-- Note: We're not making user_id NOT NULL yet to allow for data migration
-- In a production scenario, you would:
-- 1. Run this migration
-- 2. Migrate existing data (set user_id for existing sessions)
-- 3. Run another migration to add NOT NULL constraint
-- Migration: Add triggers to automatically set user_id in related tables
-- This ensures data consistency when creating summaries and predictions

-- 1. Trigger function to set user_id in conversation_summaries
CREATE OR REPLACE FUNCTION set_summary_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get user_id from the conversation's session
  SELECT cs.user_id INTO NEW.user_id
  FROM conversations c
  INNER JOIN customer_sessions cs ON c.session_id = cs.id
  WHERE c.id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for conversation_summaries
CREATE TRIGGER auto_set_summary_user_id
  BEFORE INSERT ON conversation_summaries
  FOR EACH ROW
  EXECUTE FUNCTION set_summary_user_id();

-- 2. Trigger function to set user_id in purchase_predictions
CREATE OR REPLACE FUNCTION set_prediction_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get user_id from the session
  SELECT user_id INTO NEW.user_id
  FROM customer_sessions
  WHERE id = NEW.session_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for purchase_predictions
CREATE TRIGGER auto_set_prediction_user_id
  BEFORE INSERT ON purchase_predictions
  FOR EACH ROW
  EXECUTE FUNCTION set_prediction_user_id();
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
