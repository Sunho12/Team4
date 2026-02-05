import { NextResponse } from 'next/server'
import { saveMessage } from '@/lib/services/chatService'

/**
 * 메시지만 저장하는 API (AI 응답 생성 없이)
 * 토글 버튼 선택 등 단순 메시지 저장에 사용
 */
export async function POST(request: Request) {
  try {
    const { conversationId, role, content } = await request.json()

    if (!conversationId || !role || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (role !== 'user' && role !== 'assistant' && role !== 'system') {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    const message = await saveMessage(conversationId, role, content)

    return NextResponse.json({
      messageId: message.id,
      success: true
    })
  } catch (error) {
    console.error('Error saving message:', error)
    return NextResponse.json(
      { error: 'Failed to save message' },
      { status: 500 }
    )
  }
}
