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

  // 디버깅: profiles 테이블의 모든 데이터 확인
  const { data: allData, error: allError } = await supabase
    .from('profiles')
    .select('*')
    .limit(5)

  console.log('🔍 Sample profiles data:', JSON.stringify(allData, null, 2))
  console.log('🔍 Sample profiles error:', allError)

  // profiles 테이블에서 검색 (이름 또는 전화번호)
  let profileResults: any[] = []

  try {
    // 이름으로 검색 (존재하는 필드만 조회)
    const { data: nameResults, error: nameError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        phone_number,
        birthdate,
        created_at
      `)
      .ilike('full_name', `%${cleanQuery}%`)
      .order('created_at', { ascending: false })
      .limit(50)

    console.log('🔍 Name search results:', nameResults?.length || 0, 'found')
    console.log('🔍 Name search data:', JSON.stringify(nameResults, null, 2))
    if (nameError) {
      console.error('❌ Name search error:', nameError)
    }

    // 전화번호로 검색 (존재하는 필드만 조회)
    const { data: phoneResults, error: phoneError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        phone_number,
        birthdate,
        created_at
      `)
      .ilike('phone_number', `%${cleanQuery}%`)
      .order('created_at', { ascending: false })
      .limit(50)

    console.log('🔍 Phone search results:', phoneResults?.length || 0, 'found')
    if (phoneError) {
      console.error('❌ Phone search error:', phoneError)
    }

    // 결과 합치기 (중복 제거)
    const nameIds = new Set((nameResults || []).map(r => r.id))
    const phoneIds = new Set((phoneResults || []).map(r => r.id))
    const allIds = new Set([...nameIds, ...phoneIds])

    const allResults = [...(nameResults || []), ...(phoneResults || [])]
    profileResults = Array.from(allIds).map(id =>
      allResults.find(r => r.id === id)
    ).filter(Boolean)

    console.log(`✅ Found ${profileResults.length} unique customers (${nameResults?.length || 0} by name, ${phoneResults?.length || 0} by phone)`)
  } catch (error: any) {
    console.error('❌ Search error:', error)
    throw new Error(`Failed to search customers: ${error.message}`)
  }

  // profiles 결과를 CustomerSearchResult 형식으로 변환
  const results: CustomerSearchResult[] = (profileResults || []).map(profile => ({
    id: profile.id,
    customer_name: profile.full_name,
    customer_phone: profile.phone_number,
    customer_birth: profile.birthdate,
    plan_name: null,
    plan_price: null,
    bundle_type: null,
    device_model: null,
    device_remaining_months: null,
    created_at: profile.created_at,
    source: 'profile' as const,
    user_id: profile.id,
    conversations: []
  }))

  console.log(`✅ Found ${results.length} customers from profiles`)

  return results
}

export async function getRecentCustomers(limit: number = 5): Promise<CustomerSearchResult[]> {
  const supabase = await createServiceRoleClient()

  console.log('🔍 Fetching recent customers, limit:', limit)

  try {
    const { data: recentProfiles, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        phone_number,
        birthdate,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('❌ Error fetching recent customers:', error)
      throw new Error(`Failed to fetch recent customers: ${error.message}`)
    }

    const results: CustomerSearchResult[] = (recentProfiles || []).map(profile => ({
      id: profile.id,
      customer_name: profile.full_name,
      customer_phone: profile.phone_number,
      customer_birth: profile.birthdate,
      plan_name: null,
      plan_price: null,
      bundle_type: null,
      device_model: null,
      device_remaining_months: null,
      created_at: profile.created_at,
      source: 'profile' as const,
      user_id: profile.id,
      conversations: []
    }))

    console.log(`✅ Found ${results.length} recent customers`)
    return results
  } catch (error: any) {
    console.error('❌ Error in getRecentCustomers:', error)
    throw error
  }
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

  // Get profile data (including birthdate) if we have a userId
  let profile = null
  if (userId) {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('birthdate, full_name')
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
