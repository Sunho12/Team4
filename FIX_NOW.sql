-- 즉시 실행: profiles 테이블 수정
-- Supabase Dashboard SQL Editor에서 실행

-- 1. profiles 테이블의 외래키 제거
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. id 컬럼에 기본값 설정
ALTER TABLE profiles
ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- 3. customer_sessions도 수정
ALTER TABLE customer_sessions
DROP CONSTRAINT IF EXISTS customer_sessions_user_id_fkey;

ALTER TABLE customer_sessions
ADD CONSTRAINT customer_sessions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 4. conversation_summaries 수정
ALTER TABLE conversation_summaries
DROP CONSTRAINT IF EXISTS conversation_summaries_user_id_fkey;

ALTER TABLE conversation_summaries
ADD CONSTRAINT conversation_summaries_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 5. purchase_predictions 수정
ALTER TABLE purchase_predictions
DROP CONSTRAINT IF EXISTS purchase_predictions_user_id_fkey;

ALTER TABLE purchase_predictions
ADD CONSTRAINT purchase_predictions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 완료!
