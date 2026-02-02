import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkExistingData() {
  console.log('🔍 기존 대화 데이터 확인 중...\n')

  // 1. Check profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('role', 'customer')
    .limit(1)

  if (!profiles || profiles.length === 0) {
    console.log('❌ 고객 프로필 없음')
    return
  }

  const testProfile = profiles[0]
  console.log(`✅ 테스트 프로필: ${testProfile.full_name} (${testProfile.id})\n`)

  // 2. Check customer_sessions for this profile
  const { data: sessions } = await supabase
    .from('customer_sessions')
    .select('id, user_id, customer_name, customer_phone')
    .eq('user_id', testProfile.id)

  console.log(`📋 Customer Sessions: ${sessions?.length || 0}개`)
  if (sessions && sessions.length > 0) {
    sessions.forEach(s => {
      console.log(`   - Session: ${s.id}`)
    })
  }

  if (!sessions || sessions.length === 0) {
    console.log('\n❌ customer_sessions에 데이터가 없습니다.')
    return
  }

  // 3. Check conversations for these sessions
  const sessionIds = sessions.map(s => s.id)
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, session_id, status, started_at')
    .in('session_id', sessionIds)

  console.log(`\n💬 Conversations: ${conversations?.length || 0}개`)
  if (conversations && conversations.length > 0) {
    conversations.forEach(c => {
      console.log(`   - Conversation: ${c.id} (${c.status})`)
    })
  }

  if (!conversations || conversations.length === 0) {
    console.log('\n❌ conversations에 데이터가 없습니다.')
    return
  }

  // 4. Check conversation_summaries
  const conversationIds = conversations.map(c => c.id)
  const { data: summaries } = await supabase
    .from('conversation_summaries')
    .select('id, conversation_id, summary, category, sentiment')
    .in('conversation_id', conversationIds)

  console.log(`\n📝 Conversation Summaries: ${summaries?.length || 0}개`)
  if (summaries && summaries.length > 0) {
    summaries.forEach(s => {
      console.log(`   - [${s.category}] ${s.sentiment}: ${s.summary.substring(0, 50)}...`)
    })
  }

  // 5. Check messages
  const { data: messages } = await supabase
    .from('messages')
    .select('id, conversation_id, role, content')
    .in('conversation_id', conversationIds)
    .limit(5)

  console.log(`\n💬 Messages (샘플 5개): ${messages?.length || 0}개`)
  if (messages && messages.length > 0) {
    messages.forEach(m => {
      console.log(`   - [${m.role}] ${m.content.substring(0, 40)}...`)
    })
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ 데이터 체크 완료!')
  console.log('='.repeat(60))
}

checkExistingData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 오류:', error)
    process.exit(1)
  })
