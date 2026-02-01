import { NextResponse } from 'next/server'
import { createConversation, getSessionByToken } from '@/lib/services/chatService'

export async function POST(request: Request) {
  try {
    const { sessionToken } = await request.json()

    const session = await getSessionByToken(sessionToken)

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session token' },
        { status: 404 }
      )
    }

    const conversation = await createConversation(session.id)

    return NextResponse.json({
      conversationId: conversation.id,
    })
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}
