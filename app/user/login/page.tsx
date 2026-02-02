'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import Image from 'next/image'
import { User, Lock, AlertCircle } from 'lucide-react'

function UserLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')

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

      // 고객만 허용
      const userRole = data.user.role
      if (userRole !== 'customer') {
        alert('고객 전용 로그인입니다. 대리점 직원은 /search/login을 이용해주세요.')
        setLoading(false)
        return
      }

      // T-world 메인으로 이동 (로그인 상태 유지)
      router.push('/tworld')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden"
         style={{ backgroundColor: '#F8F9FA', letterSpacing: '-0.02em' }}>
      {/* 추상적 유선형 그라데이션 배경 */}
      <div className="absolute top-0 right-0 w-2/3 h-full opacity-20 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-to-br from-[#EA002C] to-[#FF7A00] rounded-full blur-3xl transform translate-x-1/3"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-tl from-[#FF7A00] to-[#EA002C] rounded-full blur-3xl"></div>
      </div>

      {/* 글래스모피즘 로그인 카드 */}
      <div className="relative w-full max-w-md">
        <div
          className="backdrop-blur-[25px] rounded-3xl shadow-2xl border border-white/15 p-10"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* T-Bridge 로고 */}
          <div className="flex justify-center mb-8">
            <Image
              src="/t-bridge-logo-main.png"
              alt="T-Bridge"
              width={200}
              height={60}
              priority
              className="object-contain"
            />
          </div>

          {/* 타이틀 및 설명 */}
          <div className="text-center mb-8">
            <h1 className="text-[20px] font-bold text-gray-900 mb-2">
              T-world 로그인
            </h1>
            <p className="text-[14px]" style={{ color: '#666' }}>
              편리한 상담을 위해 로그인해주세요.
            </p>
          </div>

          {/* 성공 메시지 */}
          {registered && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              회원가입이 완료되었습니다. 로그인해주세요.
            </div>
          )}

          {/* 로그인 폼 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 이름 입력 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">이름</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <User className="w-5 h-5" />
                </div>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="이름을 입력하세요"
                  className="pl-12 h-12 rounded-xl border-gray-300 focus:border-[#EA002C] focus:ring-2 focus:ring-[#EA002C]/20 transition-all"
                />
              </div>
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">비밀번호</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  placeholder="비밀번호를 입력하세요"
                  className="pl-12 h-12 rounded-xl border-gray-300 focus:border-[#EA002C] focus:ring-2 focus:ring-[#EA002C]/20 transition-all"
                />
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* T-Red 로그인 버튼 (Glossy 효과) */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-xl text-base font-bold text-white shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden"
              style={{
                backgroundColor: '#EA002C',
                background: 'linear-gradient(135deg, #EA002C 0%, #FF7A00 100%)'
              }}
            >
              <span className="relative z-10">
                {loading ? '로그인 중...' : 'T-world 시작하기'}
              </span>
              {/* Glossy 효과 */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20 pointer-events-none"></div>
            </Button>

            {/* 하단 메뉴 */}
            <div className="flex items-center justify-between pt-4">
              <Link href="/auth/signup" className="text-xs text-gray-500 hover:text-[#EA002C] transition-colors">
                계정이 없으신가요?
              </Link>
              <Link href="#" className="text-xs text-gray-500 hover:text-[#EA002C] transition-colors">
                비밀번호를 잊으셨나요?
              </Link>
            </div>

            {/* 메인으로 돌아가기 */}
            <div className="text-center pt-2">
              <Link href="/tworld" className="text-sm text-gray-600 hover:text-[#EA002C] transition-colors font-medium">
                ← T-world 메인으로
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* 하단 저작권 */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-xs text-gray-500">
          © 2026 SK Telecom. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default function UserLoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    }>
      <UserLoginForm />
    </Suspense>
  )
}
