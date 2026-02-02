import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Map message patterns to summaries
const SUMMARY_MAP: { [key: string]: { category: string, sentiment: 'positive' | 'neutral' | 'negative', summary: string } } = {
  '5G 요금제로': {
    category: '요금제 변경',
    sentiment: 'positive',
    summary: '고객이 데이터 사용량 증가로 인한 요금제 변경을 요청하였고, 5G 스탠다드 플랜을 제안함'
  },
  '단말기 할부': {
    category: '단말기',
    sentiment: 'neutral',
    summary: '단말기 할부 이율 및 잔여 기간에 대한 문의'
  },
  '청구서가': {
    category: '청구/요금',
    sentiment: 'negative',
    summary: '청구서 내역에 대한 문의. 해외 로밍 데이터 사용으로 인한 추가 요금 발생'
  },
  '새 휴대폰': {
    category: '기기변경',
    sentiment: 'positive',
    summary: '기기 교체 상담. Galaxy S22에서 S24로 업그레이드 희망, 할인 프로모션 안내'
  },
  'OTT 서비스': {
    category: '부가서비스',
    sentiment: 'neutral',
    summary: 'OTT 결합 서비스 문의. T우주 패스 추천'
  },
  '로밍 요금': {
    category: '로밍',
    sentiment: 'neutral',
    summary: '일본 여행 로밍 요금 문의. 하루 9,900원 무제한 요금제 안내'
  }
}

async function seedSummaries() {
  console.log('🌱 Conversation Summaries 생성 시작...\n')

  // Get all conversations
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('id')

  if (convError || !conversations || conversations.length === 0) {
    console.error('❌ 대화 내역을 찾을 수 없습니다')
    return
  }

  console.log(`✅ ${conversations.length}개의 대화 발견\n`)

  let successCount = 0
  let skipCount = 0

  for (const conv of conversations) {
    // Check if summary already exists
    const { data: existing } = await supabase
      .from('conversation_summaries')
      .select('id')
      .eq('conversation_id', conv.id)
      .single()

    if (existing) {
      skipCount++
      continue
    }

    // Get first user message to determine category
    const { data: messages } = await supabase
      .from('messages')
      .select('content')
      .eq('conversation_id', conv.id)
      .eq('role', 'user')
      .order('created_at', { ascending: true })
      .limit(1)

    if (!messages || messages.length === 0) {
      console.log(`  ⊘ 메시지 없음: ${conv.id}`)
      continue
    }

    const firstMessage = messages[0].content

    // Find matching template
    let summaryData = SUMMARY_MAP['5G 요금제로'] // default
    for (const [key, value] of Object.entries(SUMMARY_MAP)) {
      if (firstMessage.includes(key)) {
        summaryData = value
        break
      }
    }

    // Create summary
    const { error: summaryError } = await supabase
      .from('conversation_summaries')
      .insert({
        conversation_id: conv.id,
        summary: summaryData.summary,
        category: summaryData.category,
        keywords: [summaryData.category, '고객 문의', '상담'],
        sentiment: summaryData.sentiment
      })

    if (summaryError) {
      console.error(`  ❌ Summary 생성 실패 (${conv.id}):`, summaryError.message)
    } else {
      successCount++
      console.log(`  ✓ Summary 생성: [${summaryData.category}] ${summaryData.sentiment}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ Summary 생성 완료!\n')
  console.log('📊 통계:')
  console.log(`  - 성공: ${successCount}개`)
  console.log(`  - 건너뜀 (이미 존재): ${skipCount}개`)
  console.log(`  - 총 대화: ${conversations.length}개`)
  console.log('='.repeat(60))
}

seedSummaries()
  .then(() => {
    console.log('\n✨ 완료!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 치명적 오류:', error)
    process.exit(1)
  })
