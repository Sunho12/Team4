import { createServiceRoleClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

export interface SessionData {
  id: string
  sessionToken: string
}

export interface ConversationData {
  id: string
  sessionId: string
  status: 'active' | 'ended'
}

export async function createSession(customerPhone?: string, customerName?: string): Promise<SessionData> {
  const supabase = await createServiceRoleClient()
  const sessionToken = uuidv4()

  const { data, error } = await supabase
    .from('customer_sessions')
    .insert({
      session_token: sessionToken,
      customer_phone: customerPhone,
      customer_name: customerName,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`)
  }

  return {
    id: data.id,
    sessionToken: data.session_token,
  }
}

export async function getSessionByToken(token: string) {
  const supabase = await createServiceRoleClient()

  const { data, error } = await supabase
    .from('customer_sessions')
    .select('*')
    .eq('session_token', token)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function createConversation(sessionId: string): Promise<ConversationData> {
  const supabase = await createServiceRoleClient()

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      session_id: sessionId,
      status: 'active',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create conversation: ${error.message}`)
  }

  return {
    id: data.id,
    sessionId: data.session_id,
    status: data.status,
  }
}

export async function getActiveConversation(sessionId: string) {
  const supabase = await createServiceRoleClient()

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('session_id', sessionId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string
) {
  const supabase = await createServiceRoleClient()

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to save message: ${error.message}`)
  }

  return data
}

export async function endConversation(conversationId: string) {
  const supabase = await createServiceRoleClient()

  const { error } = await supabase
    .from('conversations')
    .update({
      status: 'ended',
      ended_at: new Date().toISOString(),
    })
    .eq('id', conversationId)

  if (error) {
    throw new Error(`Failed to end conversation: ${error.message}`)
  }
}

export async function getConversationMessages(conversationId: string) {
  const supabase = await createServiceRoleClient()

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch messages: ${error.message}`)
  }

  return data
}
