import { createServiceRoleClient } from '@/lib/supabase/server'

export interface CustomerSearchResult {
  id: string
  customer_name: string | null
  customer_phone: string | null
  customer_birth?: string | null
  plan_name?: string | null
  plan_price?: number | null
  bundle_type?: string | null
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

  // profiles 테이블에서 검색하고 customer_demographics, family_members 조인
  const { data: profileResults, error: profileError } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      phone_number,
      birthdate,
      created_at,
      customer_demographics (
        current_plan_type,
        current_plan_price
      ),
      family_members (
        id
      )
    `)
    .or(`full_name.ilike.%${cleanQuery}%,phone_number.ilike.%${cleanQuery}%`)
    .eq('role', 'customer')
    .order('created_at', { ascending: false })
    .limit(50)

  if (profileError) {
    console.error('❌ Profile search error:', profileError)
    throw new Error(`Failed to search customers: ${profileError.message}`)
  }

  // profiles 결과를 CustomerSearchResult 형식으로 변환
  const results: CustomerSearchResult[] = (profileResults || []).map((profile: any) => {
    const demographics = profile.customer_demographics?.[0]
    const hasFamilyMembers = profile.family_members && profile.family_members.length > 0

    return {
      id: profile.id,
      customer_name: profile.full_name,
      customer_phone: profile.phone_number,
      customer_birth: profile.birthdate,
      plan_name: demographics?.current_plan_type || null,
      plan_price: demographics?.current_plan_price || null,
      bundle_type: hasFamilyMembers ? '결합' : '없음',
      created_at: profile.created_at,
      source: 'profile' as const,
      user_id: profile.id,
      conversations: []
    }
  })

  console.log(`✅ Found ${results.length} customers from profiles`)

  return results
}

export interface RecentCustomer {
  id: string
  name: string
  phone: string
  time: string
  lastConversationAt: string
}

export async function getRecentCustomers(limit: number = 5): Promise<RecentCustomer[]> {
  const supabase = await createServiceRoleClient()

  console.log('🕐 Fetching recent customers...')

  // 1. 최근 종료된 대화 조회
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select(`
      id,
      session_id,
      ended_at,
      customer_sessions (
        user_id,
        customer_name,
        customer_phone
      )
    `)
    .not('ended_at', 'is', null)
    .order('ended_at', { ascending: false })
    .limit(50) // 중복 제거를 위해 더 많이 가져옴

  if (convError) {
    console.error('❌ Error fetching recent conversations:', convError)
    return []
  }

  if (!conversations || conversations.length === 0) {
    console.log('❌ No recent conversations found')
    return []
  }

  // 2. user_id 기준으로 중복 제거 (가장 최근 대화만)
  const seenUserIds = new Set<string>()
  const uniqueCustomers: RecentCustomer[] = []

  for (const conv of conversations) {
    const session = (conv.customer_sessions as any)
    if (!session || !session.user_id) continue

    if (seenUserIds.has(session.user_id)) continue
    seenUserIds.add(session.user_id)

    // 시간 차이 계산
    const endedAt = new Date(conv.ended_at!)
    const now = new Date()
    const diffMs = now.getTime() - endedAt.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    let timeText: string
    if (diffMins < 60) {
      timeText = `${diffMins}분 전`
    } else if (diffMins < 1440) {
      timeText = `${Math.floor(diffMins / 60)}시간 전`
    } else {
      timeText = `${Math.floor(diffMins / 1440)}일 전`
    }

    // 3. profiles에서 정확한 이름 가져오기
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, phone_number')
      .eq('id', session.user_id)
      .single()

    uniqueCustomers.push({
      id: session.user_id,
      name: profile?.full_name || session.customer_name || '알 수 없음',
      phone: profile?.phone_number || session.customer_phone || '',
      time: timeText,
      lastConversationAt: conv.ended_at!
    })

    if (uniqueCustomers.length >= limit) break
  }

  console.log(`✅ Found ${uniqueCustomers.length} recent customers`)
  return uniqueCustomers
}

export async function getCustomerDetail(customerId: string) {
  const supabase = await createServiceRoleClient()

  // customerId is actually profiles.id, so we need to find customer_sessions by user_id
  const { data: sessions, error: sessionError } = await supabase
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
    .eq('user_id', customerId)
    .order('created_at', { ascending: false })

  if (sessionError) {
    throw new Error(`Failed to fetch customer detail: ${sessionError.message}`)
  }

  // Use the first (most recent) session or create a default one
  const session = sessions && sessions.length > 0 ? sessions[0] : null

  if (!session) {
    throw new Error('No customer session found for this user')
  }

  // Get predictions for all sessions of this customer
  const sessionIds = sessions?.map(s => s.id) || []
  const { data: predictions, error: predictionsError } = await supabase
    .from('purchase_predictions')
    .select('*')
    .in('session_id', sessionIds)
    .order('created_at', { ascending: false })

  if (predictionsError) {
    console.error('Error fetching predictions:', predictionsError)
  }

  return {
    session,
    predictions: predictions || [],
  }
}
