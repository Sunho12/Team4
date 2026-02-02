import { NextResponse } from 'next/server'
import { signUp } from '@/lib/services/authService'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, password, phoneNumber } = body

    // Validate required fields
    if (!name || !password || !phoneNumber) {
      return NextResponse.json(
        { error: '이름, 비밀번호, 전화번호를 모두 입력해주세요' },
        { status: 400 }
      )
    }

    await signUp({
      name,
      password,
      phoneNumber,
    })

    return NextResponse.json({
      success: true,
      message: '회원가입이 완료되었습니다',
    })
  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: error.message || '회원가입에 실패했습니다' },
      { status: 500 }
    )
  }
}
