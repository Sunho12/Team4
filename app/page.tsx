'use client'

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"

export default function Home() {
  const [crewCount, setCrewCount] = useState(1245)

  useEffect(() => {
    const interval = setInterval(() => {
      setCrewCount(prev => prev + Math.floor(Math.random() * 3))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* 글로벌 배경 그라데이션 */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-50/30 via-transparent to-purple-50/20 pointer-events-none z-0"
           style={{ backgroundColor: '#F8F9FA' }}></div>

      {/* 헤더 (Premium Navigation) */}
      <header className="relative z-20 bg-white/80 backdrop-blur-md border-b border-gray-200/50 py-4 px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* 로고 */}
          <div className="w-[140px]">
            <Image
              src="/t-bridge-logo-main.png"
              alt="T-Bridge Logo"
              width={140}
              height={42}
              priority
              className="object-contain"
            />
          </div>

          {/* 우측 메뉴 */}
          <nav className="flex gap-8">
            <button className="text-sm text-[#666] hover:text-[#EA002C] font-medium transition-colors duration-200">
              매장 찾기
            </button>
            <button className="text-sm text-[#666] hover:text-[#EA002C] font-medium transition-colors duration-200">
              공지사항
            </button>
          </nav>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 flex flex-col relative z-10">
        {/* 히어로 섹션 - 타이틀 */}
        <div className="py-16 text-center">
          <h1 className="text-[32px] font-bold text-[#222] mb-3 leading-tight">
            설명은 줄이고 이해는 깊게,<br/>고객님의 시간을 아껴주는 T-Bridge
          </h1>
          <p className="text-[16px] font-medium text-[#444]">
            고객님을 위한 최적의 가이드, T-Bridge
          </p>
        </div>

        {/* 하이엔드 글래스모피즘 Split View */}
        <div className="flex-1 grid md:grid-cols-2 grid-cols-1 gap-0 px-8 pb-16">
          {/* 왼쪽 - 고객용 카드 */}
          <Link
            href="/chat"
            className="group relative flex items-center justify-center p-8 transition-all duration-300"
          >
            {/* 하이엔드 글래스모피즘 카드 */}
            <div className="relative w-full max-w-md">
              <div
                className="backdrop-blur-[20px] bg-white/80 rounded-3xl p-12 shadow-2xl border border-white/20 group-hover:-translate-y-2 transition-all duration-300"
                style={{
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.06)'
                }}
              >
                {/* 3D 스타일 아이콘 */}
                <div className="mb-10 flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#EA002C] to-[#FF7A00] rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-3xl p-10 shadow-xl border border-gray-100">
                      <svg className="w-20 h-20 text-[#EA002C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 텍스트 */}
                <div className="text-center space-y-4">
                  <p className="text-xs text-[#999] font-semibold tracking-widest uppercase">For Customer</p>
                  <h3 className="text-2xl font-bold text-[#222]">
                    T월드 연결하기
                  </h3>
                  <p className="text-[15px] text-[#555] leading-relaxed">
                    고객님의 어려움을 들려주세요.<br/>
                    해결까지 자연스럽게 이어드립니다.
                  </p>

                  {/* SK Red to Orange 그라데이션 버튼 */}
                  <div className="pt-6">
                    <div
                      className="inline-flex items-center gap-2 px-10 py-4 rounded-full font-semibold text-white shadow-lg group-hover:shadow-2xl group-hover:-translate-y-1 transition-all duration-300"
                      style={{
                        background: 'linear-gradient(135deg, #EA002C 0%, #FF7A00 100%)'
                      }}
                    >
                      상담 예약 및 현황 확인
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 배경 장식 */}
            <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-[#EA002C]/10 to-[#FF7A00]/10 rounded-full blur-3xl"></div>
          </Link>

          {/* 오른쪽 - 대리점용 카드 */}
          <Link
            href="/auth/login"
            className="group relative flex items-center justify-center p-8 transition-all duration-300"
          >
            {/* 하이엔드 글래스모피즘 카드 */}
            <div className="relative w-full max-w-md">
              <div
                className="backdrop-blur-[20px] bg-white/80 rounded-3xl p-12 shadow-2xl border border-white/20 group-hover:-translate-y-2 transition-all duration-300"
                style={{
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.06)'
                }}
              >
                {/* 3D 스타일 아이콘 */}
                <div className="mb-10 flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#4B0082] rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-3xl p-10 shadow-xl border border-gray-100">
                      <svg className="w-20 h-20 text-[#4B0082]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 텍스트 */}
                <div className="text-center space-y-4">
                  <p className="text-xs text-[#999] font-semibold tracking-widest uppercase">For Crew</p>
                  <h3 className="text-2xl font-bold text-[#222]">
                    스마트 상담 시작
                  </h3>
                  <p className="text-[15px] text-[#555] leading-relaxed">
                    에이닷과 함께<br/>
                    고객 맞춤 상담을 준비해보세요
                  </p>

                  {/* Deep Purple 버튼 */}
                  <div className="pt-6">
                    <div
                      className="inline-flex items-center gap-2 px-10 py-4 rounded-full font-semibold text-white shadow-lg group-hover:shadow-2xl group-hover:-translate-y-1 transition-all duration-300"
                      style={{
                        backgroundColor: '#4B0082'
                      }}
                    >
                      스마트 대시보드 확인
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 배경 장식 */}
            <div className="absolute top-20 right-20 w-64 h-64 bg-[#4B0082]/10 rounded-full blur-3xl"></div>
          </Link>
        </div>

        {/* 실시간 상태바 (컴팩트) */}
        <div className="relative z-20 bg-gradient-to-r from-gray-800 to-gray-900 text-white py-3 text-center border-t border-gray-700/50">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <p className="text-sm font-medium text-gray-200">
              현재 <span className="text-emerald-400 font-bold mx-1">{crewCount.toLocaleString()}</span>명의 크루가 스마트 상담을 진행 중입니다
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
