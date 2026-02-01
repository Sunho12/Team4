import { NextResponse } from 'next/server'
import { endConversation } from '@/lib/services/chatService'
import { generateSummary } from '@/lib/ai/summarize'

export async function POST(request: Request) {
  try {
    const { conversationId } = await request.json()

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Missing conversationId' },
        { status: 400 }
      )
    }

    await endConversation(conversationId)

    const summary = await generateSummary(conversationId)

    return NextResponse.json({
      summary,
    })
  } catch (error) {
    console.error('Error ending conversation:', error)
    return NextResponse.json(
      { error: 'Failed to end conversation' },
      { status: 500 }
    )
  }
}
