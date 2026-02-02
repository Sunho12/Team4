import { NextResponse } from 'next/server'
import { endConversation } from '@/lib/services/chatService'
import { generateSummary } from '@/lib/ai/summarize'
import { analyzePurchaseIntent } from '@/lib/ai/predict'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { conversationId } = await request.json()

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Missing conversationId' },
        { status: 400 }
      )
    }

    // 1. End the conversation
    await endConversation(conversationId)

    // 2. Generate summary
    const summary = await generateSummary(conversationId)

    // 3. Get session_id for purchase intent analysis
    const supabase = await createServiceRoleClient()
    const { data: conversation } = await supabase
      .from('conversations')
      .select('session_id')
      .eq('id', conversationId)
      .single()

    // 4. Automatically analyze purchase intent
    let predictions = null
    if (conversation?.session_id) {
      try {
        predictions = await analyzePurchaseIntent(conversation.session_id)
      } catch (error) {
        console.error('Failed to generate predictions:', error)
        // Don't fail the whole request if prediction fails
      }
    }

    return NextResponse.json({
      summary,
      predictions,
    })
  } catch (error) {
    console.error('Error ending conversation:', error)
    return NextResponse.json(
      { error: 'Failed to end conversation' },
      { status: 500 }
    )
  }
}
