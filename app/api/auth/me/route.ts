import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/authService'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json({ user })
  } catch (error: any) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: '사용자 정보를 가져올 수 없습니다' },
      { status: 500 }
    )
  }
}
