import { createServiceRoleClient } from '@/lib/supabase/server'

export interface CustomerSearchResult {
  id: string
  customer_name: string | null
  customer_phone: string | null
  created_at: string
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

  const { data, error } = await supabase
    .from('customer_sessions')
    .select(`
      id,
      customer_name,
      customer_phone,
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
    .or(`customer_name.ilike.%${query}%,customer_phone.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    throw new Error(`Failed to search customers: ${error.message}`)
  }

  return data as CustomerSearchResult[]
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
