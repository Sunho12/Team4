-- ============================================
-- 완전한 마이그레이션 - 한 번에 실행
-- Supabase Dashboard SQL Editor에서 이것만 실행하세요
-- ============================================

-- 1단계: 외래키 제거 (auth.users 의존성 제거)
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE customer_sessions
DROP CONSTRAINT IF EXISTS customer_sessions_user_id_fkey;

ALTER TABLE conversation_summaries
DROP CONSTRAINT IF EXISTS conversation_summaries_user_id_fkey;

ALTER TABLE purchase_predictions
DROP CONSTRAINT IF EXISTS purchase_predictions_user_id_fkey;

-- 2단계: profiles 테이블 설정
ALTER TABLE profiles
ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- username 컬럼 추가 (비밀번호 저장용)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username TEXT;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles(full_name);

-- 3단계: customer_sessions 테이블
ALTER TABLE customer_sessions
ADD COLUMN IF NOT EXISTS user_id UUID;

-- profiles 테이블 참조로 외래키 재설정
ALTER TABLE customer_sessions
ADD CONSTRAINT customer_sessions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_customer_sessions_user_id ON customer_sessions(user_id);

-- 4단계: conversation_summaries 테이블
ALTER TABLE conversation_summaries
ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE conversation_summaries
ADD CONSTRAINT conversation_summaries_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_conversation_summaries_user_id ON conversation_summaries(user_id);

-- 5단계: purchase_predictions 테이블
ALTER TABLE purchase_predictions
ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE purchase_predictions
ADD CONSTRAINT purchase_predictions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_purchase_predictions_user_id ON purchase_predictions(user_id);

-- 6단계: 트리거 함수 생성
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

-- 7단계: 구매 예측 트리거
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

-- ============================================
-- 완료! 이제 바로 작동합니다
-- ============================================
