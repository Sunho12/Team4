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

  const { data: messages, error } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error || !messages || messages.length === 0) {
    throw new Error('Failed to fetch messages for summarization')
  }

  const conversation = messages
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n')

  const response = await openai.chat.completions.create({
    model: MODELS.CHAT,
    messages: [
      { role: 'system', content: SYSTEM_PROMPTS.SUMMARIZE },
      { role: 'user', content: conversation },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  })

  const summaryData = JSON.parse(response.choices[0].message.content || '{}')

  const { error: insertError } = await supabase
    .from('conversation_summaries')
    .insert({
      conversation_id: conversationId,
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
