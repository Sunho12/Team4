import { createServiceRoleClient } from '@/lib/supabase/server'

export interface CustomerSearchResult {
  id: string
  customer_name: string | null
  customer_phone: string | null
  customer_birth?: string | null
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
