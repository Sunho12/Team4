'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, User, Phone, Calendar, TrendingUp, MessageSquare, Home, FileText, Bell, Settings, Folder } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

export default function SearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [potentialScore] = useState(85)
  const [activeMenu, setActiveMenu] = useState('search')
  const [activePolicy, setActivePolicy] = useState('device')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')

      if (!response.ok) {
        router.push('/auth/login?mode=agency')
        return
      }

      const data = await response.json()
      const userRole = data.user.role

      if (userRole !== 'admin' && userRole !== 'agency_staff') {
        alert('권한이 없습니다. 대리점 직원만 접근할 수 있습니다.')
        router.push('/')
        return
      }

      setAuthChecked(true)
    } catch (error) {
      router.push('/auth/login?mode=agency&returnUrl=/search')
    }
  }

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#3617CE] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">대시보드를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/agency/search?q=${encodeURIComponent(query)}`)

      if (response.ok) {
        const data = await response.json()
        setResults(data.customers)
        // 검색 결과가 있으면 즉시 상세 대시보드 표시
        if (data.customers && data.customers.length > 0) {
          setTimeout(() => setShowDetail(true), 100)
        }
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const menuItems = [
    { id: 'home', icon: Home, label: '대시보드 홈' },
    { id: 'search', icon: Search, label: '고객 검색' },
    { id: 'policy', icon: Folder, label: '정책 센터' },
    { id: 'notice', icon: Bell, label: '공지사항' },
    { id: 'settings', icon: Settings, label: '설정' },
  ]

  const recentCustomers = [
    { name: '김철수', phone: '5678', time: '10분 전' },
    { name: '이영희', phone: '1234', time: '25분 전' },
    { name: '박민수', phone: '9012', time: '1시간 전' },
  ]

  const notices = [
    { id: 1, title: '[중요] 2월 단말기 할부 이율 변경 안내', date: '2026.02.01', important: true },
    { id: 2, title: '아이폰 17 시리즈 사전예약 시작', date: '2026.01.30', important: false },
    { id: 3, title: '5G 요금제 신규 출시 안내', date: '2026.01.28', important: false },
    { id: 4, title: '고객 상담 시스템 업데이트 공지', date: '2026.01.25', important: false },
  ]

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F8F9FA' }}>
      {/* 좌측 사이드바 */}
      <aside
        className="w-60 min-h-screen flex flex-col shadow-2xl"
        style={{ backgroundColor: '#3617CE' }}
      >
        {/* 로고 영역 */}
        <div className="p-6 border-b border-white/10">
          <h1 className="text-white text-xl font-bold">T-Bridge</h1>
          <p className="text-white/70 text-xs mt-1">AI Dashboard</p>
        </div>

        {/* 메뉴 */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveMenu(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeMenu === item.id
                        ? 'bg-white/20 text-white shadow-lg'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* 사용자 정보 */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">SKT 크루</p>
              <p className="text-white/60 text-xs">직원 ID: A1234</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* 헤더 */}
        <div className="mb-8">
          <h1
            className="text-5xl font-bold bg-gradient-to-r from-[#3617CE] to-[#5B3FE8] bg-clip-text text-transparent mb-2"
            style={{ fontFamily: "'SK Mobius', sans-serif" }}
          >
            스마트 AI 대시보드
          </h1>
          <p className="text-gray-600">실시간 고객 분석과 AI 기반 상담 지원 시스템</p>
        </div>

        {/* 섹션 A: 고객 검색 (Hero 영역) */}
        <div className="backdrop-blur-sm bg-white/95 rounded-3xl shadow-lg border border-gray-200/50 p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">고객 검색</h2>

          {/* 검색 바 */}
          <div className="relative mb-6">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10">
              <Search className="w-5 h-5" />
            </div>
            <Input
              placeholder="고객 이름 또는 전화번호로 검색하세요..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-12 pr-32 h-14 rounded-xl border-2 border-gray-200 focus:border-[#3617CE] focus:ring-2 focus:ring-[#3617CE]/20 transition-all text-base"
            />
            <Button
              onClick={handleSearch}
              disabled={isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-6 rounded-lg text-white shadow-md"
              style={{ backgroundColor: '#EA002C' }}
            >
              <Search className="h-4 w-4 mr-2" />
              {isLoading ? '검색 중...' : '검색'}
            </Button>
          </div>

          {/* 최근 상담 고객 */}
          {!showDetail && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">최근 상담 고객</p>
              <div className="flex gap-3">
                {recentCustomers.map((customer, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(customer.phone)
                      handleSearch()
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-xl border border-blue-200/50 transition-all"
                  >
                    <User className="w-4 h-4 text-blue-600" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">{customer.name}</p>
                      <p className="text-xs text-gray-500">{customer.time}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 하이엔드 벤토 그리드 - 고객 상세 대시보드 */}
        {showDetail && results.length > 0 && (
          <div
            className="space-y-6 animate-in slide-in-from-bottom-4 duration-500"
            style={{ fontFamily: "'SK Mobius', 'Inter', sans-serif" }}
          >
            {/* 섹션 1: 고객 마스터 카드 (Top / 전체 너비) */}
            <div
              className="rounded-3xl shadow-2xl border border-gray-200/30 p-8"
              style={{
                background: 'linear-gradient(135deg, #E8E8E8 0%, #FFFFFF 50%, #F5F5F5 100%)',
              }}
            >
              <div className="grid grid-cols-6 gap-6 items-center">
                {/* 이름 */}
                <div className="flex flex-col justify-center border-r-2 border-gray-300/50 pr-6">
                  <p className="text-xs text-gray-500 mb-1">고객명</p>
                  <Link
                    href={`/customers/${results[0]?.session_id || results[0]?.id || 'unknown'}`}
                    className="text-2xl font-bold text-gray-900 hover:text-[#3617CE] transition-colors cursor-pointer"
                  >
                    {results[0]?.customer_name || '김철수'}
                  </Link>
                </div>

                {/* 생년월일 */}
                <div className="flex flex-col justify-center border-r-2 border-gray-300/50 pr-6">
                  <p className="text-xs text-gray-500 mb-1">생년월일</p>
                  <p className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Inter, Roboto' }}>
                    {results[0]?.customer_birth || '1990.05.20'}
                  </p>
                </div>

                {/* 전화번호 */}
                <div className="flex flex-col justify-center border-r-2 border-gray-300/50 pr-6">
                  <p className="text-xs text-gray-500 mb-1">연락처</p>
                  <p className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Inter, Roboto' }}>
                    {results[0]?.customer_phone || '010-1234-5678'}
                  </p>
                </div>

                {/* 결합여부 */}
                <div className="flex flex-col justify-center border-r-2 border-gray-300/50 pr-6">
                  <p className="text-xs text-gray-500 mb-1">결합상품</p>
                  <Badge className="bg-gradient-to-r from-[#FF7A00] to-[#FFA500] text-white px-3 py-1 w-fit">
                    {results[0]?.bundle_type || '온가족할인 (30년)'}
                  </Badge>
                </div>

                {/* 단말기 정보 */}
                <div className="flex flex-col justify-center border-r-2 border-gray-300/50 pr-6">
                  <p className="text-xs text-gray-500 mb-1">단말기</p>
                  <p className="text-sm font-bold text-gray-900">{results[0]?.device_model || '아이폰 15 Pro'}</p>
                  <Badge className="bg-gradient-to-r from-[#FF7A00] to-[#FFA500] text-white px-2 py-0.5 text-xs w-fit mt-1">
                    잔여 {results[0]?.device_remaining_months || '6'}개월
                  </Badge>
                </div>

                {/* 요금제 */}
                <div className="flex flex-col justify-center">
                  <p className="text-xs text-gray-500 mb-1">현재 요금제</p>
                  <p className="text-sm font-bold text-gray-900">{results[0]?.plan_name || '5GX 프라임플러스'}</p>
                  <p className="text-xs text-gray-600 mt-1" style={{ fontFamily: 'Inter, Roboto' }}>
                    월 {results[0]?.plan_price?.toLocaleString() || '89,000'}원
                  </p>
                </div>
              </div>
            </div>

            {/* 섹션 2 & 3: 벤토 그리드 레이아웃 */}
            <div className="grid grid-cols-5 gap-6">
              {/* 섹션 2: 과거 상담 히스토리 (60% - 3칸) */}
              <div className="col-span-3 backdrop-blur-sm bg-white/95 rounded-3xl shadow-xl border border-gray-200/50 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <div className="w-2 h-8 bg-gradient-to-b from-[#3617CE] to-[#5B3FE8] rounded-full"></div>
                  최근 1년간의 상담 여정
                </h2>

                <div className="space-y-4">
                  {/* 스켈레톤 카드 1 */}
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="group bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 animate-pulse hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-150 transition-all cursor-pointer relative"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="h-4 bg-gray-300 rounded w-28"></div>
                        <div className="h-6 bg-gray-300 rounded-full w-24"></div>
                      </div>
                      <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>

                      {/* 호버 시 나타나는 상세보기 버튼 */}
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          className="bg-[#3617CE] hover:bg-[#2910A8] text-white text-xs"
                        >
                          상세보기 →
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">과거 상담 데이터를 분석 중입니다...</p>
                  </div>
                </div>
              </div>

              {/* 섹션 3: AI 세일즈 인사이트 (40% - 2칸) */}
              <div className="col-span-2 backdrop-blur-sm bg-white/95 rounded-3xl shadow-xl border border-gray-200/50 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <div className="w-2 h-8 bg-gradient-to-b from-[#3617CE] to-[#5B3FE8] rounded-full"></div>
                  AI 세일즈 인사이트
                </h2>

                {/* 잠재고객지수 - 세미 서클 게이지 */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-200/50">
                  <p className="text-center text-sm font-semibold text-gray-900 mb-4">잠재고객지수</p>

                  {/* 세미 서클 게이지 차트 */}
                  <div className="relative w-full h-32 overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 200 120">
                      {/* 배경 아크 */}
                      <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth="20"
                        strokeLinecap="round"
                      />
                      {/* 진행 아크 */}
                      <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="url(#gaugeGradient)"
                        strokeWidth="20"
                        strokeLinecap="round"
                        strokeDasharray={`${Math.PI * 80 * (potentialScore / 100)} ${Math.PI * 80}`}
                        className="transition-all duration-1000"
                      />
                      <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3617CE" />
                          <stop offset="100%" stopColor="#5B3FE8" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* 중앙 점수 */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                      <span
                        className="text-5xl font-bold bg-gradient-to-r from-[#3617CE] to-[#5B3FE8] bg-clip-text text-transparent"
                        style={{ fontFamily: 'Inter, Roboto' }}
                      >
                        {potentialScore}
                      </span>
                      <span className="text-xs text-gray-600 font-medium">/ 100점</span>
                    </div>
                  </div>

                  <div className="text-center mt-4">
                    <Badge
                      className="text-white px-4 py-1"
                      style={{ backgroundColor: '#EA002C' }}
                    >
                      기기변경 가능성 매우 높음
                    </Badge>
                  </div>
                </div>

                {/* AI 가이드 */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border-2 border-orange-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#EA002C] to-[#FF7A00] rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-orange-900 mb-2 flex items-center gap-1">
                        AI 추천 상담 가이드
                      </p>
                      <p className="text-sm font-bold text-gray-900 leading-relaxed">
                        아이폰 17 사전예약 알림 및 요금제 상향 제안 권장
                      </p>
                      <div className="mt-3 pt-3 border-t border-orange-200">
                        <p className="text-xs text-orange-800">
                          • 현재 요금제 대비 20GB 추가 데이터 필요<br />
                          • 최근 3개월 데이터 사용량 150% 증가 추세
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 섹션 B & C: 공지사항 + 정책 센터 (초기 상태에만 표시) */}
        {!showDetail && (
          <div className="grid grid-cols-2 gap-6">
            {/* 섹션 B: 공지사항 (하단 좌측 50%) */}
            <div className="backdrop-blur-sm bg-white/95 rounded-3xl shadow-lg border border-gray-200/50 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Bell className="w-6 h-6 text-[#3617CE]" />
                  주요 공지사항
                </h2>
                <Button variant="ghost" size="sm" className="text-[#3617CE] hover:text-[#2910A8]">
                  전체보기 →
                </Button>
              </div>

              <div className="space-y-3">
                {notices.map((notice) => (
                  <button
                    key={notice.id}
                    className="w-full text-left p-4 bg-white rounded-xl border border-gray-200 hover:border-[#3617CE] hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {notice.important && (
                            <Badge
                              className="text-white text-xs px-2 py-0.5"
                              style={{ backgroundColor: '#EA002C' }}
                            >
                              중요
                            </Badge>
                          )}
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-[#3617CE] transition-colors">
                            {notice.title}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">{notice.date}</p>
                      </div>
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 섹션 C: 정책 센터 (하단 우측 50%) */}
            <div className="backdrop-blur-sm bg-white/95 rounded-3xl shadow-lg border border-gray-200/50 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Folder className="w-6 h-6 text-[#3617CE]" />
                실시간 정책 센터
              </h2>

              {/* 정책 탭 버튼 */}
              <div className="flex gap-2 mb-6">
                {[
                  { id: 'device', label: '단말기 정책' },
                  { id: 'service', label: '부가서비스' },
                  { id: 'subsidy', label: '보조금 정책' },
                ].map((tab) => (
                  <Button
                    key={tab.id}
                    onClick={() => setActivePolicy(tab.id)}
                    className={`flex-1 ${
                      activePolicy === tab.id
                        ? 'bg-[#3617CE] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>

              {/* 정책 내용 영역 */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50 min-h-[300px]">
                {activePolicy === 'device' && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">단말기 할부 정책</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-[#3617CE] rounded-full mt-1.5"></div>
                        <p className="text-sm text-gray-700">
                          2월 기준 할부 이율: <span className="font-bold">연 5.9%</span>
                        </p>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-[#3617CE] rounded-full mt-1.5"></div>
                        <p className="text-sm text-gray-700">
                          최대 할부 개월: <span className="font-bold">24개월</span>
                        </p>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-[#3617CE] rounded-full mt-1.5"></div>
                        <p className="text-sm text-gray-700">
                          선택약정 할인: 25% (24개월 기준)
                        </p>
                      </li>
                    </ul>
                  </div>
                )}
                {activePolicy === 'service' && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">부가서비스 정책</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-[#3617CE] rounded-full mt-1.5"></div>
                        <p className="text-sm text-gray-700">
                          T우주 패스: 월 9,900원 (VOD 무제한)
                        </p>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-[#3617CE] rounded-full mt-1.5"></div>
                        <p className="text-sm text-gray-700">
                          멜론 이용권: 월 6,600원 (1개월 무료체험)
                        </p>
                      </li>
                    </ul>
                  </div>
                )}
                {activePolicy === 'subsidy' && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">공시지원금 정책</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-[#3617CE] rounded-full mt-1.5"></div>
                        <p className="text-sm text-gray-700">
                          아이폰 15 Pro: 최대 <span className="font-bold text-[#EA002C]">550,000원</span>
                        </p>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-[#3617CE] rounded-full mt-1.5"></div>
                        <p className="text-sm text-gray-700">
                          갤럭시 S24 Ultra: 최대 <span className="font-bold text-[#EA002C]">500,000원</span>
                        </p>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 검색 결과 없음 */}
        {results.length === 0 && query && !isLoading && (
          <div className="backdrop-blur-sm bg-white/90 rounded-3xl shadow-lg border border-gray-200/50 p-16 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">검색 결과가 없습니다</h3>
            <p className="text-gray-600">다른 검색어를 입력해보세요</p>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
