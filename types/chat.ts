export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

export interface Conversation {
  id: string
  sessionId: string
  status: 'active' | 'ended'
  started_at: string
  ended_at?: string
}

export interface ChatState {
  messages: Message[]
  isLoading: boolean
  error: string | null
}
