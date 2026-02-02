import { createServiceRoleClient } from '@/lib/supabase/server'

export interface ConversationHistory {
  id: string
  summary: string
  category: string | null
  keywords: string[] | null
  sentiment: string | null
  created_at: string
  conversations: Array<{
    id: string
    started_at: string
    ended_at: string | null
    status: string
  }>
}

export interface PurchasePrediction {
  id: string
  session_id: string
  prediction_type: string
  probability_score: number
  confidence: string
  reasoning: string | null
  recommended_actions: any
  created_at: string
}

/**
 * Get all conversation history for a user
 */
export async function getUserConversationHistory(userId: string): Promise<ConversationHistory[]> {
  const supabase = await createServiceRoleClient()

  const { data, error } = await supabase
    .from('conversation_summaries')
    .select(`
      id,
      summary,
      category,
      keywords,
      sentiment,
      created_at,
      conversations!inner(
        id,
        started_at,
        ended_at,
        status
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`대화 이력 조회 실패: ${error.message}`)
  }

  return (data || []) as any as ConversationHistory[]
}

/**
 * Get recent purchase predictions for a user
 */
export async function getUserPurchasePredictions(userId: string, limit: number = 5): Promise<PurchasePrediction[]> {
  const supabase = await createServiceRoleClient()

  const { data, error } = await supabase
    .from('purchase_predictions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`구매 예측 조회 실패: ${error.message}`)
  }

  return data as PurchasePrediction[]
}

/**
 * Get complete user history (conversations + predictions)
 */
export async function getUserCompleteHistory(userId: string) {
  const [conversations, predictions] = await Promise.all([
    getUserConversationHistory(userId),
    getUserPurchasePredictions(userId),
  ])

  return {
    conversations,
    predictions,
  }
}
