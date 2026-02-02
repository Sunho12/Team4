-- ============================================
-- 최종 확정 마이그레이션
-- Supabase Dashboard SQL Editor에서 실행하세요
-- ============================================

-- 1. profiles 테이블: username 컬럼 추가 (비밀번호로 사용)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username TEXT;

-- username 인덱스 (로그인 속도 향상)
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- full_name 인덱스 (로그인 속도 향상)
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles(full_name);

-- 2. customer_sessions 테이블: user_id 추가
ALTER TABLE customer_sessions
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_customer_sessions_user_id ON customer_sessions(user_id);

-- 3. conversation_summaries 테이블: user_id 추가
ALTER TABLE conversation_summaries
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_conversation_summaries_user_id ON conversation_summaries(user_id);

-- 4. purchase_predictions 테이블: user_id 추가
ALTER TABLE purchase_predictions
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_purchase_predictions_user_id ON purchase_predictions(user_id);

-- 5. 트리거: conversation_summaries에 user_id 자동 설정
CREATE OR REPLACE FUNCTION set_summary_user_id()
RETURNS TRIGGER AS $$
BEGIN
  SELECT cs.user_id INTO NEW.user_id
  FROM conversations c
  INNER JOIN customer_sessions cs ON c.session_id = cs.id
  WHERE c.id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_set_summary_user_id ON conversation_summaries;
CREATE TRIGGER auto_set_summary_user_id
  BEFORE INSERT ON conversation_summaries
  FOR EACH ROW
  EXECUTE FUNCTION set_summary_user_id();

-- 6. 트리거: purchase_predictions에 user_id 자동 설정
CREATE OR REPLACE FUNCTION set_prediction_user_id()
RETURNS TRIGGER AS $$
BEGIN
  SELECT user_id INTO NEW.user_id
  FROM customer_sessions
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_set_prediction_user_id ON purchase_predictions;
CREATE TRIGGER auto_set_prediction_user_id
  BEFORE INSERT ON purchase_predictions
  FOR EACH ROW
  EXECUTE FUNCTION set_prediction_user_id();

-- 7. RLS 정책 (선택사항 - 보안 강화)
-- ALTER TABLE customer_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE conversation_summaries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE purchase_predictions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 완료!
-- ============================================
