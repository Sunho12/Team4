import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Conversation templates
const CONVERSATION_TEMPLATES = [
  {
    category: '요금제 변경',
    sentiment: 'positive' as const,
    messages: [
      { role: 'user' as const, content: '5G 요금제로 변경하고 싶어요' },
      { role: 'assistant' as const, content: '현재 데이터를 얼마나 사용하시나요?' },
      { role: 'user' as const, content: '한 달에 50GB 정도요' },
      { role: 'assistant' as const, content: '5G 스탠다드 플랜(월 60,000원, 100GB)이 적합합니다' },
    ],
    summary: '고객이 데이터 사용량 증가로 인한 요금제 변경을 요청하였고, 5G 스탠다드 플랜을 제안함'
  },
  {
    category: '단말기',
    sentiment: 'neutral' as const,
    messages: [
      { role: 'user' as const, content: '단말기 할부 문의드립니다' },
      { role: 'assistant' as const, content: '어떤 부분이 궁금하신가요?' },
      { role: 'user' as const, content: '현재 할부 잔여 개월과 이율이 궁금해요' },
      { role: 'assistant' as const, content: '현재 12개월 잔여, 연 5.9% 이율이 적용되고 있습니다' },
    ],
    summary: '단말기 할부 이율 및 잔여 기간에 대한 문의'
  },
  {
    category: '청구/요금',
    sentiment: 'negative' as const,
    messages: [
      { role: 'user' as const, content: '이번 달 청구서가 이해가 안 됩니다' },
      { role: 'assistant' as const, content: '어떤 부분이 이해가 안 되시나요?' },
      { role: 'user' as const, content: '요금이 평소보다 2만원 더 나왔어요' },
      { role: 'assistant' as const, content: '확인해보니 해외 로밍 데이터 사용 요금이 추가되었습니다' },
    ],
    summary: '청구서 내역에 대한 문의. 해외 로밍 데이터 사용으로 인한 추가 요금 발생'
  },
  {
    category: '기기변경',
    sentiment: 'positive' as const,
    messages: [
      { role: 'user' as const, content: '새 휴대폰으로 바꾸고 싶어요' },
      { role: 'assistant' as const, content: '현재 사용 중인 기기가 어떻게 되시나요?' },
      { role: 'user' as const, content: 'Galaxy S22를 2년 넘게 썼어요' },
      { role: 'assistant' as const, content: '2년 약정 시 Galaxy S24를 최대 30% 할인받으실 수 있습니다' },
    ],
    summary: '기기 교체 상담. Galaxy S22에서 S24로 업그레이드 희망, 할인 프로모션 안내'
  },
  {
    category: '부가서비스',
    sentiment: 'neutral' as const,
    messages: [
      { role: 'user' as const, content: 'OTT 서비스 가입하고 싶어요' },
      { role: 'assistant' as const, content: '어떤 OTT 서비스를 원하시나요?' },
      { role: 'user' as const, content: '넷플릭스나 티빙 같은 거요' },
      { role: 'assistant' as const, content: 'T우주 패스를 추천드립니다. 월 9,900원으로 다양한 OTT를 이용하실 수 있습니다' },
    ],
    summary: 'OTT 결합 서비스 문의. T우주 패스 추천'
  },
  {
    category: '로밍',
    sentiment: 'neutral' as const,
    messages: [
      { role: 'user' as const, content: '해외 여행 가는데 로밍 요금이 궁금해요' },
      { role: 'assistant' as const, content: '어느 나라로 가시나요?' },
      { role: 'user' as const, content: '일본이요' },
      { role: 'assistant' as const, content: '일본 로밍은 하루 9,900원으로 데이터 무제한 이용 가능합니다' },
    ],
    summary: '일본 여행 로밍 요금 문의. 하루 9,900원 무제한 요금제 안내'
  }
]

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function randomDate(daysAgo: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(Math.floor(Math.random() * 12) + 9) // 9am - 9pm
  date.setMinutes(Math.floor(Math.random() * 60))
  return date
}

async function seedAllConversations() {
  console.log('🌱 전체 대화 데이터 생성 시작...\n')
  console.log('구조: profiles → customer_sessions → conversations → messages & summaries\n')

  // Get all customer profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, phone_number')
    .eq('role', 'customer')

  if (profileError || !profiles || profiles.length === 0) {
    console.error('❌ 고객 프로필을 찾을 수 없습니다')
    return
  }

  console.log(`✅ ${profiles.length}명의 고객 발견\n`)

  let totalSessions = 0
  let totalConversations = 0
  let totalMessages = 0
  let totalSummaries = 0

  for (const profile of profiles) {
    console.log(`\n👤 ${profile.full_name} 처리 중...`)

    // 1. Create customer_session for this profile
    const { data: session, error: sessionError } = await supabase
      .from('customer_sessions')
      .insert({
        user_id: profile.id,
        session_token: crypto.randomUUID(),
        customer_name: profile.full_name,
        customer_phone: profile.phone_number
      })
      .select('id')
      .single()

    if (sessionError || !session) {
      console.error(`  ❌ Session 생성 실패:`, sessionError?.message)
      continue
    }

    totalSessions++
    console.log(`  ✓ Customer Session 생성: ${session.id}`)

    // 2. Create 2-4 conversations for this session
    const convCount = Math.floor(Math.random() * 3) + 2

    for (let i = 0; i < convCount; i++) {
      const template = randomChoice(CONVERSATION_TEMPLATES)
      const daysAgo = Math.floor(Math.random() * 90) + 1 // Last 90 days
      const startedAt = randomDate(daysAgo)
      const endedAt = new Date(startedAt.getTime() + (Math.random() * 30 + 10) * 60 * 1000) // 10-40 minutes

      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          session_id: session.id,
          status: 'ended',
          started_at: startedAt.toISOString(),
          ended_at: endedAt.toISOString()
        })
        .select('id')
        .single()

      if (convError || !conversation) {
        console.error(`  ❌ Conversation 생성 실패:`, convError?.message)
        continue
      }

      totalConversations++

      // Create messages
      let messageTime = startedAt
      for (const msg of template.messages) {
        messageTime = new Date(messageTime.getTime() + Math.random() * 2 * 60 * 1000) // 0-2 minutes apart

        const { error: msgError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversation.id,
            role: msg.role,
            content: msg.content,
            created_at: messageTime.toISOString()
          })

        if (!msgError) {
          totalMessages++
        }
      }

      // Create summary
      const { error: summaryError } = await supabase
        .from('conversation_summaries')
        .insert({
          conversation_id: conversation.id,
          summary: template.summary,
          category: template.category,
          keywords: [template.category, '고객 문의', '상담'],
          sentiment: template.sentiment
        })

      if (!summaryError) {
        totalSummaries++
      }
    }

    console.log(`  ✓ ${convCount}개 대화 생성 완료`)
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ 전체 대화 데이터 생성 완료!\n')
  console.log('📊 생성 통계:')
  console.log(`  - Customer Sessions: ${totalSessions}개`)
  console.log(`  - Conversations: ${totalConversations}개`)
  console.log(`  - Messages: ${totalMessages}개`)
  console.log(`  - Summaries: ${totalSummaries}개`)
  console.log('='.repeat(60))
}

seedAllConversations()
  .then(() => {
    console.log('\n✨ 완료!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 치명적 오류:', error)
    process.exit(1)
  })
