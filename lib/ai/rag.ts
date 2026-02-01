import { openai, MODELS } from './openai'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function retrieveContext(query: string, matchCount: number = 3): Promise<string> {
  try {
    const embeddingResponse = await openai.embeddings.create({
      model: MODELS.EMBEDDING,
      input: query,
    })

    const queryEmbedding = embeddingResponse.data[0].embedding

    const supabase = await createServiceRoleClient()

    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_count: matchCount,
      match_threshold: 0.7,
    })

    if (error) {
      console.error('Error retrieving context:', error)
      return ''
    }

    if (!data || data.length === 0) {
      return ''
    }

    return data.map((doc: any) => doc.content).join('\n\n')
  } catch (error) {
    console.error('Error in retrieveContext:', error)
    return ''
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: MODELS.EMBEDDING,
    input: text,
  })

  return response.data[0].embedding
}
