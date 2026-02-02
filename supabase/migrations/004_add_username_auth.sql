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
