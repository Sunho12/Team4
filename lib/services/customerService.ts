import { createServiceRoleClient } from '@/lib/supabase/server'

export interface CustomerSearchResult {
  id: string
  customer_name: string | null
  customer_phone: string | null
  customer_birth?: string | null
  plan_name?: string | null
  plan_price?: number | null
  bundle_type?: string | null
  device_model?: string | null
  device_remaining_months?: number | null
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

  // profiles 테이블에서만 검색 (회원가입한 고객)
  const { data: profileResults, error: profileError } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      phone_number,
      birthdate,
      plan_name,
      plan_price,
      bundle_types,
      device_model,
      device_remaining_months,
      created_at
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
  const results: CustomerSearchResult[] = (profileResults || []).map(profile => ({
    id: profile.id,
    customer_name: profile.full_name,
    customer_phone: profile.phone_number,
    customer_birth: profile.birthdate,
    plan_name: profile.plan_name,
    plan_price: profile.plan_price,
    bundle_type: profile.bundle_types?.join(', ') || '없음',
    device_model: profile.device_model,
    device_remaining_months: profile.device_remaining_months,
    created_at: profile.created_at,
    source: 'profile' as const,
    user_id: profile.id,
    conversations: []
  }))

  console.log(`✅ Found ${results.length} customers from profiles`)

  return results
}

export async function getCustomerDetail(customerId: string) {
  const supabase = await createServiceRoleClient()

  // First, check if customerId is a session_id
  const { data: directSession } = await supabase
    .from('customer_sessions')
    .select('id, user_id, customer_name, customer_phone, created_at')
    .eq('id', customerId)
    .single()

  let userId: string | null = null
  let sessions: any[] = []

  if (directSession) {
    // customerId is a session_id
    console.log('customerId is a session_id:', directSession.id)
    userId = directSession.user_id

    if (userId) {
      // Get all sessions for this user
      const { data: userSessions, error: sessionError } = await supabase
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
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (sessionError) {
        throw new Error(`Failed to fetch customer detail: ${sessionError.message}`)
      }
      sessions = userSessions || []
    } else {
      // No user_id, just use this session
      const { data: singleSession, error: sessionError } = await supabase
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
        .eq('id', directSession.id)
        .single()

      if (sessionError) {
        throw new Error(`Failed to fetch customer detail: ${sessionError.message}`)
      }
      sessions = singleSession ? [singleSession] : []
    }
  } else {
    // customerId might be a user_id (profile id)
    console.log('customerId might be a user_id')
    userId = customerId

    const { data: userSessions, error: sessionError } = await supabase
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
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (sessionError) {
      throw new Error(`Failed to fetch customer detail: ${sessionError.message}`)
    }
    sessions = userSessions || []
  }

  // Get profile data (including birthdate, plan, device info) if we have a userId
  let profile = null
  if (userId) {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('birthdate, full_name, plan_name, plan_price, bundle_types, device_model, device_remaining_months')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
    } else {
      profile = profileData
    }
  }

  // Use the first (most recent) session or create a default one
  const session = sessions && sessions.length > 0 ? sessions[0] : null

  if (!session) {
    throw new Error('No customer session found for this user')
  }

  // Add profile data to session data
  const sessionWithProfile = {
    ...session,
    birthdate: profile?.birthdate || null,
    plan_name: profile?.plan_name || null,
    plan_price: profile?.plan_price || null,
    bundle_types: profile?.bundle_types || [],
    device_model: profile?.device_model || null,
    device_remaining_months: profile?.device_remaining_months || null,
  }

  // Get predictions for all sessions of this customer
  const sessionIds = sessions?.map(s => s.id) || []
  let predictions: any[] = []

  if (sessionIds.length > 0) {
    const { data: predictionsData, error: predictionsError } = await supabase
      .from('purchase_predictions')
      .select('*')
      .in('session_id', sessionIds)
      .order('created_at', { ascending: false })

    if (predictionsError) {
      console.error('Error fetching predictions:', predictionsError)
    } else {
      predictions = predictionsData || []
    }
  }

  return {
    session: sessionWithProfile,
    predictions,
  }
}
