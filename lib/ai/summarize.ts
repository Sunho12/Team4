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

  if (messagesError || !messages || messages.length === 0) {
    throw new Error('Failed to fetch messages for summarization')
  }

  if (conversationError || !conversation) {
    throw new Error('Failed to fetch conversation data')
  }

  const conversationText = messages
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n')

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
    console.error('Error saving summary:', insertError)
  }

  return summaryData
}
