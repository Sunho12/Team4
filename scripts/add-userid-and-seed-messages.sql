-- ============================================
-- Part 1: Add user_id column to messages table
-- ============================================

-- Drop the old sender_id column if it exists
ALTER TABLE messages DROP COLUMN IF EXISTS sender_id CASCADE;
DROP INDEX IF EXISTS idx_messages_sender_id;

-- Add user_id column to directly link messages to profiles
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);

COMMENT ON COLUMN messages.user_id IS 'References the profile (user) who owns this message conversation';

-- ============================================
-- Part 2: Insert dummy messages with profile references
-- ============================================

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

  -- Select a customer for this conversation
  v_customer_id := v_customer_ids[1];

  -- Get or create a conversation for this customer
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE user_id = v_customer_id
  LIMIT 1;

  -- If no conversation exists for this customer, create one
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (user_id, status, started_at)
    VALUES (v_customer_id, 'active', NOW())
    RETURNING id INTO v_conversation_id;

    RAISE NOTICE 'Created new conversation: % for customer: %', v_conversation_id, v_customer_id;
  ELSE
    RAISE NOTICE 'Using existing conversation: % for customer: %', v_conversation_id, v_customer_id;
  END IF;

  -- Insert messages - ALL messages belong to the same user_id
  -- Message 1: User message
  INSERT INTO messages (conversation_id, role, content, user_id, created_at)
  VALUES (
    v_conversation_id,
    'user',
    '안녕하세요, 5G 요금제에 대해 궁금한 게 있어요',
    v_customer_id,
    NOW()
  );

  -- Message 2: Assistant message (ALSO linked to the user)
  INSERT INTO messages (conversation_id, role, content, user_id, created_at)
  VALUES (
    v_conversation_id,
    'assistant',
    '안녕하세요! 5G 요금제에 대해 문의주셨군요. 어떤 부분이 궁금하신가요?',
    v_customer_id,
    NOW() + interval '1 minute'
  );

  -- Message 3: User message
  INSERT INTO messages (conversation_id, role, content, user_id, created_at)
  VALUES (
    v_conversation_id,
    'user',
    '현재 요금제에서 데이터를 많이 쓰는데 더 나은 옵션이 있을까요?',
    v_customer_id,
    NOW() + interval '2 minutes'
  );

  -- Message 4: Assistant message
  INSERT INTO messages (conversation_id, role, content, user_id, created_at)
  VALUES (
    v_conversation_id,
    'assistant',
    '현재 월 평균 데이터 사용량이 어느 정도 되시나요? 사용 패턴에 맞는 요금제를 추천해드리겠습니다.',
    v_customer_id,
    NOW() + interval '3 minutes'
  );

  -- Message 5: User message
  INSERT INTO messages (conversation_id, role, content, user_id, created_at)
  VALUES (
    v_conversation_id,
    'user',
    '기기 변경을 고려 중인데 할인 혜택이 있나요?',
    v_customer_id,
    NOW() + interval '4 minutes'
  );

  -- Message 6: Assistant message
  INSERT INTO messages (conversation_id, role, content, user_id, created_at)
  VALUES (
    v_conversation_id,
    'assistant',
    '네, 현재 기기 변경 시 최대 30% 할인 이벤트를 진행 중입니다. 2년 약정 시 추가 혜택도 있습니다.',
    v_customer_id,
    NOW() + interval '5 minutes'
  );

  -- Create another conversation for a second customer
  IF array_length(v_customer_ids, 1) >= 2 THEN
    v_customer_id := v_customer_ids[2];

    INSERT INTO conversations (user_id, status, started_at)
    VALUES (v_customer_id, 'active', NOW() + interval '10 minutes')
    RETURNING id INTO v_conversation_id;

    -- Add messages for second customer
    INSERT INTO messages (conversation_id, role, content, user_id, created_at)
    VALUES (
      v_conversation_id,
      'user',
      '이번 달 요금이 평소보다 높게 나왔는데 확인 부탁드립니다',
      v_customer_id,
      NOW() + interval '10 minutes'
    );

    INSERT INTO messages (conversation_id, role, content, user_id, created_at)
    VALUES (
      v_conversation_id,
      'assistant',
      '요금 내역을 확인해드리겠습니다. 혹시 추가 데이터 사용이나 부가 서비스 이용이 있으셨나요?',
      v_customer_id,
      NOW() + interval '11 minutes'
    );
  END IF;

  RAISE NOTICE 'Successfully created messages with profile references';
END $$;

-- ============================================
-- Part 3: Verify the results
-- ============================================

-- Show summary
SELECT
  'Total messages' as metric,
  COUNT(*) as count
FROM messages
WHERE user_id IS NOT NULL
UNION ALL
SELECT
  'User messages',
  COUNT(*)
FROM messages
WHERE user_id IS NOT NULL AND role = 'user'
UNION ALL
SELECT
  'Assistant messages',
  COUNT(*)
FROM messages
WHERE user_id IS NOT NULL AND role = 'assistant';

-- Show messages grouped by user
SELECT
  p.full_name,
  p.phone_number,
  COUNT(*) as message_count,
  COUNT(*) FILTER (WHERE m.role = 'user') as user_messages,
  COUNT(*) FILTER (WHERE m.role = 'assistant') as assistant_messages
FROM messages m
JOIN profiles p ON m.user_id = p.id
GROUP BY p.id, p.full_name, p.phone_number
ORDER BY message_count DESC;

-- Show sample messages with profile info
SELECT
  m.id,
  m.role,
  LEFT(m.content, 60) as content_preview,
  p.full_name as user_name,
  p.phone_number as user_phone,
  c.id as conversation_id,
  m.created_at
FROM messages m
JOIN profiles p ON m.user_id = p.id
JOIN conversations c ON m.conversation_id = c.id
ORDER BY m.created_at DESC
LIMIT 20;
