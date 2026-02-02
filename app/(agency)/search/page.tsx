'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, User, Phone, Calendar, TrendingUp, MessageSquare, Home, FileText, Bell, Settings, Folder, LogOut } from 'lucide-react'
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
  const [selectedNotice, setSelectedNotice] = useState<any>(null)
  const [noticeFilter, setNoticeFilter] = useState('all')
  const [noticeSearchQuery, setNoticeSearchQuery] = useState('')

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

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      router.push('/auth/login?mode=agency')
      router.refresh()
    } catch (error) {
      console.error('Logout failed:', error)
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
    setShowDetail(false)

    try {
      const response = await fetch(`/api/agency/search?q=${encodeURIComponent(query)}`)

      if (response.ok) {
        const data = await response.json()

        // 실제 검색 결과 사용, 더미 값으로 누락된 필드 채우기
        const enrichedResults = data.customers.map((customer: any, index: number) => ({
          ...customer,
          // 실제 데이터가 없으면 더미 값 사용
          customer_birth: customer.customer_birth || (index === 0 ? '1990.05.20' : '1985.03.15'),
          plan_name: customer.plan_name || (index === 0 ? '5GX 프라임플러스' : '5G 프리미어 에센셜'),
          plan_price: customer.plan_price || (index === 0 ? 89000 : 75000),
          bundle_type: customer.bundle_type || (index === 0 ? '온가족할인' : '유무선 결합'),
          device_model: customer.device_model || (index === 0 ? '아이폰 15 Pro' : 'Galaxy S24 Ultra')
        }))

        setResults(enrichedResults)
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

  // 전체 공지사항 데이터
  const allNotices = [
    {
      id: 1,
      category: '중요',
      title: '[중요] 2월 단말기 할부 이율 변경 안내',
      date: '2026.02.01',
      views: 1245,
      content: `2월부터 단말기 할부 이율이 변경됩니다.\n\n[주요 변경 내용]\n• 기존: 연 5.4% → 변경: 연 5.9%\n• 적용 시점: 2026년 2월 1일부터\n• 기존 계약 고객은 영향 없음\n\n자세한 내용은 정책 센터를 참고해주세요.`,
      important: true
    },
    {
      id: 2,
      category: '시스템',
      title: '아이폰 17 시리즈 사전예약 시작',
      date: '2026.01.30',
      views: 892,
      content: `아이폰 17 시리즈 사전예약이 시작되었습니다.\n\n[예약 기간]\n2026년 2월 1일 ~ 2월 7일\n\n[출시 모델]\n• iPhone 17 Pro Max\n• iPhone 17 Pro\n• iPhone 17`,
      important: false
    },
    {
      id: 3,
      category: '정책변경',
      title: '5G 요금제 신규 출시 안내',
      date: '2026.01.28',
      views: 756,
      content: `새로운 5G 요금제가 출시되었습니다.\n\n5GX 슬림: 월 49,000원\n데이터 20GB + 속도제어 3Mbps`,
      important: false
    },
    {
      id: 4,
      category: '시스템',
      title: '고객 상담 시스템 업데이트 공지',
      date: '2026.01.25',
      views: 634,
      content: `고객 상담 시스템이 업데이트되었습니다.\n\n[주요 개선사항]\n• AI 추천 기능 강화\n• 검색 속도 개선\n• UI/UX 최적화`,
      important: false
    },
    {
      id: 5,
      category: '중요',
      title: '[필독] 개인정보 보호 정책 업데이트',
      date: '2026.01.20',
      views: 1456,
      content: `개인정보 보호 정책이 업데이트되었습니다.\n\n모든 직원은 필독 후 서명해주시기 바랍니다.`,
      important: true
    },
    {
      id: 6,
      category: '정책변경',
      title: '공시지원금 정책 변경 안내',
      date: '2026.01.15',
      views: 1123,
      content: `2월부터 공시지원금 정책이 일부 변경됩니다.\n\n자세한 내용은 정책 센터를 확인해주세요.`,
      important: false
    },
  ]

  // 필터링된 공지사항
  const filteredNotices = allNotices.filter(notice => {
    const matchesFilter = noticeFilter === 'all' ||
      (noticeFilter === 'important' && notice.important) ||
      (noticeFilter === 'system' && notice.category === '시스템') ||
      (noticeFilter === 'policy' && notice.category === '정책변경')

    const matchesSearch = notice.title.toLowerCase().includes(noticeSearchQuery.toLowerCase()) ||
      notice.content.toLowerCase().includes(noticeSearchQuery.toLowerCase())

    return matchesFilter && matchesSearch
  })

  // 정책 센터 데이터
  const devicePolicies = [
    { device: '아이폰 15 Pro Max', subsidy: 550000, installment: '5.9%', period: 24, changed: true },
    { device: '아이폰 15 Pro', subsidy: 520000, installment: '5.9%', period: 24, changed: true },
    { device: '갤럭시 S24 Ultra', subsidy: 500000, installment: '5.9%', period: 24, changed: false },
    { device: '갤럭시 S24+', subsidy: 450000, installment: '5.9%', period: 24, changed: false },
    { device: '갤럭시 Z Fold5', subsidy: 480000, installment: '5.9%', period: 24, changed: false },
  ]

  const servicePolicies = [
    { service: 'T우주 패스 All', price: 9900, description: 'VOD, 뮤직, 책 무제한', changed: false },
    { service: 'T우주 패스 Life', price: 6600, description: 'VOD, 뮤직 무제한', changed: false },
    { service: '멜론 이용권', price: 6600, description: '1개월 무료체험', changed: false },
    { service: 'wavve 베이직', price: 7900, description: '실시간 + VOD', changed: false },
  ]

  const subsidyPolicies = [
    { device: '아이폰 15 Pro Max', public: 550000, additional: 200000, total: 750000, changed: true },
    { device: '아이폰 15 Pro', public: 520000, additional: 180000, total: 700000, changed: true },
    { device: '갤럭시 S24 Ultra', public: 500000, additional: 200000, total: 700000, changed: false },
    { device: '갤럭시 S24+', public: 450000, additional: 150000, total: 600000, changed: false },
    { device: '갤럭시 Z Flip5', public: 400000, additional: 150000, total: 550000, changed: false },
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

        {/* 로그아웃 버튼 */}
        <div className="px-4 pb-4">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-white/60 bg-transparent text-white hover:bg-white/15 hover:border-white transition-all duration-300 shadow-lg hover:shadow-xl"
            style={{ fontFamily: "'SK Mobius', 'Apple SD Gothic Neo', sans-serif", fontSize: '12px', fontWeight: 600 }}
          >
            <LogOut className="w-4 h-4" />
            <span>로그아웃</span>
          </button>
        </div>

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
          {activeMenu !== 'search' && activeMenu !== 'home' && (
            <button
              onClick={() => setActiveMenu('search')}
              className="flex items-center gap-2 text-gray-600 hover:text-[#3617CE] mb-4 transition-colors"
              style={{ fontFamily: "'SK Mobius', sans-serif", fontSize: '14px', fontWeight: 600 }}
            >
              ← 뒤로가기 (대시보드)
            </button>
          )}
          <h1
            className="text-5xl font-bold bg-gradient-to-r from-[#3617CE] to-[#5B3FE8] bg-clip-text text-transparent mb-2"
            style={{ fontFamily: "'SK Mobius', sans-serif" }}
          >
            {activeMenu === 'notice' ? '공지사항' : activeMenu === 'policy' ? '정책 센터' : '스마트 AI 대시보드'}
          </h1>
          <p className="text-gray-600">
            {activeMenu === 'notice' ? '중요 공지사항과 업데이트 내용을 확인하세요' :
             activeMenu === 'policy' ? '최신 정책 정보와 변경사항을 확인하세요' :
             '실시간 고객 분석과 AI 기반 상담 지원 시스템'}
          </p>
        </div>

        {/* 공지사항 페이지 */}
        {activeMenu === 'notice' && (
          <>
            {/* 검색 및 필터 */}
            <div className="backdrop-blur-sm bg-white/95 rounded-3xl shadow-lg border border-gray-200/50 p-8 mb-6">
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="공지사항 검색..."
                    value={noticeSearchQuery}
                    onChange={(e) => setNoticeSearchQuery(e.target.value)}
                    className="pl-12 h-12 rounded-xl border-2 border-gray-200 focus:border-[#3617CE]"
                  />
                </div>
              </div>

              {/* 필터 칩 */}
              <div className="flex gap-2">
                {[
                  { id: 'all', label: '전체' },
                  { id: 'important', label: '중요' },
                  { id: 'system', label: '시스템' },
                  { id: 'policy', label: '정책변경' },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setNoticeFilter(filter.id)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      noticeFilter === filter.id
                        ? 'bg-[#3617CE] text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={{ fontFamily: "'SK Mobius', sans-serif" }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 공지사항 테이블 */}
            <div className="backdrop-blur-sm bg-white/95 rounded-3xl shadow-lg border border-gray-200/50 p-8">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-4 px-4 text-sm font-bold text-gray-700" style={{ fontFamily: "'SK Mobius', sans-serif" }}>
                        카테고리
                      </th>
                      <th className="text-left py-4 px-4 text-sm font-bold text-gray-700" style={{ fontFamily: "'SK Mobius', sans-serif" }}>
                        제목
                      </th>
                      <th className="text-center py-4 px-4 text-sm font-bold text-gray-700" style={{ fontFamily: "'SK Mobius', sans-serif" }}>
                        날짜
                      </th>
                      <th className="text-center py-4 px-4 text-sm font-bold text-gray-700" style={{ fontFamily: "'SK Mobius', sans-serif" }}>
                        조회수
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNotices.map((notice) => (
                      <tr
                        key={notice.id}
                        onClick={() => setSelectedNotice(notice)}
                        className="border-b border-gray-200 hover:bg-[#F8F9FA] transition-colors cursor-pointer"
                      >
                        <td className="py-4 px-4">
                          <Badge
                            className={`${
                              notice.important
                                ? 'bg-[#EA002C] text-white'
                                : notice.category === '시스템'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-500 text-white'
                            }`}
                          >
                            {notice.category}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`text-gray-900 ${notice.important ? 'font-bold' : 'font-medium'}`}
                            style={{ fontFamily: "'SK Mobius', sans-serif" }}
                          >
                            {notice.title}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center text-gray-600 text-sm">
                          {notice.date}
                        </td>
                        <td className="py-4 px-4 text-center text-gray-600 text-sm">
                          {notice.views.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 공지사항 상세 슬라이드 오버 */}
            {selectedNotice && (
              <div
                className="fixed inset-0 bg-black/50 z-50 flex justify-end"
                onClick={() => setSelectedNotice(null)}
              >
                <div
                  className="w-[60%] bg-white h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300"
                  onClick={(e) => e.stopPropagation()}
                  style={{ fontFamily: "'SK Mobius', sans-serif" }}
                >
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <Badge
                          className={`mb-4 ${
                            selectedNotice.important
                              ? 'bg-[#EA002C] text-white'
                              : selectedNotice.category === '시스템'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-500 text-white'
                          }`}
                        >
                          {selectedNotice.category}
                        </Badge>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4" style={{ letterSpacing: '-0.02em', lineHeight: 1.4 }}>
                          {selectedNotice.title}
                        </h2>
                        <div className="flex gap-6 text-sm text-gray-600">
                          <span>작성일: {selectedNotice.date}</span>
                          <span>조회수: {selectedNotice.views.toLocaleString()}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedNotice(null)}
                        className="text-gray-400 hover:text-gray-600 text-3xl font-light"
                      >
                        ×
                      </button>
                    </div>

                    <div className="border-t-2 border-gray-200 pt-6">
                      <div
                        className="text-gray-800 whitespace-pre-wrap text-base leading-relaxed"
                        style={{ letterSpacing: '0.02em', lineHeight: 1.8 }}
                      >
                        {selectedNotice.content}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* 정책 센터 페이지 */}
        {activeMenu === 'policy' && (
          <>
            {/* 서브 내비게이션 */}
            <div className="flex gap-4 mb-6">
              {[
                { id: 'device', label: '단말기 정책' },
                { id: 'service', label: '부가서비스' },
                { id: 'subsidy', label: '보조금/공시지원금' },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  onClick={() => setActivePolicy(tab.id)}
                  className={`flex-1 h-14 text-lg font-bold ${
                    activePolicy === tab.id
                      ? 'bg-[#3617CE] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                  style={{ fontFamily: "'SK Mobius', sans-serif", borderRadius: '12px' }}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* AI 요약 박스 */}
            <div
              className="backdrop-blur-sm bg-gradient-to-br from-[#3617CE]/10 to-[#5B3FE8]/10 rounded-3xl border-2 border-[#3617CE]/30 p-6 mb-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#3617CE] rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#3617CE]" style={{ fontFamily: "'SK Mobius', sans-serif" }}>
                  AI가 분석한 이번 주 핵심 변경점
                </h3>
              </div>
              <div className="space-y-2 text-gray-800" style={{ fontFamily: "'SK Mobius', sans-serif", fontSize: '15px', lineHeight: 1.8 }}>
                {activePolicy === 'device' && (
                  <>
                    <p>• 단말기 할부 이율이 연 5.4%에서 5.9%로 0.5%p 인상되었습니다.</p>
                    <p>• 아이폰 15 Pro 시리즈 공시지원금이 최대 5만원 인상되었습니다.</p>
                    <p>• 24개월 선택약정 할인율은 25%로 유지됩니다.</p>
                  </>
                )}
                {activePolicy === 'service' && (
                  <>
                    <p>• T우주 패스 All 요금이 9,900원으로 동결되었습니다.</p>
                    <p>• 멜론 이용권 1개월 무료체험 프로모션이 진행 중입니다.</p>
                    <p>• wavve 베이직 요금은 7,900원으로 유지됩니다.</p>
                  </>
                )}
                {activePolicy === 'subsidy' && (
                  <>
                    <p>• 아이폰 15 Pro Max 공시지원금이 550,000원으로 인상되었습니다.</p>
                    <p>• 갤럭시 S24 Ultra 공시지원금은 500,000원으로 유지됩니다.</p>
                    <p>• 추가지원금은 대리점별로 최대 200,000원까지 가능합니다.</p>
                  </>
                )}
              </div>
            </div>

            {/* 정책 데이터 테이블 */}
            <div className="backdrop-blur-sm bg-white/95 rounded-3xl shadow-lg border border-gray-200/50 p-8">
              <div className="overflow-x-auto">
                {activePolicy === 'device' && (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="text-left py-4 px-4 text-sm font-bold text-gray-700" style={{ fontFamily: "'SK Mobius', sans-serif" }}>
                          단말기 모델
                        </th>
                        <th className="text-center py-4 px-4 text-sm font-bold text-gray-700" style={{ fontFamily: "'SK Mobius', sans-serif" }}>
                          공시지원금
                        </th>
                        <th className="text-center py-4 px-4 text-sm font-bold text-gray-700" style={{ fontFamily: "'SK Mobius', sans-serif" }}>
                          할부 이율
                        </th>
                        <th className="text-center py-4 px-4 text-sm font-bold text-gray-700" style={{ fontFamily: "'SK Mobius', sans-serif" }}>
                          할부 기간
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {devicePolicies.map((policy, index) => (
                        <tr key={index} className="border-b border-gray-200 hover:bg-[#F8F9FA] transition-colors">
                          <td className="py-4 px-4 font-semibold text-gray-900" style={{ fontFamily: "'SK Mobius', sans-serif" }}>
                            {policy.device}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`font-bold ${policy.changed ? 'text-[#EA002C]' : 'text-gray-900'}`}
                              style={{ fontFamily: "'SK Mobius', sans-serif" }}
                            >
                              {policy.subsidy.toLocaleString()}원
                            </span>
                            {policy.changed && <span className="ml-2 text-xs text-[#EA002C]">↑</span>}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className="font-bold text-[#EA002C]"
                              style={{ fontFamily: "'SK Mobius', sans-serif" }}
                            >
                              연 {policy.installment}
                            </span>
                            <span className="ml-2 text-xs text-[#EA002C]">↑ 0.5%p</span>
                          </td>
                          <td className="py-4 px-4 text-center text-gray-900 font-semibold">
                            {policy.period}개월
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activePolicy === 'service' && (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="text-left py-4 px-4 text-sm font-bold text-gray-700" style={{ fontFamily: "'SK Mobius', sans-serif" }}>
                          서비스명
                        </th>
                        <th className="text-center py-4 px-4 text-sm font-bold text-gray-700" style={{ fontFamily: "'SK Mobius', sans-serif" }}>
                          월 요금
                        </th>
                        <th className="text-left py-4 px-4 text-sm font-bold text-gray-700" style={{ fontFamily: "'SK Mobius', sans-serif" }}>
                          설명
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {servicePolicies.map((policy, index) => (
                        <tr key={index} className="border-b border-gray-200 hover:bg-[#F8F9FA] transition-colors">
                          <td className="py-4 px-4 font-semibold text-gray-900" style={{ fontFamily: "'SK Mobius', sans-serif" }}>
                            {policy.service}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`font-bold ${policy.changed ? 'text-[#EA002C]' : 'text-gray-900'}`}
                              style={{ fontFamily: "'SK Mobius', sans-serif" }}
                            >
                              {policy.price.toLocaleString()}원
                            </span>
                          </td>
                          <td className="py-4 px-4 text-gray-700">
                            {policy.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activePolicy === 'subsidy' && (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="text-left py-4 px-4 text-sm font-bold text-gray-700" style={{ fontFamily: "'SK Mobius', sans-serif" }}>
                          단말기 모델
                        </th>
                        <th className="text-center py-4 px-4 text-sm font-bold text-gray-700" style={{ fontFamily: "'SK Mobius', sans-serif" }}>
                          공시지원금
                        </th>
                        <th className="text-center py-4 px-4 text-sm font-bold text-gray-700" style={{ fontFamily: "'SK Mobius', sans-serif" }}>
                          추가지원금
                        </th>
                        <th className="text-center py-4 px-4 text-sm font-bold text-gray-700" style={{ fontFamily: "'SK Mobius', sans-serif" }}>
                          총 지원금
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {subsidyPolicies.map((policy, index) => (
                        <tr key={index} className="border-b border-gray-200 hover:bg-[#F8F9FA] transition-colors">
                          <td className="py-4 px-4 font-semibold text-gray-900" style={{ fontFamily: "'SK Mobius', sans-serif" }}>
                            {policy.device}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`font-bold ${policy.changed ? 'text-[#EA002C]' : 'text-gray-900'}`}
                              style={{ fontFamily: "'SK Mobius', sans-serif" }}
                            >
                              {policy.public.toLocaleString()}원
                            </span>
                            {policy.changed && <span className="ml-2 text-xs text-[#EA002C]">↑</span>}
                          </td>
                          <td className="py-4 px-4 text-center text-gray-900 font-semibold">
                            {policy.additional.toLocaleString()}원
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="font-bold text-[#3617CE]" style={{ fontFamily: "'SK Mobius', sans-serif", fontSize: '16px' }}>
                              {policy.total.toLocaleString()}원
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}

        {/* 기존 검색 페이지 (search 또는 home 메뉴일 때만 표시) */}
        {(activeMenu === 'search' || activeMenu === 'home') && (
          <>
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

        {/* 검색 결과 리스트 (테이블) */}
        {results.length > 0 && !showDetail && (
          <div
            className="backdrop-blur-sm bg-white/95 rounded-3xl shadow-lg border border-gray-200/50 p-8 mb-6 animate-in fade-in duration-500"
            style={{ fontFamily: "'Moebius', 'Inter', sans-serif" }}
          >
            {/* 검색 결과 헤더 */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">검색 결과</h2>
              <p className="text-[#3617CE] font-semibold">
                총 <span className="text-[#EA002C]">{results.length}</span>건이 조회되었습니다
              </p>
            </div>

            {/* 검색 결과 테이블 */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700">이름</th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700">생년월일</th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700">전화번호</th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700">가입된 요금제</th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700">결합 여부</th>
                    <th className="text-center py-4 px-4 text-sm font-bold text-gray-700">상세 정보</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((customer, index) => (
                    <tr
                      key={customer.id || index}
                      className="border-b border-gray-200 hover:bg-[#F8F9FA] transition-colors duration-200 cursor-pointer"
                      onClick={() => router.push(`/customers/${customer.id}`)}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#3617CE] to-[#5B3FE8] rounded-full flex items-center justify-center text-white font-bold">
                            {customer.customer_name?.charAt(0) || 'N'}
                          </div>
                          <span className="text-gray-900 font-semibold">{customer.customer_name || '-'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-700" style={{ fontFamily: 'Inter, Roboto' }}>
                        {customer.customer_birth || '-'}
                      </td>
                      <td className="py-4 px-4 text-gray-700" style={{ fontFamily: 'Inter, Roboto' }}>
                        {customer.customer_phone || '-'}
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-gray-900 font-semibold text-sm">{customer.plan_name || '-'}</p>
                          <p className="text-gray-500 text-xs" style={{ fontFamily: 'Inter, Roboto' }}>
                            월 {customer.plan_price?.toLocaleString() || '0'}원
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className="bg-gradient-to-r from-[#FF7A00] to-[#FFA500] text-white px-3 py-1">
                          {customer.bundle_type || '없음'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/customers/${customer.id}`)
                          }}
                          className="border-2 border-[#EA002C] text-[#EA002C] bg-white hover:bg-[#EA002C] hover:text-white transition-all duration-300 px-4 py-2 rounded-lg font-semibold text-sm"
                        >
                          상세 정보 보기
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
          </>
        )}
        </div>
      </div>
    </div>
  )
}
