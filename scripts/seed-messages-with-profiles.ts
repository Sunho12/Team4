import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Supabase client setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Sample message templates
const MESSAGE_TEMPLATES = [
  {
    role: 'user' as const,
    content: '안녕하세요, 5G 요금제에 대해 궁금한 게 있어요',
  },
  {
    role: 'assistant' as const,
    content: '안녕하세요! 5G 요금제에 대해 문의주셨군요. 어떤 부분이 궁금하신가요?',
  },
  {
    role: 'user' as const,
    content: '현재 요금제에서 데이터를 많이 쓰는데 더 나은 옵션이 있을까요?',
  },
  {
    role: 'assistant' as const,
    content: '현재 월 평균 데이터 사용량이 어느 정도 되시나요? 사용 패턴에 맞는 요금제를 추천해드리겠습니다.',
  },
  {
    role: 'user' as const,
    content: '기기 변경을 고려 중인데 할인 혜택이 있나요?',
  },
  {
    role: 'assistant' as const,
    content: '네, 현재 기기 변경 시 최대 30% 할인 이벤트를 진행 중입니다. 2년 약정 시 추가 혜택도 있습니다.',
  },
  {
    role: 'user' as const,
    content: '이번 달 요금이 평소보다 높게 나왔는데 확인 부탁드립니다',
  },
  {
    role: 'assistant' as const,
    content: '요금 내역을 확인해드리겠습니다. 혹시 추가 데이터 사용이나 부가 서비스 이용이 있으셨나요?',
  },
]

async function seedMessagesWithProfiles() {
  console.log('🌱 Starting to seed messages with profile references...\n')

  try {
    // Step 0: Check if sender_id column exists, if not, add it
    console.log('🔍 Checking if sender_id column exists...')

    const { data: columns } = await supabase
      .from('messages')
      .select('*')
      .limit(1)

    // Try to add the column (will fail silently if already exists)
    try {
      await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL;'
      })
      console.log('✓ Added sender_id column')
    } catch (e) {
      // Column might already exist or we don't have exec_sql function
      console.log('⚠️  Could not add column via RPC, it may already exist')
    }

    // Try to add index
    try {
      await supabase.rpc('exec_sql', {
        sql: 'CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);'
      })
      console.log('✓ Created index on sender_id')
    } catch (e) {
      console.log('⚠️  Could not add index via RPC')
    }

    // Step 1: Get some existing profiles (customers)
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('role', 'customer')
      .limit(5)

    if (profileError || !profiles || profiles.length === 0) {
      console.error('❌ No customer profiles found:', profileError)
      return
    }

    console.log(`✓ Found ${profiles.length} customer profiles`)

    // Step 2: Get or create a conversation
    const { data: existingConversations, error: convError } = await supabase
      .from('conversations')
      .select('id, user_id')
      .limit(1)
      .single()

    let conversationId: string

    if (convError || !existingConversations) {
      // Create a new conversation if none exists
      const { data: newConv, error: newConvError } = await supabase
        .from('conversations')
        .insert({
          user_id: profiles[0].id,
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (newConvError || !newConv) {
        console.error('❌ Failed to create conversation:', newConvError)
        return
      }

      conversationId = newConv.id
      console.log('✓ Created new conversation')
    } else {
      conversationId = existingConversations.id
      console.log('✓ Using existing conversation')
    }

    // Step 3: Create messages with sender_id references
    let createdCount = 0
    const messagesToCreate = MESSAGE_TEMPLATES.slice(0, 6) // Create 6 sample messages

    for (const template of messagesToCreate) {
      // For user messages, assign to a random customer profile
      // For assistant messages, sender_id will be null (system/bot)
      const senderId = template.role === 'user'
        ? profiles[Math.floor(Math.random() * profiles.length)].id
        : null

      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: template.role,
          content: template.content,
          sender_id: senderId,
          created_at: new Date().toISOString(),
        })

      if (messageError) {
        console.error('❌ Error creating message:', messageError)
      } else {
        createdCount++
        console.log(`  ✓ Created ${template.role} message${senderId ? ` from profile ${profiles.find(p => p.id === senderId)?.full_name}` : ' (assistant)'}`)
      }
    }

    console.log(`\n✅ Successfully created ${createdCount} messages with profile references!`)

    // Display summary
    const { data: messageCounts } = await supabase
      .from('messages')
      .select('sender_id, role')
      .eq('conversation_id', conversationId)

    const withProfile = messageCounts?.filter(m => m.sender_id !== null).length || 0
    const withoutProfile = messageCounts?.filter(m => m.sender_id === null).length || 0

    console.log('\n📊 Summary:')
    console.log(`  - Messages with profile reference: ${withProfile}`)
    console.log(`  - Messages without profile (assistant): ${withoutProfile}`)
    console.log(`  - Total messages in conversation: ${messageCounts?.length || 0}`)

  } catch (error) {
    console.error('❌ Fatal error:', error)
    throw error
  }
}

// Run the seeder
seedMessagesWithProfiles()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
