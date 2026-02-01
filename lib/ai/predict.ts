import { openai, MODELS } from './openai'
import { SYSTEM_PROMPTS } from './prompts'
import { createServiceRoleClient } from '@/lib/supabase/server'

export interface PredictionResult {
  prediction_type: string
  probability_score: number
  confidence: 'low' | 'medium' | 'high'
  reasoning: string
  recommended_actions: string[]
}

export async function analyzePurchaseIntent(sessionId: string): Promise<PredictionResult[]> {
  const supabase = await createServiceRoleClient()

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select(`
      id,
      conversation_summaries (
        summary,
        category,
        keywords,
        sentiment
      )
    `)
    .eq('session_id', sessionId)
    .order('started_at', { ascending: false })
    .limit(5)

  if (error || !conversations || conversations.length === 0) {
    throw new Error('Failed to fetch conversation history')
  }

  const summaries = conversations
    .map((c: any) => c.conversation_summaries?.[0])
    .filter(Boolean)

  if (summaries.length === 0) {
    throw new Error('No summaries available for analysis')
  }

  const analysisPrompt = `다음은 고객의 최근 상담 이력입니다:

${JSON.stringify(summaries, null, 2)}

이 고객의 구매 의향을 분석하여 JSON 형식으로 응답하세요.`

  const response = await openai.chat.completions.create({
    model: MODELS.CHAT,
    messages: [
      { role: 'system', content: SYSTEM_PROMPTS.PREDICT },
      { role: 'user', content: analysisPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  })

  const result = JSON.parse(response.choices[0].message.content || '{}')
  const predictions: PredictionResult[] = result.predictions || []

  for (const pred of predictions) {
    await supabase.from('purchase_predictions').insert({
      session_id: sessionId,
      prediction_type: pred.prediction_type,
      probability_score: pred.probability_score,
      confidence: pred.confidence,
      reasoning: pred.reasoning,
      recommended_actions: pred.recommended_actions,
    })
  }

  return predictions
}
