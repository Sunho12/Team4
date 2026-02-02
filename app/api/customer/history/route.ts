import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/authService'
import { getUserCompleteHistory } from '@/lib/services/customerHistoryService'

export async function GET() {
  try {
    // Check authentication
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Fetch user's complete history
    const history = await getUserCompleteHistory(user.id)

    return NextResponse.json(history)
  } catch (error: any) {
    console.error('Error fetching history:', error)
    return NextResponse.json(
      { error: error.message || '이력을 불러올 수 없습니다' },
      { status: 500 }
    )
  }
}
