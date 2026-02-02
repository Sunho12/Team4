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
