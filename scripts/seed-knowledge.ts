import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openaiKey = process.env.OPENAI_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)
const openai = new OpenAI({ apiKey: openaiKey })

const knowledgeDocuments = [
  {
    content: '5G 프리미어 플랜: 월 80,000원, 데이터 무제한, 5G 속도 제공. 음성 통화 무제한, 문자 무제한 포함.',
    document_type: 'plan_info',
    metadata: { plan_name: '5G 프리미어', price: 80000, data: 'unlimited' },
  },
  {
    content: '5G 스탠다드 플랜: 월 60,000원, 데이터 100GB, 5G 속도. 음성 통화 무제한, 문자 무제한.',
    document_type: 'plan_info',
    metadata: { plan_name: '5G 스탠다드', price: 60000, data: '100GB' },
  },
  {
    content: 'LTE 베이직 플랜: 월 40,000원, 데이터 50GB, LTE 속도. 음성 통화 무제한, 문자 무제한.',
    document_type: 'plan_info',
    metadata: { plan_name: 'LTE 베이직', price: 40000, data: '50GB' },
  },
  {
    content: '데이터 쉐어링 서비스: 월 5,000원 추가로 가족 간 데이터 공유 가능. 최대 5명까지 등록.',
    document_type: 'service_info',
    metadata: { service_name: '데이터 쉐어링', price: 5000 },
  },
  {
    content: 'T-world 멤버십: 통신요금 결제 시 포인트 적립. 1만원당 100포인트 적립, 포인트로 요금 할인 가능.',
    document_type: 'service_info',
    metadata: { service_name: 'T-world 멤버십' },
  },
  {
    content: '기기 변경 시 기존 요금제 유지 가능. 2년 약정 시 기기 할인 최대 30% 제공.',
    document_type: 'policy',
    metadata: { category: 'device_upgrade' },
  },
  {
    content: '요금제 변경은 언제든지 가능하며, 변경 즉시 적용됩니다. 위약금 없음.',
    document_type: 'policy',
    metadata: { category: 'plan_change' },
  },
  {
    content: '해외 로밍: 1일권 9,900원 (데이터 100MB), 3일권 25,000원 (데이터 500MB).',
    document_type: 'service_info',
    metadata: { service_name: '해외 로밍' },
  },
  {
    content: 'T-world 앱에서 실시간 요금 조회, 데이터 사용량 확인, 요금제 변경 가능.',
    document_type: 'faq',
    metadata: { category: 'app_usage' },
  },
  {
    content: '고객센터: 114 (무료), 24시간 운영. 챗봇 상담은 24시간 이용 가능.',
    document_type: 'faq',
    metadata: { category: 'customer_service' },
  },
]

async function seedKnowledgeBase() {
  console.log('Starting knowledge base seeding...')

  for (const doc of knowledgeDocuments) {
    try {
      console.log(`Processing: ${doc.content.substring(0, 50)}...`)

      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: doc.content,
      })

      const embedding = embeddingResponse.data[0].embedding

      const { error } = await supabase.from('knowledge_base').insert({
        content: doc.content,
        embedding: embedding,
        document_type: doc.document_type,
        metadata: doc.metadata,
      })

      if (error) {
        console.error('Error inserting document:', error)
      } else {
        console.log('✓ Document inserted successfully')
      }
    } catch (error) {
      console.error('Error processing document:', error)
    }
  }

  console.log('Knowledge base seeding completed!')
}

seedKnowledgeBase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
