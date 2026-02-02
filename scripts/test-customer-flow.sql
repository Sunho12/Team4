-- Test script to verify customer flow works correctly
-- Run this after applying 008_fix_user_references.sql

-- 1. Check if profiles table has customers
SELECT
  id,
  full_name,
  phone_number,
  role,
  created_at
FROM profiles
WHERE role = 'customer'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Check if customer_sessions are linked to profiles
SELECT
  cs.id as session_id,
  cs.user_id,
  cs.session_token,
  p.full_name,
  p.phone_number,
  cs.created_at
FROM customer_sessions cs
LEFT JOIN profiles p ON cs.user_id = p.id
ORDER BY cs.created_at DESC
LIMIT 10;

-- 3. Check conversations with customer info
SELECT
  c.id as conversation_id,
  c.status,
  c.started_at,
  c.ended_at,
  p.full_name as customer_name,
  p.phone_number as customer_phone
FROM conversations c
INNER JOIN customer_sessions cs ON c.session_id = cs.id
LEFT JOIN profiles p ON cs.user_id = p.id
ORDER BY c.started_at DESC
LIMIT 10;

-- 4. Check conversation summaries with customer info
SELECT
  csm.id as summary_id,
  csm.summary,
  csm.category,
  csm.created_at,
  p.full_name as customer_name,
  p.phone_number as customer_phone
FROM conversation_summaries csm
LEFT JOIN profiles p ON csm.user_id = p.id
ORDER BY csm.created_at DESC
LIMIT 10;

-- 5. Check if foreign key constraints are correct
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('customer_sessions', 'conversation_summaries', 'purchase_predictions')
  AND kcu.column_name = 'user_id';
