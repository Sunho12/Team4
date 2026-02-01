-- Function to automatically mask PII in messages
CREATE OR REPLACE FUNCTION auto_mask_pii()
RETURNS TRIGGER AS $$
DECLARE
  masked_content TEXT;
BEGIN
  masked_content := NEW.content;

  -- Mask phone numbers (010-1234-5678 -> 010-****-5678)
  masked_content := regexp_replace(
    masked_content,
    '(01[0-9])-?([0-9]{3,4})-?([0-9]{4})',
    '\1-****-\3',
    'g'
  );

  -- Mask email addresses (user@example.com -> u***@example.com)
  masked_content := regexp_replace(
    masked_content,
    '([a-zA-Z0-9._%+-])[a-zA-Z0-9._%+-]*@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})',
    '\1***@\2',
    'g'
  );

  -- Mask Korean resident registration numbers (123456-1234567 -> 123456-*******)
  masked_content := regexp_replace(
    masked_content,
    '([0-9]{6})-?([0-9]{7})',
    '\1-*******',
    'g'
  );

  NEW.content_masked := masked_content;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to mask PII before insert
CREATE TRIGGER mask_message_pii
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION auto_mask_pii();

-- Function for vector similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_count INT DEFAULT 5,
  match_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  document_type TEXT,
  metadata JSONB,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.content,
    kb.document_type,
    kb.metadata,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM knowledge_base kb
  WHERE 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_customer_sessions_updated_at
  BEFORE UPDATE ON customer_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to create audit log
CREATE OR REPLACE FUNCTION create_audit_log(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
  VALUES (p_user_id, p_action, p_resource_type, p_resource_id, p_details)
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
