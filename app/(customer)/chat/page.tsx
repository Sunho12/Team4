'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'

export default function ChatPage() {
  const router = useRouter()
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // model-viewer 스크립트 동적 로드
    const modelViewerScript = document.createElement('script')
    modelViewerScript.type = 'module'
    modelViewerScript.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.0.1/model-viewer.min.js'
    document.head.appendChild(modelViewerScript)

    // Kakao Maps SDK 로드 (대리점 지도 표시용)
    const kakaoJsKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY
    if (kakaoJsKey && !document.querySelector('script[src*="dapi.kakao.com"]')) {
      const kakaoMapScript = document.createElement('script')
      kakaoMapScript.type = 'text/javascript'
      kakaoMapScript.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoJsKey}&autoload=false`
      document.head.appendChild(kakaoMapScript)
    }

    checkAuthAndInitialize()

    return () => {
      if (document.head.contains(modelViewerScript)) {
        document.head.removeChild(modelViewerScript)
      }
    }
  }, [])

  const checkAuthAndInitialize = async () => {
    try {
      // 1. Check authentication
      const authResponse = await fetch('/api/auth/me')

      if (!authResponse.ok) {
        // Not authenticated - redirect to user login
        router.push('/user/login')
        return
      }

      const authData = await authResponse.json()
      setUser(authData.user)

      // 2. Check if user is trying to access customer page with non-customer role
      // Allow all roles to use chat (admin/agency_staff can also chat)

      // 2. Create or get session
      const sessionResponse = await fetch('/api/chat/session', {
        method: 'POST',
      })

      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json()
        setSessionToken(sessionData.sessionToken)
      } else {
        const errorData = await sessionResponse.json()
        setError(errorData.error || '세션 생성에 실패했습니다')
      }
    } catch (err) {
      console.error('Initialization failed:', err)
      setError('초기화 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      router.push('/auth/login')
      router.refresh()
    } catch (err) {
      console.error('Signout failed:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => router.push('/auth/login')}>로그인 페이지로</Button>
        </div>
      </div>
    )
  }

  if (!sessionToken) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">세션을 초기화하는 중...</p>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <Image
            src="/Tworld/T.png"
            alt="T world"
            width={32}
            height={32}
            style={{ width: 'auto', height: 'auto' }}
            priority
          />
          <h1 className="text-xl font-bold text-primary">챗봇</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/customer/history">
            <Button variant="outline" size="sm">내 상담 이력</Button>
          </Link>
          <span className="text-sm text-muted-foreground">
            {user?.name}
          </span>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            로그아웃
          </Button>
        </div>
      </div>

      <ChatInterface
        sessionToken={sessionToken}
        conversationId={conversationId}
        onConversationCreated={setConversationId}
      />
    </main>
  )
}
