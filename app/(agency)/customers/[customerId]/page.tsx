'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { format, differenceInDays } from 'date-fns'
import { User, Phone, Calendar, Smartphone, Wifi, CreditCard, ArrowLeft, TrendingUp, MessageSquare, Target, Lightbulb, AlertCircle, CheckCircle, X, Tag } from 'lucide-react'
import Link from 'next/link'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

interface Conversation {
  id: string
  started_at: string
  ended_at: string | null
  status: 'active' | 'ended'
  messages: Message[]
  summary?: {
    summary: string
    category: string
    keywords?: string[]
    sentiment: 'positive' | 'neutral' | 'negative'
  }
}

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const customerId = params.customerId as string

  const [customer, setCustomer] = useState<any>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [consultationPoints, setConsultationPoints] = useState<string[]>([])
  const [predictedServices, setPredictedServices] = useState<any[]>([])
  const [insights, setInsights] = useState({
    churnRate: 0,
    deviceChangeRate: 0,
    planChangeRate: 0,
    complaintRate: 0,
    overallScore: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [showUrgentAlert, setShowUrgentAlert] = useState(false)
  const [latestConsultation, setLatestConsultation] = useState<string>('')
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (authChecked) {
      loadAllData()
    }
  }, [customerId, authChecked])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')

      if (!response.ok) {
        router.push('/auth/login?mode=agency&returnUrl=/customers/' + customerId)
        return
      }

      const data = await response.json()
      const userRole = data.user.role

      if (userRole !== 'admin' && userRole !== 'agency_staff') {
        alert('권한이 없습니다. 대리점 직원만 접근할 수 있습니다.')
        router.push('/search')
        return
      }

      setAuthChecked(true)
    } catch (error) {
      router.push(`/auth/login?mode=agency&returnUrl=/customers/${customerId}`)
    }
  }

  const loadAllData = async () => {
    setIsLoading(true)

    try {
      // 고객 기본 정보 로드
      await loadCustomerData()

      // 상담 내역 로드
      await loadConversations()

      // AI 분석 자동 실행
      await analyzeCustomer()

      // 긴급 상담 브리핑 체크
      checkUrgentConsultation()
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCustomerData = async () => {
    try {
      const response = await fetch(`/api/agency/customer/${customerId}`)
      if (response.ok) {
        const data = await response.json()
        setCustomer(data.session)
      }
    } catch (error) {
      console.error('Failed to load customer data:', error)
    }
  }

  const loadConversations = async () => {
    try {
      // Supabase에서 conversations와 messages 가져오기
      const response = await fetch(`/api/agency/customer/${customerId}/conversations`)
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)

      // 더미 데이터 (API 없을 경우)
      const dummyConversations: Conversation[] = [
        {
          id: '1',
          started_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          ended_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
          status: 'ended',
          messages: [
            { id: 'm1', role: 'user', content: '요금제 변경 상담 요청합니다.', created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
          ],
          summary: {
            summary: '고객이 데이터 사용량 증가로 인한 요금제 변경 상담을 요청함',
            category: '요금제 변경',
            sentiment: 'positive'
          }
        },
        {
          id: '2',
          started_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          ended_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
          status: 'ended',
          messages: [
            { id: 'm2', role: 'user', content: '단말기 할부 문의드립니다.', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
          ],
          summary: {
            summary: '단말기 할부 이율 및 잔여 기간에 대한 문의',
            category: '단말기',
            sentiment: 'neutral'
          }
        },
        {
          id: '3',
          started_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          ended_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
          status: 'ended',
          messages: [
            { id: 'm3', role: 'user', content: '청구서가 이해가 안 됩니다.', created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() }
          ],
          summary: {
            summary: '청구서 내역에 대한 문의 및 요금 설명 요청',
            category: '청구/요금',
            sentiment: 'negative'
          }
        }
      ]
      setConversations(dummyConversations)
    }
  }

  const checkUrgentConsultation = () => {
    // 최근 3일 이내 상담 내역 확인
    const recentConversations = conversations.filter(conv => {
      const daysDiff = differenceInDays(new Date(), new Date(conv.started_at))
      return daysDiff <= 3
    })

    if (recentConversations.length > 0) {
      // 가장 최근 상담의 요약을 가져옴
      const latest = recentConversations[0]
      if (latest.summary) {
        setLatestConsultation(latest.summary.summary)
      }
      setShowUrgentAlert(true)
    }
  }

  const analyzeCustomer = async () => {
    try {
      // AI 분석 API 호출
      const response = await fetch('/api/agency/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: customerId }),
      })

      if (response.ok) {
        const data = await response.json()
        // 실제 API 응답 처리
      }
    } catch (error) {
      console.error('Failed to analyze customer:', error)
    }

    // 더미 데이터 (로직 확정 전)
    setInsights({
      churnRate: Math.floor(Math.random() * 40) + 20, // 20-60
      deviceChangeRate: Math.floor(Math.random() * 50) + 40, // 40-90
      planChangeRate: Math.floor(Math.random() * 40) + 30, // 30-70
      complaintRate: Math.floor(Math.random() * 30) + 10, // 10-40
      overallScore: 85
    })

    // 상담 개선 포인트 생성
    setConsultationPoints([
      '지난번 대기 시간에 대한 불만이 있었으니 빠른 응대가 필요합니다.',
      '요금제 변경에 대한 관심이 높아 데이터 무제한 요금제를 우선 제안하세요.',
      '청구서 내역 설명 시 더 상세하고 명확한 안내가 필요합니다.'
    ])

    // 예상 필요 서비스 생성
    setPredictedServices([
      {
        title: '데이터 무제한 요금제 전환',
        description: '최근 데이터 사용량이 급증하여 무제한 요금제가 적합합니다.',
        priority: 'high',
        confidence: 92
      },
      {
        title: '단말기 교체 프로모션 안내',
        description: '할부 잔여 기간이 얼마 남지 않아 신규 단말기 출시 시 교체 제안이 효과적입니다.',
        priority: 'medium',
        confidence: 78
      }
    ])
  }

  const isRecentConversation = (date: string) => {
    const daysDiff = differenceInDays(new Date(), new Date(date))
    return daysDiff <= 3
  }

  const getSentimentColor = (sentiment: 'positive' | 'neutral' | 'negative') => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-500'
      case 'neutral':
        return 'bg-gray-500'
      case 'negative':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getSentimentText = (sentiment: 'positive' | 'neutral' | 'negative') => {
    switch (sentiment) {
      case 'positive':
        return '긍정적'
      case 'neutral':
        return '중립적'
      case 'negative':
        return '부정적'
      default:
        return '중립적'
    }
  }

  if (isLoading) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(10px)',
          fontFamily: "'SK Mobius', -apple-system, BlinkMacSystemFont, sans-serif"
        }}
      >

        <div className="flex flex-col items-center justify-center relative z-10">
          {/* SVG 중앙의 작은 다리와 불꽃놀이 */}
          <svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
            <defs>
              {/* SK Red to Orange 그라데이션 */}
              <linearGradient id="bridgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EA002C" />
                <stop offset="50%" stopColor="#F54A2E" />
                <stop offset="100%" stopColor="#FF7A00" />
              </linearGradient>

              {/* 불꽃 필터 효과 */}
              <filter id="fireworkGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* 불꽃놀이 배경 (Soft Fireworks) */}
            <g id="fireworks">
              {/* 불꽃 1 - 핑크 */}
              <g opacity="0">
                <circle cx="120" cy="80" r="3" fill="#FFB6C1" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;30;50" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0.3;0" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="110" cy="70" r="2" fill="#FFD4E5" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;20;35" dur="2s" repeatCount="indefinite" begin="0.1s" />
                  <animate attributeName="opacity" values="1;0.4;0" dur="2s" repeatCount="indefinite" begin="0.1s" />
                </circle>
                <circle cx="130" cy="75" r="2" fill="#FFC0CB" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;25;40" dur="2s" repeatCount="indefinite" begin="0.2s" />
                  <animate attributeName="opacity" values="1;0.3;0" dur="2s" repeatCount="indefinite" begin="0.2s" />
                </circle>
                <animate attributeName="opacity" values="0;1;1;0" dur="2s" repeatCount="indefinite" />
              </g>

              {/* 불꽃 2 - 오렌지 */}
              <g opacity="0">
                <circle cx="280" cy="100" r="3" fill="#FFB88C" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;35;55" dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0.3;0" dur="2.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="270" cy="90" r="2" fill="#FFD4A3" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;25;40" dur="2.5s" repeatCount="indefinite" begin="0.15s" />
                  <animate attributeName="opacity" values="1;0.4;0" dur="2.5s" repeatCount="indefinite" begin="0.15s" />
                </circle>
                <circle cx="290" cy="95" r="2" fill="#FFA500" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;28;45" dur="2.5s" repeatCount="indefinite" begin="0.25s" />
                  <animate attributeName="opacity" values="1;0.3;0" dur="2.5s" repeatCount="indefinite" begin="0.25s" />
                </circle>
                <animate attributeName="opacity" values="0;1;1;0" dur="2.5s" repeatCount="indefinite" begin="0.8s" />
              </g>

              {/* 불꽃 3 - 연보라 */}
              <g opacity="0">
                <circle cx="200" cy="60" r="3" fill="#D8BFD8" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;32;48" dur="2.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0.3;0" dur="2.2s" repeatCount="indefinite" />
                </circle>
                <circle cx="190" cy="50" r="2" fill="#E6D5E6" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;22;38" dur="2.2s" repeatCount="indefinite" begin="0.12s" />
                  <animate attributeName="opacity" values="1;0.4;0" dur="2.2s" repeatCount="indefinite" begin="0.12s" />
                </circle>
                <circle cx="210" cy="55" r="2" fill="#C8A2C8" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;26;42" dur="2.2s" repeatCount="indefinite" begin="0.18s" />
                  <animate attributeName="opacity" values="1;0.3;0" dur="2.2s" repeatCount="indefinite" begin="0.18s" />
                </circle>
                <animate attributeName="opacity" values="0;1;1;0" dur="2.2s" repeatCount="indefinite" begin="1.5s" />
              </g>

              {/* 불꽃 4 - 골드 */}
              <g opacity="0">
                <circle cx="320" cy="70" r="3" fill="#FFD700" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;28;46" dur="2.3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0.3;0" dur="2.3s" repeatCount="indefinite" />
                </circle>
                <circle cx="310" cy="65" r="2" fill="#FFE55C" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;20;36" dur="2.3s" repeatCount="indefinite" begin="0.1s" />
                  <animate attributeName="opacity" values="1;0.4;0" dur="2.3s" repeatCount="indefinite" begin="0.1s" />
                </circle>
                <circle cx="330" cy="68" r="2" fill="#FFEB3B" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;24;40" dur="2.3s" repeatCount="indefinite" begin="0.2s" />
                  <animate attributeName="opacity" values="1;0.3;0" dur="2.3s" repeatCount="indefinite" begin="0.2s" />
                </circle>
                <animate attributeName="opacity" values="0;1;1;0" dur="2.3s" repeatCount="indefinite" begin="2.3s" />
              </g>

              {/* 불꽃 5 - 피치 */}
              <g opacity="0">
                <circle cx="80" cy="120" r="3" fill="#FFDAB9" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;30;50" dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0.3;0" dur="2.4s" repeatCount="indefinite" />
                </circle>
                <circle cx="72" cy="110" r="2" fill="#FFE4C4" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;22;38" dur="2.4s" repeatCount="indefinite" begin="0.13s" />
                  <animate attributeName="opacity" values="1;0.4;0" dur="2.4s" repeatCount="indefinite" begin="0.13s" />
                </circle>
                <circle cx="88" cy="115" r="2" fill="#FFCBA4" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;26;44" dur="2.4s" repeatCount="indefinite" begin="0.2s" />
                  <animate attributeName="opacity" values="1;0.3;0" dur="2.4s" repeatCount="indefinite" begin="0.2s" />
                </circle>
                <animate attributeName="opacity" values="0;1;1;0" dur="2.4s" repeatCount="indefinite" begin="3s" />
              </g>
            </g>

            {/* 중앙의 작은 다리 (The Minimal Bridge) */}
            <g id="minimal-bridge">
              {/* 다리 그림자 */}
              <ellipse cx="200" cy="185" rx="90" ry="8" fill="#000000" opacity="0.08"/>

              {/* 메인 아치 */}
              <path
                d="M 110 170 Q 200 130 290 170"
                fill="none"
                stroke="url(#bridgeGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                opacity="0.9"
              />

              {/* 내부 하이라이트 라인 */}
              <path
                d="M 115 168 Q 200 133 285 168"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.5"
              />

              {/* 왼쪽 기둥 */}
              <rect x="108" y="170" width="4" height="15" rx="2" fill="url(#bridgeGradient)" opacity="0.8"/>
              <circle cx="110" cy="170" r="3" fill="url(#bridgeGradient)"/>

              {/* 오른쪽 기둥 */}
              <rect x="288" y="170" width="4" height="15" rx="2" fill="url(#bridgeGradient)" opacity="0.8"/>
              <circle cx="290" cy="170" r="3" fill="url(#bridgeGradient)"/>
            </g>

          </svg>

          {/* 타이포그래피 - Breathing 애니메이션 */}
          <div className="mt-12 text-center px-4">
            <p className="text-[17px] font-normal breathing-text" style={{ letterSpacing: '0.03em', lineHeight: '1.6' }}>
              <span>T-Bridge가 실시간으로 데이터를 </span>
              <span
                style={{
                  color: '#EA002C',
                  fontWeight: 600
                }}
              >
                연결
              </span>
              <span>하고 있습니다.</span>
            </p>
          </div>

          <style jsx>{`
            @keyframes breathing {
              0%, 100% {
                opacity: 0.7;
              }
              50% {
                opacity: 1;
              }
            }

            .breathing-text {
              animation: breathing 3s ease-in-out infinite;
              color: #333333;
            }
          `}</style>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#F8F9FA', fontFamily: "'SK Mobius', sans-serif" }}>
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
    <div className="min-h-screen p-6" style={{ backgroundColor: '#F8F9FA', fontFamily: "'SK Mobius', sans-serif" }}>
      {/* 긴급 상담 브리핑 팝업 */}
      {showUrgentAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-shake"
            style={{ fontFamily: "'SK Mobius', sans-serif" }}
          >
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-[#EA002C] to-[#FF4444] p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">⚠️ 긴급 상담 브리핑</h2>
                  <p className="text-sm text-white/90 mt-1">최근 3일 내 방문 고객</p>
                </div>
              </div>
            </div>

            {/* 내용 */}
            <div className="p-6 space-y-4">
              {/* 최신 상담 내역 */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 border-2 border-orange-200">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-5 h-5 text-orange-600" />
                  <h3 className="text-sm font-bold text-orange-900">최신 상담 내역</h3>
                </div>
                <p className="text-sm text-gray-800 leading-relaxed">
                  {latestConsultation || '상담 내역을 확인할 수 없습니다.'}
                </p>
              </div>

              {/* 불만 지수 */}
              <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-5 border-2 border-red-300">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-[#EA002C]" />
                  <h3 className="text-sm font-bold text-red-900">현재 불만 지수</h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="text-5xl font-bold text-[#EA002C]">
                      {insights.complaintRate}%
                    </div>
                    <p className="text-xs text-red-700 mt-1">AI 분석 기반 불만 확률</p>
                  </div>
                  <div className="w-24 h-24">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#FFE5E5"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#EA002C"
                        strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - insights.complaintRate / 100)}`}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                        className="transition-all duration-1000"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* 주의사항 */}
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-800 leading-relaxed">
                    <span className="font-bold">주의:</span> 최근 방문 이력이 있는 고객입니다. 이전 상담 내용을 숙지하고 신중하게 응대해주세요.
                  </p>
                </div>
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="p-6 pt-0">
              <button
                onClick={() => setShowUrgentAlert(false)}
                className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all hover:scale-105 hover:shadow-xl"
                style={{
                  background: 'linear-gradient(135deg, #EA002C 0%, #FF4444 100%)',
                  fontFamily: "'SK Mobius', sans-serif"
                }}
              >
                확인 후 상담 시작
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상담 상세 정보 모달 */}
      {selectedConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
            style={{ fontFamily: "'SK Mobius', sans-serif" }}
          >
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-[#3617CE] to-[#5B3FE8] p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <MessageSquare className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">상담 상세 내역</h2>
                    <p className="text-sm text-white/90 mt-1">
                      {format(new Date(selectedConversation.started_at), 'yyyy년 MM월 dd일 HH:mm')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* 카테고리 및 감정 */}
              {selectedConversation.summary && (
                <div className="flex items-center gap-3 mt-4">
                  <Badge variant="outline" className="bg-white/20 text-white border-white/40">
                    {selectedConversation.summary.category}
                  </Badge>
                  <Badge className={`${getSentimentColor(selectedConversation.summary.sentiment)} text-white`}>
                    {getSentimentText(selectedConversation.summary.sentiment)}
                  </Badge>
                </div>
              )}
            </div>

            {/* 카드뉴스 스타일 내용 */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
              {selectedConversation.summary ? (
                <>
                  {/* 카드 1: 상담 카테고리 및 감정 */}
                  <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-8 border-2 border-purple-200 shadow-lg">
                    <div className="text-center mb-6">
                      <div className="inline-block p-4 bg-white rounded-full shadow-md mb-4">
                        <MessageSquare className="w-12 h-12 text-[#3617CE]" />
                      </div>
                      <h3 className="text-3xl font-bold text-gray-900 mb-2">
                        {selectedConversation.summary.category}
                      </h3>
                      <div className="flex items-center justify-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          selectedConversation.summary.sentiment === 'positive' ? 'bg-green-500' :
                          selectedConversation.summary.sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-500'
                        }`}></div>
                        <span className="text-lg font-semibold text-gray-700">
                          {getSentimentText(selectedConversation.summary.sentiment)} 상담
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 카드 2: 상담 요약 */}
                  <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 rounded-3xl p-8 border-2 border-blue-200 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-white rounded-xl shadow-md">
                        <MessageSquare className="w-8 h-8 text-[#3617CE]" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">상담 요약</h3>
                    </div>
                    <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-inner">
                      <p className="text-base text-gray-800 leading-relaxed" style={{ lineHeight: '2' }}>
                        {selectedConversation.summary.summary}
                      </p>
                    </div>
                  </div>

                  {/* 카드 3: 키워드 */}
                  {selectedConversation.summary.keywords && selectedConversation.summary.keywords.length > 0 && (
                    <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-3xl p-8 border-2 border-orange-200 shadow-lg">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-white rounded-xl shadow-md">
                          <Tag className="w-8 h-8 text-[#FF7A00]" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">핵심 키워드</h3>
                      </div>
                      <div className="flex flex-wrap gap-3 justify-center">
                        {selectedConversation.summary.keywords.map((keyword, idx) => (
                          <div
                            key={idx}
                            className="bg-white rounded-2xl px-6 py-4 shadow-md border-2 border-orange-200 hover:scale-105 transition-transform"
                          >
                            <span className="text-lg font-bold bg-gradient-to-r from-[#FF7A00] to-[#FFA500] bg-clip-text text-transparent">
                              #{keyword}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 카드 4: 상담 통계 */}
                  <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-3xl p-8 border-2 border-green-200 shadow-lg">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center bg-white/80 backdrop-blur rounded-2xl p-6 shadow-md">
                        <p className="text-sm font-semibold text-gray-600 mb-2">상담 시작</p>
                        <p className="text-lg font-bold text-gray-900">
                          {format(new Date(selectedConversation.started_at), 'HH:mm')}
                        </p>
                      </div>
                      <div className="text-center bg-white/80 backdrop-blur rounded-2xl p-6 shadow-md">
                        <p className="text-sm font-semibold text-gray-600 mb-2">상담 종료</p>
                        <p className="text-lg font-bold text-gray-900">
                          {selectedConversation.ended_at
                            ? format(new Date(selectedConversation.ended_at), 'HH:mm')
                            : '진행중'}
                        </p>
                      </div>
                      <div className="col-span-2 text-center bg-white/80 backdrop-blur rounded-2xl p-6 shadow-md">
                        <p className="text-sm font-semibold text-gray-600 mb-2">총 메시지</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                          {selectedConversation.messages.length}개
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">요약 정보가 없습니다.</p>
                </div>
              )}
            </div>

            {/* 하단 버튼 */}
            <div className="p-6 pt-0 border-t">
              <button
                onClick={() => setSelectedConversation(null)}
                className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all hover:scale-105 hover:shadow-xl"
                style={{
                  background: 'linear-gradient(135deg, #3617CE 0%, #5B3FE8 100%)',
                  fontFamily: "'SK Mobius', sans-serif"
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0) scale(0.95);
            opacity: 0;
          }
          10% {
            transform: translateX(-5px) scale(0.98);
            opacity: 0.5;
          }
          20% {
            transform: translateX(5px) scale(1);
            opacity: 0.8;
          }
          30% {
            transform: translateX(-5px) scale(1.02);
            opacity: 1;
          }
          40% {
            transform: translateX(5px) scale(1);
          }
          50% {
            transform: translateX(-3px) scale(1);
          }
          60% {
            transform: translateX(3px) scale(1);
          }
          70% {
            transform: translateX(-2px) scale(1);
          }
          80% {
            transform: translateX(2px) scale(1);
          }
          90% {
            transform: translateX(-1px) scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-shake {
          animation: shake 0.8s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* 상단 뒤로가기 */}
        <Link href="/search">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            고객 검색으로 돌아가기
          </Button>
        </Link>

        {/* 1. 고객 기본 정보 섹션 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-8" style={{ borderRadius: '12px' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#3617CE] to-[#5B3FE8] rounded-2xl flex items-center justify-center text-white shadow-lg">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">{customer.customer_name || '이름 없음'}</h1>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-[#3617CE] to-[#5B3FE8] text-white px-4 py-2 text-sm">
              VIP 고객
            </Badge>
          </div>

          {/* 인포그래픽 스타일 정보 그리드 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-4 border border-blue-200/50">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-semibold text-blue-900">생년월일</p>
              </div>
              <p className="text-base font-bold text-blue-900">{customer.birthdate || '정보 없음'}</p>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-2xl p-4 border border-pink-200/50">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-5 h-5 text-pink-600" />
                <p className="text-sm font-semibold text-pink-900">연락처</p>
              </div>
              <p className="text-base font-bold text-pink-900">{customer.customer_phone || '010-0000-0000'}</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-4 border border-green-200/50">
              <div className="flex items-center gap-2 mb-2">
                <Wifi className="w-5 h-5 text-green-600" />
                <p className="text-sm font-semibold text-green-900">결합상품</p>
              </div>
              <div className="flex gap-2">
                {customer.bundle_types && customer.bundle_types.length > 0 ? (
                  customer.bundle_types.map((type: string, idx: number) => (
                    <Badge key={idx} className="bg-green-600 hover:bg-green-700 text-xs">{type}</Badge>
                  ))
                ) : (
                  <span className="text-sm text-gray-600">없음</span>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-4 border border-purple-200/50">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-5 h-5 text-purple-600" />
                <p className="text-sm font-semibold text-purple-900">단말기</p>
              </div>
              <p className="text-sm font-bold text-purple-900">{customer.device_model || '정보 없음'}</p>
              {customer.device_remaining_months && (
                <Badge className="mt-1 bg-purple-600 hover:bg-purple-700 text-xs">
                  잔여 {customer.device_remaining_months}개월
                </Badge>
              )}
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-4 border border-orange-200/50">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-orange-600" />
                <p className="text-sm font-semibold text-orange-900">현재 요금제</p>
              </div>
              <p className="text-base font-bold text-orange-900">{customer.plan_name || '정보 없음'}</p>
              {customer.plan_price && (
                <p className="text-xs text-orange-700 mt-1">월 {customer.plan_price.toLocaleString()}원</p>
              )}
            </div>
          </div>
        </div>

        {/* 벤토 그리드 레이아웃 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* [구획 가] 이전 상담 내역 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-8" style={{ borderRadius: '12px' }}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-[#3617CE]" />
              이전 상담 내역
            </h2>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {conversations.length > 0 ? (
                conversations.map((conv) => {
                  const isRecent = isRecentConversation(conv.started_at)
                  return (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 ${
                        isRecent ? 'border-2 border-[#EA002C]' : 'border border-gray-200'
                      } transition-all hover:shadow-md cursor-pointer hover:scale-[1.02]`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-600 font-medium">
                          {format(new Date(conv.started_at), 'yyyy.MM.dd HH:mm')}
                        </span>
                        {isRecent && (
                          <Badge className="bg-[#EA002C] text-white text-xs">최근</Badge>
                        )}
                        {conv.summary && (
                          <Badge className={`${getSentimentColor(conv.summary.sentiment)} text-white text-xs`}>
                            {getSentimentText(conv.summary.sentiment)}
                          </Badge>
                        )}
                      </div>

                      {conv.summary && (
                        <>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="text-[#3617CE] border-[#3617CE]">
                              {conv.summary.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-800 leading-relaxed" style={{ lineHeight: '1.8' }}>
                            {conv.summary.summary}
                          </p>
                        </>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  상담 내역이 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* [구획 나] 상담 개선 포인트 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-8" style={{ borderRadius: '12px' }}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-[#FF7A00]" />
              상담 개선 포인트
            </h2>

            <div className="space-y-4">
              {consultationPoints.map((point, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 border border-orange-200/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-[#FF7A00] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed pt-1">
                      {point}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <AlertCircle className="w-4 h-4" />
                <span className="font-semibold">AI가 과거 상담 데이터를 분석하여 생성한 추천입니다.</span>
              </div>
            </div>
          </div>

          {/* [구획 다] AI 영업 인사이트 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-8" style={{ borderRadius: '12px' }}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-[#3617CE]" />
              AI 영업 인사이트
            </h2>

            {/* 세미 서클 게이지 - 종합 잠재고객지수 */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-purple-200/50">
              <p className="text-center text-sm font-semibold text-purple-900 mb-4">종합 잠재고객지수</p>

              <div className="relative w-48 h-24 mx-auto mb-4">
                <svg className="w-48 h-24" viewBox="0 0 200 100">
                  {/* 배경 반원 */}
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="20"
                    strokeLinecap="round"
                  />
                  {/* 진행 반원 */}
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="url(#gradient2)"
                    strokeWidth="20"
                    strokeLinecap="round"
                    strokeDasharray={`${Math.PI * 80}`}
                    strokeDashoffset={`${Math.PI * 80 * (1 - insights.overallScore / 100)}`}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3617CE" />
                      <stop offset="100%" stopColor="#5B3FE8" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                  <span className="text-4xl font-bold bg-gradient-to-r from-[#3617CE] to-[#5B3FE8] bg-clip-text text-transparent">
                    {insights.overallScore}
                  </span>
                  <span className="text-xs text-gray-600 font-medium">/ 100점</span>
                </div>
              </div>

              <div className="text-center">
                <Badge className="bg-gradient-to-r from-[#3617CE] to-[#5B3FE8] text-white">
                  기기변경 확률 높음
                </Badge>
              </div>
            </div>

            {/* 세분화 지표 */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">이탈 확률</span>
                  <span className="text-sm font-bold text-gray-900">{insights.churnRate}%</span>
                </div>
                <Progress value={insights.churnRate} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">기기변경 확률</span>
                  <span className="text-sm font-bold text-[#EA002C]">{insights.deviceChangeRate}%</span>
                </div>
                <Progress value={insights.deviceChangeRate} className="h-2" style={{ '--progress-background': '#EA002C' } as any} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">요금제변경 확률</span>
                  <span className="text-sm font-bold text-gray-900">{insights.planChangeRate}%</span>
                </div>
                <Progress value={insights.planChangeRate} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">불만 확률</span>
                  <span className="text-sm font-bold text-gray-900">{insights.complaintRate}%</span>
                </div>
                <Progress value={insights.complaintRate} className="h-2" />
              </div>
            </div>
          </div>

          {/* [구획 라] 예상 필요 서비스 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-8" style={{ borderRadius: '12px' }}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Target className="w-6 h-6 text-[#EA002C]" />
              예상 필요 서비스
            </h2>

            <div className="space-y-4">
              {predictedServices.map((service, index) => (
                <div
                  key={index}
                  className={`bg-gradient-to-br ${
                    service.priority === 'high'
                      ? 'from-red-50 to-pink-50 border-red-200'
                      : 'from-blue-50 to-cyan-50 border-blue-200'
                  } rounded-2xl p-6 border`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">{service.title}</h3>
                    <div className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                      <CheckCircle className="w-4 h-4" />
                      {service.confidence}%
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    {service.description}
                  </p>
                  {service.priority === 'high' && (
                    <Badge className="bg-[#EA002C] text-white">우선 제안</Badge>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center gap-2 text-sm text-green-800">
                <CheckCircle className="w-4 h-4" />
                <span className="font-semibold">AI가 고객의 잠재적 니즈를 분석하여 제안합니다.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
