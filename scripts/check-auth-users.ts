import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAuthUsers() {
  console.log('🔍 Profiles와 Auth.Users 관계 확인 중...\n')

  // Get customer profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('role', 'customer')

  if (profileError) {
    console.error('❌ Profiles 조회 오류:', profileError)
    return
  }

  console.log(`✅ ${profiles?.length || 0}명의 고객 프로필 발견\n`)

  if (!profiles || profiles.length === 0) return

  // Check each profile in auth.users
  for (const profile of profiles) {
    console.log(`\n고객: ${profile.full_name} (${profile.id})`)

    // Try to fetch from auth.users using admin API
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id)

    if (authError) {
      console.log(`  ❌ auth.users에 존재하지 않음: ${authError.message}`)
    } else if (authUser) {
      console.log(`  ✅ auth.users에 존재함`)
      console.log(`     Email: ${authUser.user.email}`)
    } else {
      console.log(`  ❌ auth.users에 존재하지 않음`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('💡 해결 방법:')
  console.log('profiles.id가 auth.users에 없으면 외래 키 제약을 위반합니다.')
  console.log('해결책:')
  console.log('1. profiles.id를 auth.users에 있는 ID로 변경하거나')
  console.log('2. 외래 키를 profiles.id로 참조하도록 변경')
  console.log('='.repeat(60))
}

checkAuthUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 오류:', error)
    process.exit(1)
  })
