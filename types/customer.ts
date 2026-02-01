export interface Customer {
  id: string
  name: string | null
  phone: string | null
  created_at: string
}

export interface ConversationSummary {
  summary: string
  category: string
  keywords: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
}
