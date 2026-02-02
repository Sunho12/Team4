'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')
  const returnUrl = searchParams.get('returnUrl') || '/chat'

  const [formData, setFormData] = useState({
    name: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      // Role에 따라 리다이렉트
      const userRole = data.user.role

      if (returnUrl.includes('/search') || returnUrl.includes('/customers')) {
        // 대리점 페이지로 가려는 경우
        if (userRole === 'admin' || userRole === 'agency_staff') {
          router.push(returnUrl)
        } else {
          alert('권한이 없습니다. 대리점 직원만 접근할 수 있습니다.')
          router.push('/chat')
        }
      } else if (returnUrl.includes('/chat') || returnUrl.includes('/customer')) {
        // 챗봇 페이지로 가려는 경우
        if (userRole === 'customer') {
          router.push(returnUrl)
        } else {
          // admin이나 agency_staff도 챗봇 사용 가능하도록
          router.push(returnUrl)
        }
      } else {
        // 기본 리다이렉트: role에 따라
        if (userRole === 'admin' || userRole === 'agency_staff') {
          router.push('/search')
        } else {
          router.push('/chat')
        }
      }

      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">로그인</CardTitle>
          <CardDescription>
            이름과 비밀번호로 로그인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registered && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
              회원가입이 완료되었습니다. 로그인해주세요.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">이름</label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="이름을 입력하세요"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">비밀번호</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                placeholder="비밀번호를 입력하세요"
                className="mt-1"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '로그인 중...' : '로그인'}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              계정이 없으신가요?{' '}
              <Link href="/auth/signup" className="text-primary hover:underline font-medium">
                회원가입
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
