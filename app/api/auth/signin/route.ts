import { NextResponse } from 'next/server'
import { signIn } from '@/lib/services/authService'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, password } = body

    if (!name || !password) {
      return NextResponse.json(
        { error: '이름과 비밀번호를 입력해주세요' },
        { status: 400 }
      )
    }

    const user = await signIn(name, password)

    return NextResponse.json({
      success: true,
      message: '로그인되었습니다',
      user,
    })
  } catch (error: any) {
    console.error('Signin error:', error)
    return NextResponse.json(
      { error: error.message || '로그인에 실패했습니다' },
      { status: 401 }
    )
  }
}
