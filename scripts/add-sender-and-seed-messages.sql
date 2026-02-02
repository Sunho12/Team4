-- ============================================
-- Part 1: Add sender_id column to messages table
-- ============================================

-- Add sender_id column if it doesn't exist
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- ============================================
-- Part 2: Insert dummy messages with profile references
-- ============================================

-- First, let's create a conversation if needed (or use existing one)
DO $$
DECLARE
  v_conversation_id UUID;
  v_customer_ids UUID[];
  v_customer_id UUID;
BEGIN
  -- Get some customer profile IDs
  SELECT ARRAY_AGG(id) INTO v_customer_ids
  FROM profiles
  WHERE role = 'customer'
  LIMIT 5;

  -- If no customers exist, skip
  IF v_customer_ids IS NULL OR array_length(v_customer_ids, 1) = 0 THEN
    RAISE NOTICE 'No customer profiles found. Please create customer profiles first.';
    RETURN;
  END IF;

  -- Get or create a conversation
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE status = 'active'
  LIMIT 1;

  -- If no active conversation, create one
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (user_id, status, started_at)
    VALUES (v_customer_ids[1], 'active', NOW())
    RETURNING id INTO v_conversation_id;

    RAISE NOTICE 'Created new conversation: %', v_conversation_id;
  ELSE
    RAISE NOTICE 'Using existing conversation: %', v_conversation_id;
  END IF;

  -- Insert messages with sender_id
  -- Message 1: User message from first customer
  INSERT INTO messages (conversation_id, role, content, sender_id, created_at)
  VALUES (
    v_conversation_id,
    'user',
    '안녕하세요, 5G 요금제에 대해 궁금한 게 있어요',
    v_customer_ids[1],
    NOW()
  );

  -- Message 2: Assistant message (no sender_id)
  INSERT INTO messages (conversation_id, role, content, sender_id, created_at)
  VALUES (
    v_conversation_id,
    'assistant',
    '안녕하세요! 5G 요금제에 대해 문의주셨군요. 어떤 부분이 궁금하신가요?',
    NULL,
    NOW() + interval '1 minute'
  );

  -- Message 3: User message from second customer
  v_customer_id := v_customer_ids[LEAST(2, array_length(v_customer_ids, 1))];
  INSERT INTO messages (conversation_id, role, content, sender_id, created_at)
  VALUES (
    v_conversation_id,
    'user',
    '현재 요금제에서 데이터를 많이 쓰는데 더 나은 옵션이 있을까요?',
    v_customer_id,
    NOW() + interval '2 minutes'
  );

  -- Message 4: Assistant message
  INSERT INTO messages (conversation_id, role, content, sender_id, created_at)
  VALUES (
    v_conversation_id,
    'assistant',
    '현재 월 평균 데이터 사용량이 어느 정도 되시나요? 사용 패턴에 맞는 요금제를 추천해드리겠습니다.',
    NULL,
    NOW() + interval '3 minutes'
  );

  -- Message 5: User message from third customer
  v_customer_id := v_customer_ids[LEAST(3, array_length(v_customer_ids, 1))];
  INSERT INTO messages (conversation_id, role, content, sender_id, created_at)
  VALUES (
    v_conversation_id,
    'user',
    '기기 변경을 고려 중인데 할인 혜택이 있나요?',
    v_customer_id,
    NOW() + interval '4 minutes'
  );

  -- Message 6: Assistant message
  INSERT INTO messages (conversation_id, role, content, sender_id, created_at)
  VALUES (
    v_conversation_id,
    'assistant',
    '네, 현재 기기 변경 시 최대 30% 할인 이벤트를 진행 중입니다. 2년 약정 시 추가 혜택도 있습니다.',
    NULL,
    NOW() + interval '5 minutes'
  );

  RAISE NOTICE 'Successfully created 6 messages with profile references';
END $$;

-- ============================================
-- Part 3: Verify the results
-- ============================================

-- Show summary
SELECT
  'Total messages' as metric,
  COUNT(*) as count
FROM messages
UNION ALL
SELECT
  'Messages with sender_id',
  COUNT(*)
FROM messages
WHERE sender_id IS NOT NULL
UNION ALL
SELECT
  'Messages without sender_id (assistant)',
  COUNT(*)
FROM messages
WHERE sender_id IS NULL;

-- Show sample messages with profile info
SELECT
  m.id,
  m.role,
  LEFT(m.content, 50) || '...' as content_preview,
  p.full_name as sender_name,
  p.phone_number as sender_phone,
  m.created_at
FROM messages m
LEFT JOIN profiles p ON m.sender_id = p.id
ORDER BY m.created_at DESC
LIMIT 10;
