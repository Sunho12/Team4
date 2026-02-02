import OpenAI from 'openai'

// Lazy initialization to allow rule-based predictions without API key
let _openai: OpenAI | null = null

export const getOpenAI = (): OpenAI => {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables')
    }
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return _openai
}

// Legacy export for backward compatibility
export const openai = new Proxy({} as OpenAI, {
  get(target, prop) {
    return getOpenAI()[prop as keyof OpenAI]
  }
})

export const MODELS = {
  CHAT: 'gpt-4o',
  EMBEDDING: 'text-embedding-3-small',
} as const
