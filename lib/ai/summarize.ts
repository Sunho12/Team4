import { openai, MODELS } from './openai'
import { SYSTEM_PROMPTS } from './prompts'
import { createServiceRoleClient } from '@/lib/supabase/server'

export interface SummaryResult {
  summary: string
  category: string
  keywords: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
}

export async function generateSummary(conversationId: string): Promise<SummaryResult> {
  const supabase = await createServiceRoleClient()

  console.log('[Summarize] Starting summary generation for conversation:', conversationId)

  // Fetch messages and conversation to get session_id
  const [messagesResponse, conversationResponse] = await Promise.all([
    supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true }),
    supabase
      .from('conversations')
      .select('session_id')
      .eq('id', conversationId)
      .single()
  ])

  const { data: messages, error: messagesError } = messagesResponse
  const { data: conversation, error: conversationError } = conversationResponse

  console.log('[Summarize] Messages fetched:', {
    count: messages?.length || 0,
    hasError: !!messagesError,
    error: messagesError
  })

  if (messagesError) {
    throw new Error(`Failed to fetch messages: ${messagesError.message}`)
  }

  if (conversationError) {
    throw new Error(`Failed to fetch conversation: ${conversationError.message}`)
  }

  if (!conversation) {
    throw new Error('Conversation not found')
  }

  // 메시지가 없거나 매우 적을 때 기본 요약 생성
  if (!messages || messages.length === 0) {
    console.log('[Summarize] No messages found, creating default summary')
    const defaultSummary: SummaryResult = {
      summary: '고객이 상담을 시작했으나 메시지 없이 종료했습니다.',
      category: '일반 문의',
      keywords: [],
      sentiment: 'neutral'
    }

    // DB에 저장
    await supabase
      .from('conversation_summaries')
      .insert({
        conversation_id: conversationId,
        session_id: conversation.session_id,
        summary: defaultSummary.summary,
        category: defaultSummary.category,
        keywords: defaultSummary.keywords,
        sentiment: defaultSummary.sentiment,
      })

    return defaultSummary
  }

  const conversationText = messages
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n')

  console.log('[Summarize] Calling OpenAI for summary generation')

  const response = await openai.chat.completions.create({
    model: MODELS.CHAT,
    messages: [
      { role: 'system', content: SYSTEM_PROMPTS.SUMMARIZE },
      { role: 'user', content: conversationText },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  })

  const summaryData = JSON.parse(response.choices[0].message.content || '{}')
  console.log('[Summarize] OpenAI summary generated:', summaryData)

  const { error: insertError } = await supabase
    .from('conversation_summaries')
    .insert({
      conversation_id: conversationId,
      session_id: conversation.session_id,
      summary: summaryData.summary,
      category: summaryData.category,
      keywords: summaryData.keywords,
      sentiment: summaryData.sentiment,
    })

  if (insertError) {
    console.error('[Summarize] Error saving summary:', insertError)
    throw new Error(`Failed to save summary: ${insertError.message}`)
  }

  console.log('[Summarize] Summary saved successfully')
  return summaryData
}
