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

    console.log('[End API] Starting end conversation process:', conversationId)

    // 1. End the conversation
    try {
      await endConversation(conversationId)
      console.log('[End API] Conversation status updated to ended')
    } catch (error) {
      console.error('[End API] Failed to end conversation:', error)
      throw error
    }

    // 2. Generate summary
    let summary
    try {
      console.log('[End API] Starting summary generation')
      summary = await generateSummary(conversationId)
      console.log('[End API] Summary generated successfully:', summary)
    } catch (error) {
      console.error('[End API] Failed to generate summary:', error)
      // Throw the error with details
      throw new Error(`Summary generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

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
        console.log('[End API] Predictions generated successfully')
      } catch (error) {
        console.error('[End API] Failed to generate predictions:', error)
        // Don't fail the whole request if prediction fails
      }
    }

    return NextResponse.json({
      summary,
      predictions,
    })
  } catch (error) {
    console.error('[End API] Error ending conversation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to end conversation' },
      { status: 500 }
    )
  }
}
