import { NextResponse } from 'next/server'
import { createSession } from '@/lib/services/chatService'
import { getCurrentUser } from '@/lib/services/authService'

export async function POST() {
  try {
    // Check authentication
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    // Create session with user ID and customer info
    const session = await createSession(user.id, user.phoneNumber, user.name)

    return NextResponse.json({
      sessionToken: session.sessionToken,
      sessionId: session.id,
    })
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}
