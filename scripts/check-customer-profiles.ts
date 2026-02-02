import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Supabase client setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCustomerProfiles() {
  console.log('🔍 role = customer인 프로필 조회 중...\n')

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, role, full_name, phone_number, created_at')
    .eq('role', 'customer')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('❌ 오류 발생:', error)
    return
  }

  if (!profiles || profiles.length === 0) {
    console.log('⚠️  role = customer인 프로필이 없습니다.')
    return
  }

  console.log(`✅ 총 ${profiles.length}명의 고객 프로필을 찾았습니다:\n`)

  profiles.forEach((profile, index) => {
    console.log(`${index + 1}. ID: ${profile.id}`)
    console.log(`   이름: ${profile.full_name || '(없음)'}`)
    console.log(`   전화번호: ${profile.phone_number || '(없음)'}`)
    console.log(`   가입일: ${new Date(profile.created_at).toLocaleDateString('ko-KR')}`)
    console.log('')
  })

  console.log(`\n📊 이 ${profiles.length}명의 고객에 대해 더미 데이터를 생성합니다.`)
}

checkCustomerProfiles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('오류:', error)
    process.exit(1)
  })
