-- Seed data_usage table with dummy data
-- This SQL generates random data usage records for all existing profiles

-- Insert data_usage records for each profile
INSERT INTO data_usage (user_id, usage_month, data_used_gb, plan_speed_limit, plan_data_limit_gb, is_exceeded)
SELECT
  p.id as user_id,
  DATE_TRUNC('month', CURRENT_DATE) as usage_month,

  -- Random data usage based on speed limit
  CASE
    WHEN speed_limit = '300kbps' THEN ROUND((random() * 8)::numeric, 2)
    WHEN speed_limit = '1Mbps' THEN ROUND((random() * 15)::numeric, 2)
    WHEN speed_limit = '3Mbps' THEN ROUND((random() * 30)::numeric, 2)
    ELSE ROUND((random() * 10)::numeric, 2)
  END as data_used_gb,

  speed_limit as plan_speed_limit,

  -- Data limit threshold based on speed limit
  CASE
    WHEN speed_limit = '300kbps' THEN 3
    WHEN speed_limit = '1Mbps' THEN 7
    WHEN speed_limit = '3Mbps' THEN 15
    ELSE 5
  END as plan_data_limit_gb,

  -- Check if exceeded
  CASE
    WHEN speed_limit = '300kbps' AND (random() * 8) > 3 THEN true
    WHEN speed_limit = '1Mbps' AND (random() * 15) > 7 THEN true
    WHEN speed_limit = '3Mbps' AND (random() * 30) > 15 THEN true
    ELSE false
  END as is_exceeded

FROM profiles p
CROSS JOIN (
  -- Random speed limit for each profile
  SELECT (ARRAY['300kbps', '1Mbps', '3Mbps'])[floor(random() * 3 + 1)] as speed_limit
) speed_limits
WHERE p.id IS NOT NULL
LIMIT 100;

-- Display summary
SELECT
  plan_speed_limit,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE is_exceeded = true) as exceeded_count,
  ROUND(AVG(data_used_gb), 2) as avg_usage_gb
FROM data_usage
GROUP BY plan_speed_limit
ORDER BY plan_speed_limit;
