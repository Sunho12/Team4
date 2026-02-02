import { createServiceRoleClient } from '@/lib/supabase/server'

export interface CustomerSearchResult {
  id: string
  customer_name: string | null
  customer_phone: string | null
  created_at: string
  source: 'session' | 'profile'
  user_id?: string
  conversations: {
    id: string
    started_at: string
    conversation_summaries: {
      summary: string
      category: string
      keywords: string[]
    }[]
  }[]
}

export async function searchCustomers(query: string): Promise<CustomerSearchResult[]> {
  const supabase = await createServiceRoleClient()

  console.log('🔍 Searching customers with query:', query)

  // 검색어 전처리 (공백 제거)
  const cleanQuery = query.trim()

  if (!cleanQuery) {
    console.log('❌ Empty query after trim')
    return []
  }

  // 1. profiles 테이블에서 검색 (회원가입한 고객)
  const { data: profileResults, error: profileError } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      phone_number,
      created_at
    `)
    .or(`full_name.ilike.%${cleanQuery}%,phone_number.ilike.%${cleanQuery}%`)
    .eq('role', 'customer')
    .order('created_at', { ascending: false })
    .limit(25)

  if (profileError) {
    console.error('❌ Profile search error:', profileError)
  }

  // 2. customer_sessions 테이블에서 검색 (익명 채팅 고객)
  const { data: sessionResults, error: sessionError } = await supabase
    .from('customer_sessions')
    .select(`
      id,
      customer_name,
      customer_phone,
      user_id,
      created_at,
      conversations (
        id,
        started_at,
        conversation_summaries (
          summary,
          category,
          keywords
        )
      )
    `)
    .or(`customer_name.ilike.%${cleanQuery}%,customer_phone.ilike.%${cleanQuery}%`)
    .order('created_at', { ascending: false })
    .limit(25)

  if (sessionError) {
    console.error('❌ Session search error:', sessionError)
  }

  // 3. profiles 결과를 customer_sessions 형식으로 변환
  const profileResultsFormatted: CustomerSearchResult[] = (profileResults || []).map(profile => ({
    id: profile.id,
    customer_name: profile.full_name,
    customer_phone: profile.phone_number,
    created_at: profile.created_at,
    source: 'profile' as const,
    user_id: profile.id,
    conversations: []
  }))

  // 4. session 결과에 source 추가
  const sessionResultsFormatted: CustomerSearchResult[] = (sessionResults || []).map(session => ({
    ...session,
    source: 'session' as const
  }))

  // 5. 중복 제거 (user_id가 있는 세션은 이미 profiles에서 나왔을 수 있음)
  const profileUserIds = new Set(profileResultsFormatted.map(p => p.id))
  const uniqueSessionResults = sessionResultsFormatted.filter(
    session => !session.user_id || !profileUserIds.has(session.user_id)
  )

  // 6. 결과 합치기 (profiles 우선, 그 다음 sessions)
  const allResults = [...profileResultsFormatted, ...uniqueSessionResults]

  console.log(`✅ Found ${profileResults?.length || 0} profiles, ${sessionResults?.length || 0} sessions (${uniqueSessionResults.length} unique), total: ${allResults.length}`)

  return allResults
}

export async function getCustomerDetail(sessionId: string) {
  const supabase = await createServiceRoleClient()

  const { data: session, error: sessionError } = await supabase
    .from('customer_sessions')
    .select(`
      id,
      customer_name,
      customer_phone,
      created_at,
      conversations (
        id,
        status,
        started_at,
        ended_at,
        conversation_summaries (
          summary,
          category,
          keywords,
          sentiment
        )
      )
    `)
    .eq('id', sessionId)
    .single()

  if (sessionError) {
    throw new Error(`Failed to fetch customer detail: ${sessionError.message}`)
  }

  const { data: predictions, error: predictionsError } = await supabase
    .from('purchase_predictions')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })

  if (predictionsError) {
    console.error('Error fetching predictions:', predictionsError)
  }

  return {
    session,
    predictions: predictions || [],
  }
}
