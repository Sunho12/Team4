-- Create customer_demographics table for storing customer plan and demographic information
CREATE TABLE IF NOT EXISTS customer_demographics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- 요금제 정보
  current_plan_type VARCHAR(100), -- 현재 요금제명 (예: "5G 프리미엄", "LTE 스탠다드")
  current_plan_price INTEGER, -- 요금제 가격

  -- 기타 인구통계 정보 (필요시 확장)
  age_group VARCHAR(20),
  region VARCHAR(50),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 한 유저당 하나의 레코드만 존재
  UNIQUE(user_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customer_demographics_user_id ON customer_demographics(user_id);

-- RLS policies
ALTER TABLE customer_demographics ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything
CREATE POLICY "Service role has full access to customer_demographics"
  ON customer_demographics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_customer_demographics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_demographics_updated_at
  BEFORE UPDATE ON customer_demographics
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_demographics_updated_at();

-- Insert sample data for existing test user (선호)
INSERT INTO customer_demographics (user_id, current_plan_type, current_plan_price)
SELECT
  id,
  '5G 프리미엄',
  85000
FROM profiles
WHERE full_name = '선호'
ON CONFLICT (user_id) DO NOTHING;
