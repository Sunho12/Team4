import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function testAutoGenerate() {
  console.log('🧪 자동 더미 데이터 생성 트리거 테스트\n')

  const testUserId = crypto.randomUUID()
  const testName = '테스트고객' + Math.floor(Math.random() * 1000)
  const testPhone = '010-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0') + '-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0')

  console.log(`📝 새 고객 프로필 생성 중...`)
  console.log(`   이름: ${testName}`)
  console.log(`   전화번호: ${testPhone}`)
  console.log(`   ID: ${testUserId}\n`)

  // Insert new customer profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: testUserId,
      role: 'customer',
      full_name: testName,
      phone_number: testPhone,
    })
    .select()
    .single()

  if (profileError) {
    console.error('❌ 프로필 생성 실패:', profileError)
    return
  }

  console.log('✅ 프로필 생성 성공!')
  console.log('\n⏳ 트리거가 더미 데이터를 생성하는 중... (2초 대기)\n')

  // Wait for trigger to complete
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Check generated data
  console.log('🔍 생성된 데이터 확인 중...\n')

  // 1. Demographics
  const { data: demographics, error: demoError } = await supabase
    .from('customer_demographics')
    .select('*')
    .eq('user_id', testUserId)
    .single()

  if (demoError) {
    console.log('❌ Demographics: 생성 안됨')
  } else {
    console.log('✅ Demographics: 생성됨')
    console.log(`   - 등급: ${demographics.customer_tier}`)
    console.log(`   - 나이: ${demographics.age_range}`)
    console.log(`   - 요금제: ${demographics.current_plan_type} (${demographics.current_plan_price}원)`)
  }

  // 2. Purchase History
  const { data: purchases, error: purchaseError } = await supabase
    .from('purchase_history')
    .select('*')
    .eq('user_id', testUserId)

  if (purchaseError || !purchases || purchases.length === 0) {
    console.log('❌ Purchase History: 생성 안됨')
  } else {
    console.log(`✅ Purchase History: ${purchases.length}개 생성됨`)
    purchases.forEach(p => {
      console.log(`   - [${p.purchase_type}] ${p.product_name} (${p.price}원)`)
    })
  }

  // 3. Devices
  const { data: devices, error: deviceError } = await supabase
    .from('customer_devices')
    .select('*')
    .eq('user_id', testUserId)

  if (deviceError || !devices || devices.length === 0) {
    console.log('❌ Devices: 생성 안됨')
  } else {
    console.log(`✅ Devices: ${devices.length}개 생성됨`)
    devices.forEach(d => {
      console.log(`   - ${d.manufacturer} ${d.model_name} (현재 사용: ${d.is_current ? '예' : '아니오'})`)
    })
  }

  // 4. Family Members
  const { data: family, error: familyError } = await supabase
    .from('family_members')
    .select('*')
    .eq('user_id', testUserId)

  if (familyError || !family || family.length === 0) {
    console.log('⊘ Family Members: 생성 안됨 (확률적)')
  } else {
    console.log(`✅ Family Members: ${family.length}개 생성됨`)
    family.forEach(f => {
      console.log(`   - ${f.relationship} (${f.age_range}, 회선: ${f.has_mobile_line ? '있음' : '없음'})`)
    })
  }

  // 5. App Usage Metrics
  const { data: metrics, error: metricsError } = await supabase
    .from('app_usage_metrics')
    .select('*')
    .eq('user_id', testUserId)

  if (metricsError || !metrics || metrics.length === 0) {
    console.log('❌ App Usage Metrics: 생성 안됨')
  } else {
    console.log(`✅ App Usage Metrics: ${metrics.length}개 생성됨 (최근 60일)`)
  }

  console.log('\n' + '='.repeat(60))
  console.log('✨ 테스트 완료!')
  console.log('\n💡 테스트 데이터를 삭제하려면 아래 SQL을 실행하세요:')
  console.log(`DELETE FROM profiles WHERE id = '${testUserId}';`)
  console.log('(CASCADE 설정으로 관련 데이터도 자동 삭제됩니다)')
  console.log('='.repeat(60))
}

testAutoGenerate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 오류:', error)
    process.exit(1)
  })
