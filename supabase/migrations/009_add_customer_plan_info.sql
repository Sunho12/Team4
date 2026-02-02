-- Add plan and device information columns to profiles table

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS plan_name TEXT,
ADD COLUMN IF NOT EXISTS plan_price INTEGER,
ADD COLUMN IF NOT EXISTS bundle_types TEXT[], -- Array of bundle types (e.g., ['유무선', '가족'])
ADD COLUMN IF NOT EXISTS device_model TEXT,
ADD COLUMN IF NOT EXISTS device_remaining_months INTEGER;

-- Add comment
COMMENT ON COLUMN profiles.plan_name IS '가입된 요금제명';
COMMENT ON COLUMN profiles.plan_price IS '요금제 월 가격';
COMMENT ON COLUMN profiles.bundle_types IS '결합 상품 유형 배열';
COMMENT ON COLUMN profiles.device_model IS '단말기 모델명';
COMMENT ON COLUMN profiles.device_remaining_months IS '단말기 할부 잔여 개월';
