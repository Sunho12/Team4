-- Migration 010: Add data_usage table for plan change prediction
-- Created: 2026-02-02

-- data_usage: 월별 데이터 사용량 테이블
CREATE TABLE IF NOT EXISTS data_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  usage_month DATE NOT NULL, -- 사용 월 (YYYY-MM-01 형식)
  data_used_gb NUMERIC(10, 2) NOT NULL DEFAULT 0, -- 사용한 데이터 (GB)
  plan_speed_limit TEXT, -- 속도 제한 ('300kbps', '1Mbps', '3Mbps')
  plan_data_limit_gb INTEGER, -- 요금제 데이터 한도 (GB)
  is_exceeded BOOLEAN DEFAULT FALSE, -- 한도 초과 여부
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, usage_month)
);

CREATE INDEX idx_data_usage_user_id ON data_usage(user_id);
CREATE INDEX idx_data_usage_month ON data_usage(usage_month);
CREATE INDEX idx_data_usage_exceeded ON data_usage(is_exceeded);

COMMENT ON TABLE data_usage IS '고객별 월간 데이터 사용량 추적';
COMMENT ON COLUMN data_usage.data_used_gb IS '월간 사용한 데이터량 (GB)';
COMMENT ON COLUMN data_usage.plan_speed_limit IS '요금제 속도 제한 (초과 시 감속)';
COMMENT ON COLUMN data_usage.is_exceeded IS '권장 사용량 초과 여부 (요금제 변경 시그널)';

-- Enable RLS
ALTER TABLE data_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies (service role can access all)
CREATE POLICY "Service role can access all data_usage"
  ON data_usage FOR ALL
  USING (auth.role() = 'service_role');

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_data_usage_updated_at
  BEFORE UPDATE ON data_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
