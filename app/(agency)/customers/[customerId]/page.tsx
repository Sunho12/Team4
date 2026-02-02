'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { User, Phone, Calendar, Smartphone, Wifi, CreditCard, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const customerId = params.customerId as string

  const [customer, setCustomer] = useState<any>(null)
  const [predictions, setPredictions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPredicting, setIsPredicting] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [potentialScore, setPotentialScore] = useState(85)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (authChecked) {
      loadCustomerData()
    }
  }, [customerId, authChecked])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')

      if (!response.ok) {
        router.push('/search/login')
        return
      }

      const data = await response.json()
      const userRole = data.user.role

      if (userRole !== 'admin' && userRole !== 'agency_staff') {
        alert('권한이 없습니다. 대리점 직원만 접근할 수 있습니다.')
        router.push('/user/login')
        return
      }

      setAuthChecked(true)
    } catch (error) {
      router.push(`/auth/login?returnUrl=/customers/${customerId}`)
    }
  }

  const loadCustomerData = async () => {
    try {
      const response = await fetch(`/api/agency/customer/${customerId}`)

      if (response.ok) {
        const data = await response.json()
        setCustomer(data.session)
        setPredictions(data.predictions || [])
      }
    } catch (error) {
      console.error('Failed to load customer data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const analyzePurchaseIntent = async () => {
    setIsPredicting(true)

    try {
      const response = await fetch('/api/agency/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: customerId }),
      })

      if (response.ok) {
        const data = await response.json()
        setPredictions(data.predictions)
      }
    } catch (error) {
      console.error('Failed to analyze purchase intent:', error)
    } finally {
      setIsPredicting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#EA002C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">고객 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">고객 정보를 찾을 수 없습니다</p>
          <Link href="/search">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              검색으로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/20 to-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 상단 뒤로가기 */}
        <Link href="/search">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            고객 검색으로 돌아가기
          </Button>
        </Link>

        {/* 1. 고객 기본 정보 섹션 (Profile Card) */}
        <div className="backdrop-blur-sm bg-white/90 rounded-3xl shadow-xl border border-gray-200/50 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#EA002C] to-[#FF7A00] rounded-2xl flex items-center justify-center text-white shadow-lg">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{customer.customer_name || '이름 없음'}</h1>
                <p className="text-gray-500 flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4" />
                  {customer.customer_phone || '전화번호 없음'}
                </p>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 text-sm">
              VIP 고객
            </Badge>
          </div>

          {/* 인포그래픽 스타일 정보 그리드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* 생년월일 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-4 border border-blue-200/50">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-semibold text-blue-900">생년월일</p>
              </div>
              <p className="text-lg font-bold text-blue-900">1985.03.15</p>
            </div>

            {/* 결합여부 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-4 border border-green-200/50">
              <div className="flex items-center gap-2 mb-2">
                <Wifi className="w-5 h-5 text-green-600" />
                <p className="text-sm font-semibold text-green-900">결합상품</p>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-green-600 hover:bg-green-700">유무선</Badge>
                <Badge className="bg-emerald-600 hover:bg-emerald-700">가족</Badge>
              </div>
            </div>

            {/* 단말기 정보 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-4 border border-purple-200/50">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-5 h-5 text-purple-600" />
                <p className="text-sm font-semibold text-purple-900">단말기</p>
              </div>
              <p className="text-sm font-bold text-purple-900">Galaxy S24 Ultra</p>
              <Badge className="mt-1 bg-purple-600 hover:bg-purple-700 text-xs">잔여 12개월</Badge>
            </div>

            {/* 요금제 */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-4 border border-orange-200/50">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-orange-600" />
                <p className="text-sm font-semibold text-orange-900">현재 요금제</p>
              </div>
              <p className="text-lg font-bold text-orange-900">5G 프리미어 에센셜</p>
              <p className="text-xs text-orange-700 mt-1">월 75,000원</p>
            </div>
          </div>
        </div>

        {/* 2층 그리드: 상담 내역 + AI 인사이트 */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* 2. 이전 상담 내역 섹션 (좌측) */}
          <div className="backdrop-blur-sm bg-white/90 rounded-3xl shadow-xl border border-gray-200/50 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-2 h-8 bg-gradient-to-b from-[#EA002C] to-[#FF7A00] rounded-full"></div>
              이전 상담 내역
            </h2>

            <div className="space-y-4">
              {/* 스켈레톤 카드 1 */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-4 bg-gray-300 rounded w-24"></div>
                  <div className="h-6 bg-gray-300 rounded-full w-20"></div>
                </div>
                <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>

              {/* 스켈레톤 카드 2 */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-4 bg-gray-300 rounded w-24"></div>
                  <div className="h-6 bg-gray-300 rounded-full w-20"></div>
                </div>
                <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>

              {/* 스켈레톤 카드 3 */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-4 bg-gray-300 rounded w-24"></div>
                  <div className="h-6 bg-gray-300 rounded-full w-20"></div>
                </div>
                <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>

              <div className="text-center py-4">
                <p className="text-sm text-gray-500">데이터 로딩 중...</p>
              </div>
            </div>
          </div>

          {/* 3. AI 인사이트 및 영업 지수 (우측) */}
          <div className="backdrop-blur-sm bg-white/90 rounded-3xl shadow-xl border border-gray-200/50 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-2 h-8 bg-gradient-to-b from-[#3617CE] to-[#5B3FE8] rounded-full"></div>
              AI 영업 인사이트
            </h2>

            {/* 잠재고객지수 - 원형 게이지 */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-8 mb-6 border border-purple-200/50">
              <p className="text-center text-sm font-semibold text-purple-900 mb-4">잠재고객지수</p>

              {/* 원형 게이지 차트 */}
              <div className="relative w-48 h-48 mx-auto">
                <svg className="transform -rotate-90 w-48 h-48">
                  {/* 배경 원 */}
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="#E5E7EB"
                    strokeWidth="16"
                    fill="none"
                  />
                  {/* 진행 원 */}
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="url(#gradient)"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={`${2 * Math.PI * 88 * (1 - potentialScore / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#EA002C" />
                      <stop offset="100%" stopColor="#FF7A00" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* 중앙 텍스트 */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold bg-gradient-to-r from-[#EA002C] to-[#FF7A00] bg-clip-text text-transparent">
                    {potentialScore}
                  </span>
                  <span className="text-sm text-gray-600 font-medium">/ 100점</span>
                </div>
              </div>

              <div className="text-center mt-4">
                <Badge className="bg-gradient-to-r from-[#EA002C] to-[#FF7A00] text-white px-4 py-1">
                  기기변경 확률 높음
                </Badge>
              </div>
            </div>

            {/* 예상 필요 서비스 - 스켈레톤 */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200/50">
              <p className="text-center text-sm font-semibold text-blue-900 mb-4">예상 필요 서비스</p>

              <div className="space-y-3">
                <div className="bg-white/70 rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-blue-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-blue-100 rounded w-1/2"></div>
                </div>
                <div className="bg-white/70 rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-blue-200 rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-blue-100 rounded w-3/5"></div>
                </div>
              </div>

              <div className="text-center mt-4">
                <p className="text-xs text-blue-700">
                  AI가 고객님의 다음 니즈를 분석 중입니다
                </p>
              </div>
            </div>

            {/* 분석 버튼 */}
            <Button
              onClick={analyzePurchaseIntent}
              disabled={isPredicting}
              className="w-full mt-6 bg-gradient-to-r from-[#3617CE] to-[#5B3FE8] hover:from-[#2910A8] hover:to-[#4A32D3] text-white py-6 rounded-xl text-lg font-semibold shadow-lg"
            >
              {isPredicting ? 'AI 분석 중...' : '상세 분석 시작하기'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
