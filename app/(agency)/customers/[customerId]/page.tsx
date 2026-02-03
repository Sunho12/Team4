'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { format, differenceInDays } from 'date-fns'
import { User, Phone, Calendar, Smartphone, Wifi, CreditCard, ArrowLeft, TrendingUp, MessageSquare, Target, Lightbulb, AlertCircle, CheckCircle, X, Tag, ChevronDown, ChevronUp, LineChart, UserSearch, Copy, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

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

interface ConsultationInsight {
  title: string
  content: string
  tag: string
  icon: string
  priority: 'high' | 'medium' | 'low'
  type: 'dealership' | 'customer_specific'
}

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const customerId = params.customerId as string

  const [customer, setCustomer] = useState<any>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [consultationPoints, setConsultationPoints] = useState<ConsultationInsight[]>([])
  const [predictedServices, setPredictedServices] = useState<any[]>([])
  const [insights, setInsights] = useState({
    deviceChangeRate: 0,
    deviceChangeReasoning: '',
    planChangeRate: 0,
    planChangeReasoning: '',
    complaintRate: 0,
    complaintReasoning: '',
    overallScore: 0,
    overallReasoning: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [showUrgentAlert, setShowUrgentAlert] = useState(false)
  const [latestConsultation, setLatestConsultation] = useState<string>('')
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [isRefreshingServices, setIsRefreshingServices] = useState(false)

  // 각 지표 토글 상태
  const [toggleStates, setToggleStates] = useState({
    device: false,
    plan: false,
    complaint: false,
    overall: false
  })

  const toggleReasoning = (key: keyof typeof toggleStates) => {
    setToggleStates(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

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
      const convs = await loadConversations()

      // AI 분석 자동 실행
      await analyzeCustomer()

      // 긴급 상담 브리핑 체크 (로드된 상담 데이터를 직접 전달)
      checkUrgentConsultation(convs)
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

  const loadConversations = async (): Promise<Conversation[]> => {
    try {
      // Supabase에서 conversations와 messages 가져오기
      const response = await fetch(`/api/agency/customer/${customerId}/conversations`)
      if (response.ok) {
        const data = await response.json()
        const convs = data.conversations || []
        setConversations(convs)
        return convs
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
      return dummyConversations
    }
    return []
  }

  const checkUrgentConsultation = (convs: Conversation[]) => {
    // 최근 3일 이내 상담 내역 확인
    const recentConversations = convs.filter(conv => {
      const daysDiff = differenceInDays(new Date(), new Date(conv.started_at))
      return daysDiff <= 3
    })

    console.log('[긴급 상담 체크]', {
      totalConversations: convs.length,
      recentConversations: recentConversations.length,
      dates: recentConversations.map(c => c.started_at)
    })

    if (recentConversations.length > 0) {
      // 가장 최근 상담의 요약을 가져옴
      const latest = recentConversations[0]

      console.log('[긴급 상담 체크] 최신 상담 데이터:', {
        hasSummary: !!latest.summary,
        summary: latest.summary,
        summaryText: latest.summary?.summary
      })

      if (latest.summary && latest.summary.summary) {
        setLatestConsultation(latest.summary.summary)
      } else {
        // 요약이 없는 경우 메시지 내용 기반 간단 요약
        const userMessages = latest.messages?.filter(m => m.role === 'user') || []
        if (userMessages.length > 0) {
          setLatestConsultation(`고객 문의: ${userMessages[0].content.substring(0, 100)}...`)
        } else {
          setLatestConsultation('최근 상담 이력이 있으나 요약 정보가 생성 중입니다.')
        }
      }
      setShowUrgentAlert(true)
      console.log('[긴급 상담 알림] 팝업 표시됨')
    } else {
      console.log('[긴급 상담 알림] 최근 3일 이내 상담 없음')
    }
  }

  const analyzeCustomer = async () => {
    try {
      console.log('[Dashboard] Starting AI analysis for:', customerId)

      // AI 분석 API 호출
      const response = await fetch('/api/agency/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: customerId }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[Dashboard] Analysis result:', data)

        // API 응답을 state에 반영
        setInsights({
          deviceChangeRate: data.deviceUpgradeScore || 0,
          deviceChangeReasoning: data.deviceUpgradeReasoning || '',
          planChangeRate: data.planChangeScore || 0,
          planChangeReasoning: data.planChangeReasoning || '',
          complaintRate: data.complaintRate || 0,
          complaintReasoning: data.complaintReasoning || '',
          overallScore: data.overallScore || 0,
          overallReasoning: data.overallReasoning || ''
        })

        // 상담 개선 포인트 생성 (AI 기반 구조화된 인사이트)
        const insights: ConsultationInsight[] = []

        // 1. 대리점 차원의 일반적 개선점 (리뷰 트렌드 기반)
        insights.push({
          title: '서비스 개선점',
          content: '최근 긴 대기시간에 대한 불만이 있습니다. 빠르게 서비스를 제공해보세요!',
          tag: '매장 트렌드',
          icon: '🏢',
          priority: 'medium',
          type: 'dealership'
        })

        // 2. 고객 맞춤형 상담 전략
        let customerAdvice = ''
        let advicePriority: 'high' | 'medium' | 'low' = 'medium'

        // 고객 감정 상태에 따른 조언
        const recentSentiment = conversations.length > 0 && conversations[0].summary?.sentiment

        if (data.complaintRate > 60 || recentSentiment === 'negative') {
          customerAdvice = '이 고객님은 최근 불만이 높은 상태입니다. 상담 시작 전 "불편하신 점을 먼저 들어보겠습니다"라는 공감 표현으로 시작하세요. 문제 해결 절차를 단계별로 설명하고, 해결 예상 시간을 명확히 제시하면 신뢰도가 높아집니다.'
          advicePriority = 'high'
        } else if (data.deviceUpgradeScore > 50 && data.planChangeScore > 50) {
          customerAdvice = '이 고객님은 종합적인 "변화"를 고려 중입니다. 단순히 단말기나 요금제만 제안하지 말고, "고객님의 현재 사용 패턴에서 개선할 점"을 먼저 분석하여 제시하세요. 예: "데이터를 많이 사용하시는데 요금제를 바꾸시면 월 2만원 절약 가능합니다" 같은 구체적 수치 중심 접근이 효과적입니다.'
          advicePriority = 'high'
        } else if (data.deviceUpgradeScore > 50) {
          customerAdvice = '기기 교체 니즈가 높습니다. 이 고객님은 "성능"보다 "혜택"에 관심이 많을 가능성이 높습니다. 공시지원금과 추가지원금 합계를 강조하고, 할부 이자율보다는 "월 부담금"으로 설명하세요.'
          advicePriority = 'high'
        } else if (data.planChangeScore > 50) {
          customerAdvice = '요금제 변경 관심도가 높습니다. 현재 요금제 대비 "절감 금액"을 먼저 계산해서 보여주고, 데이터 사용 패턴이 바뀌었을 때의 시나리오도 함께 제시하면 설득력이 높아집니다.'
          advicePriority = 'medium'
        } else {
          customerAdvice = '안정적인 고객입니다. 무리한 상품 제안보다는 "멤버십 혜택 안내"나 "이벤트 정보"를 중심으로 관계를 유지하세요. 예: "다음 달에 고객님께 유용한 프로모션이 있어서 미리 알려드립니다" 같은 선제적 케어가 효과적입니다.'
          advicePriority = 'low'
        }

        insights.push({
          title: '고객 맞춤 상담 전략',
          content: customerAdvice,
          tag: '고객 성향 분석',
          icon: advicePriority === 'high' ? '🎯' : '💡',
          priority: advicePriority,
          type: 'customer_specific'
        })

        // 3. 상담 키워드 제안 (고객 과거 대화 분석)
        if (conversations.length > 0 && conversations[0].summary?.keywords) {
          const keywords = conversations[0].summary.keywords.slice(0, 3).join(', ')
          insights.push({
            title: '최근 관심 키워드',
            content: `이 고객님은 최근 상담에서 "${keywords}"에 높은 관심을 보였습니다. 오늘 상담 시 이 주제를 먼저 확인하고 시작하면 고객 만족도가 높아집니다.`,
            tag: '상담 이력',
            icon: '🔑',
            priority: 'medium',
            type: 'customer_specific'
          })
        }

        setConsultationPoints(insights)

        // 예상 필요 서비스 생성
        const services: any[] = []

        if (data.deviceUpgradeScore > 50) {
          services.push({
            title: '신규 기기 교체 프로모션',
            description: data.deviceUpgradeReasoning,
            priority: data.deviceUpgradeScore > 70 ? 'high' : 'medium',
            confidence: data.deviceUpgradeScore,
            type: 'device'
          })
        }

        if (data.planChangeScore > 50) {
          // 요금제 변경 - 상세한 추천 형식으로 변경
          const planRecommendations = []

          // 점수에 따라 다른 추천 제공
          if (data.planChangeScore >= 70) {
            // 추천 1: 5G 프리미엄 플러스
            planRecommendations.push({
              rank: 1,
              name: '5G 프리미엄 플러스',
              score: Math.min(95, data.planChangeScore + Math.floor(Math.random() * 10)),
              customerNeed: '데이터 무제한을 원하시며, 현재 온가족할인 30% 대상자입니다.',
              bestOffer: '요금제 상향 시 기기값 할부금이 0원이 되는 공시지원금 상향 정책 적용 모델입니다.',
              revenue: {
                commission: 450000,
                increase: 50000,
                additionalPolicy: '우주패스 life 가입 시 유지 수수료 건당 5,000원 추가 지급'
              }
            })

            // 추천 2: 5G 프리미엄
            planRecommendations.push({
              rank: 2,
              name: '5G 프리미엄',
              score: Math.min(90, data.planChangeScore + Math.floor(Math.random() * 5)),
              customerNeed: '매월 80~90GB를 사용하시어 현재 요금제에서 데이터 초과 직전입니다.',
              bestOffer: '데이터 안심 옵션보다 5,000원만 더 내면 100GB를 쓰는 것이 장기적으로 훨씬 이득입니다.',
              revenue: {
                commission: 380000,
                performance: '고가 요금제 유치 목표(현재 85% 달성) 달성 시 건당 가중치 1.2배 적용'
              }
            })

            // 추천 3: 0 청년 69
            planRecommendations.push({
              rank: 3,
              name: '0 청년 69',
              score: Math.min(85, data.planChangeScore),
              customerNeed: '만 34세 이하 고객으로, 커피/영화 등 생활 밀착형 혜택 선호도가 높습니다.',
              bestOffer: '일반 요금제보다 데이터 2배 제공 정책이 적용되는 청년 전용 요금제로 만족도를 높이세요.',
              revenue: {
                commission: 320000,
                longTermBenefit: '청년 고객 유치 시 향후 기변 정책 가중치 부여 대상'
              }
            })
          } else {
            // 중간 점수 - 경제형 요금제 추천
            planRecommendations.push({
              rank: 1,
              name: '5G 스탠다드',
              score: Math.min(80, data.planChangeScore + 5),
              customerNeed: '현재 요금제 대비 데이터를 10GB 더 사용하시는 패턴이 관찰됩니다.',
              bestOffer: '월 5천원 추가로 데이터 걱정 없이 사용하실 수 있습니다.',
              revenue: {
                commission: 280000,
                performance: '중급 요금제 유치 목표 달성 시 인센티브 지급'
              }
            })

            planRecommendations.push({
              rank: 2,
              name: '5G 라이트',
              score: Math.min(75, data.planChangeScore),
              customerNeed: '데이터 사용량이 적고 요금 절감을 원하시는 것으로 분석됩니다.',
              bestOffer: '현재 요금제 대비 월 1만원 절감 가능합니다.',
              revenue: {
                commission: 220000,
                additionalPolicy: '요금제 하향 시에도 수수료 지급 정책 적용'
              }
            })
          }

          services.push({
            title: '맞춤 요금제 추천',
            priority: data.planChangeScore > 70 ? 'high' : 'medium',
            confidence: data.planChangeScore,
            type: 'plan',
            recommendations: planRecommendations
          })
        }

        if (services.length === 0) {
          services.push({
            title: '고객 만족도 유지 관리',
            description: '현재 고객이 안정적인 상태입니다. 정기적인 혜택 안내로 관계를 유지하세요.',
            priority: 'low',
            confidence: data.overallScore,
            type: 'maintenance'
          })
        }

        setPredictedServices(services)
      } else {
        console.error('[Dashboard] API error:', response.status)
        // 오류 시 기본값 설정
        setInsights({
          deviceChangeRate: 0,
          deviceChangeReasoning: 'AI 분석에 실패했습니다.',
          planChangeRate: 0,
          planChangeReasoning: 'AI 분석에 실패했습니다.',
          complaintRate: 0,
          complaintReasoning: 'AI 분석에 실패했습니다.',
          overallScore: 0,
          overallReasoning: 'AI 분석에 실패했습니다.'
        })
      }
    } catch (error) {
      console.error('[Dashboard] Failed to analyze customer:', error)
      // 오류 시 기본값 설정
      setInsights({
        deviceChangeRate: 0,
        deviceChangeReasoning: 'AI 분석 중 오류가 발생했습니다.',
        planChangeRate: 0,
        planChangeReasoning: 'AI 분석 중 오류가 발생했습니다.',
        complaintRate: 0,
        complaintReasoning: 'AI 분석 중 오류가 발생했습니다.',
        overallScore: 0,
        overallReasoning: 'AI 분석 중 오류가 발생했습니다.'
      })
    }
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

  const refreshServices = async () => {
    setIsRefreshingServices(true)

    // 시뮬레이션: 2초 대기
    await new Promise(resolve => setTimeout(resolve, 2000))

    // AI 분석 다시 실행
    await analyzeCustomer()

    setIsRefreshingServices(false)
  }

  if (isLoading) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8"
        style={{
          backgroundColor: 'rgba(248, 248, 255, 0.95)',
          fontFamily: "'SK Mobius', sans-serif"
        }}
      >
        <Image
          src="/adot_loading.gif"
          alt="Loading..."
          width={800}
          height={350}
          unoptimized
        />
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#3617CE]/10 to-[#5B3FE8]/10 rounded-2xl border-2 border-[#3617CE]/20">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-[#3617CE] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-[#3617CE] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-[#3617CE] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <p className="text-lg font-bold bg-gradient-to-r from-[#3617CE] to-[#5B3FE8] bg-clip-text text-transparent">
              T-Bridge가 실시간으로 데이터를 연결하고 있습니다
            </p>
          </div>
          <p className="text-sm text-gray-500 animate-pulse">
            고객 정보를 분석하여 최적의 인사이트를 준비하고 있습니다
          </p>
        </div>
      </div>
    )
  }

  if (false) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
        style={{
          backgroundColor: 'rgba(40, 40, 50, 0.85)',
          backdropFilter: 'blur(12px)',
          fontFamily: "'SK Mobius', -apple-system, BlinkMacSystemFont, sans-serif"
        }}
      >

        <div className="flex flex-col items-center justify-center relative z-10">
          {/* SVG 중앙의 작은 다리와 화려한 불꽃놀이 */}
          <svg width="600" height="400" viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">
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

            {/* 화려한 불꽃놀이 배경 (Rich Fireworks) */}
            <g id="rich-fireworks">
              {/* 불꽃 1 - 핑크/마젠타 (왼쪽 상단) */}
              <g opacity="0">
                {/* 코어 */}
                <circle cx="150" cy="100" r="4" fill="#FFFFFF" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="2;6;4" dur="2s" repeatCount="indefinite" />
                </circle>
                {/* 방사형 입자들 - 12방향 */}
                <circle cx="150" cy="100" r="3" fill="#FF1493" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;35;60" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2s" repeatCount="indefinite" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; 0,-40; 0,-70" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="150" cy="100" r="3" fill="#FF69B4" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;30;55" dur="2s" repeatCount="indefinite" begin="0.05s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2s" repeatCount="indefinite" begin="0.05s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; 35,-35; 60,-60" dur="2s" repeatCount="indefinite" begin="0.05s" />
                </circle>
                <circle cx="150" cy="100" r="3" fill="#FFB6C1" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;32;58" dur="2s" repeatCount="indefinite" begin="0.1s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2s" repeatCount="indefinite" begin="0.1s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; 40,0; 70,0" dur="2s" repeatCount="indefinite" begin="0.1s" />
                </circle>
                <circle cx="150" cy="100" r="3" fill="#FF1493" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;33;56" dur="2s" repeatCount="indefinite" begin="0.15s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2s" repeatCount="indefinite" begin="0.15s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; 35,35; 60,60" dur="2s" repeatCount="indefinite" begin="0.15s" />
                </circle>
                <circle cx="150" cy="100" r="3" fill="#C71585" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;28;52" dur="2s" repeatCount="indefinite" begin="0.2s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2s" repeatCount="indefinite" begin="0.2s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; 0,40; 0,70" dur="2s" repeatCount="indefinite" begin="0.2s" />
                </circle>
                <circle cx="150" cy="100" r="3" fill="#FF69B4" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;31;54" dur="2s" repeatCount="indefinite" begin="0.25s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2s" repeatCount="indefinite" begin="0.25s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; -35,35; -60,60" dur="2s" repeatCount="indefinite" begin="0.25s" />
                </circle>
                <circle cx="150" cy="100" r="3" fill="#FFB6C1" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;34;57" dur="2s" repeatCount="indefinite" begin="0.3s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2s" repeatCount="indefinite" begin="0.3s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; -40,0; -70,0" dur="2s" repeatCount="indefinite" begin="0.3s" />
                </circle>
                <circle cx="150" cy="100" r="3" fill="#FF1493" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;29;53" dur="2s" repeatCount="indefinite" begin="0.35s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2s" repeatCount="indefinite" begin="0.35s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; -35,-35; -60,-60" dur="2s" repeatCount="indefinite" begin="0.35s" />
                </circle>
                <animate attributeName="opacity" values="0;1;1;0" dur="2s" repeatCount="indefinite" />
              </g>

              {/* 불꽃 2 - 오렌지/골드 (오른쪽 상단) */}
              <g opacity="0">
                <circle cx="450" cy="120" r="4" fill="#FFFFFF" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="2;6;4" dur="2.3s" repeatCount="indefinite" />
                </circle>
                <circle cx="450" cy="120" r="3" fill="#FF4500" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;38;65" dur="2.3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.3s" repeatCount="indefinite" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; 0,-45; 0,-75" dur="2.3s" repeatCount="indefinite" />
                </circle>
                <circle cx="450" cy="120" r="3" fill="#FF8C00" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;35;62" dur="2.3s" repeatCount="indefinite" begin="0.07s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.3s" repeatCount="indefinite" begin="0.07s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; 38,-38; 65,-65" dur="2.3s" repeatCount="indefinite" begin="0.07s" />
                </circle>
                <circle cx="450" cy="120" r="3" fill="#FFD700" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;36;63" dur="2.3s" repeatCount="indefinite" begin="0.14s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.3s" repeatCount="indefinite" begin="0.14s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; 45,0; 75,0" dur="2.3s" repeatCount="indefinite" begin="0.14s" />
                </circle>
                <circle cx="450" cy="120" r="3" fill="#FFA500" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;34;60" dur="2.3s" repeatCount="indefinite" begin="0.21s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.3s" repeatCount="indefinite" begin="0.21s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; 38,38; 65,65" dur="2.3s" repeatCount="indefinite" begin="0.21s" />
                </circle>
                <circle cx="450" cy="120" r="3" fill="#FF4500" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;32;58" dur="2.3s" repeatCount="indefinite" begin="0.28s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.3s" repeatCount="indefinite" begin="0.28s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; 0,45; 0,75" dur="2.3s" repeatCount="indefinite" begin="0.28s" />
                </circle>
                <circle cx="450" cy="120" r="3" fill="#FFD700" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;37;64" dur="2.3s" repeatCount="indefinite" begin="0.35s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.3s" repeatCount="indefinite" begin="0.35s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; -38,38; -65,65" dur="2.3s" repeatCount="indefinite" begin="0.35s" />
                </circle>
                <circle cx="450" cy="120" r="3" fill="#FF8C00" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;33;59" dur="2.3s" repeatCount="indefinite" begin="0.42s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.3s" repeatCount="indefinite" begin="0.42s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; -45,0; -75,0" dur="2.3s" repeatCount="indefinite" begin="0.42s" />
                </circle>
                <circle cx="450" cy="120" r="3" fill="#FFA500" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;31;56" dur="2.3s" repeatCount="indefinite" begin="0.49s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.3s" repeatCount="indefinite" begin="0.49s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; -38,-38; -65,-65" dur="2.3s" repeatCount="indefinite" begin="0.49s" />
                </circle>
                <animate attributeName="opacity" values="0;1;1;0" dur="2.3s" repeatCount="indefinite" begin="0.9s" />
              </g>

              {/* 불꽃 3 - 보라/자주 (중앙 위) */}
              <g opacity="0">
                <circle cx="300" cy="80" r="4" fill="#FFFFFF" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="2;6;4" dur="2.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="300" cy="80" r="3" fill="#9370DB" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;40;68" dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.5s" repeatCount="indefinite" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; 0,-48; 0,-80" dur="2.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="300" cy="80" r="3" fill="#BA55D3" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;38;66" dur="2.5s" repeatCount="indefinite" begin="0.06s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.5s" repeatCount="indefinite" begin="0.06s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; 40,-40; 68,-68" dur="2.5s" repeatCount="indefinite" begin="0.06s" />
                </circle>
                <circle cx="300" cy="80" r="3" fill="#DDA0DD" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;36;64" dur="2.5s" repeatCount="indefinite" begin="0.12s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.5s" repeatCount="indefinite" begin="0.12s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; 48,0; 80,0" dur="2.5s" repeatCount="indefinite" begin="0.12s" />
                </circle>
                <circle cx="300" cy="80" r="3" fill="#9370DB" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;39;67" dur="2.5s" repeatCount="indefinite" begin="0.18s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.5s" repeatCount="indefinite" begin="0.18s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; 40,40; 68,68" dur="2.5s" repeatCount="indefinite" begin="0.18s" />
                </circle>
                <circle cx="300" cy="80" r="3" fill="#8B008B" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;35;62" dur="2.5s" repeatCount="indefinite" begin="0.24s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.5s" repeatCount="indefinite" begin="0.24s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; 0,48; 0,80" dur="2.5s" repeatCount="indefinite" begin="0.24s" />
                </circle>
                <circle cx="300" cy="80" r="3" fill="#BA55D3" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;37;65" dur="2.5s" repeatCount="indefinite" begin="0.3s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.5s" repeatCount="indefinite" begin="0.3s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; -40,40; -68,68" dur="2.5s" repeatCount="indefinite" begin="0.3s" />
                </circle>
                <circle cx="300" cy="80" r="3" fill="#DDA0DD" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;41;69" dur="2.5s" repeatCount="indefinite" begin="0.36s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.5s" repeatCount="indefinite" begin="0.36s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; -48,0; -80,0" dur="2.5s" repeatCount="indefinite" begin="0.36s" />
                </circle>
                <circle cx="300" cy="80" r="3" fill="#9370DB" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;34;61" dur="2.5s" repeatCount="indefinite" begin="0.42s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.5s" repeatCount="indefinite" begin="0.42s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; -40,-40; -68,-68" dur="2.5s" repeatCount="indefinite" begin="0.42s" />
                </circle>
                <animate attributeName="opacity" values="0;1;1;0" dur="2.5s" repeatCount="indefinite" begin="1.7s" />
              </g>

              {/* 불꽃 4 - 청록/시안 (왼쪽 하단) */}
              <g opacity="0">
                <circle cx="180" cy="250" r="4" fill="#FFFFFF" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="2;6;4" dur="2.2s" repeatCount="indefinite" />
                </circle>
                <circle cx="180" cy="250" r="3" fill="#00CED1" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;36;63" dur="2.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.2s" repeatCount="indefinite" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; 0,-43; 0,-73" dur="2.2s" repeatCount="indefinite" />
                </circle>
                <circle cx="180" cy="250" r="3" fill="#40E0D0" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;34;60" dur="2.2s" repeatCount="indefinite" begin="0.05s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.2s" repeatCount="indefinite" begin="0.05s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; 36,-36; 63,-63" dur="2.2s" repeatCount="indefinite" begin="0.05s" />
                </circle>
                <circle cx="180" cy="250" r="3" fill="#48D1CC" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;35;62" dur="2.2s" repeatCount="indefinite" begin="0.1s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.2s" repeatCount="indefinite" begin="0.1s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; 43,0; 73,0" dur="2.2s" repeatCount="indefinite" begin="0.1s" />
                </circle>
                <circle cx="180" cy="250" r="3" fill="#00CED1" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;32;58" dur="2.2s" repeatCount="indefinite" begin="0.15s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.2s" repeatCount="indefinite" begin="0.15s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; 36,36; 63,63" dur="2.2s" repeatCount="indefinite" begin="0.15s" />
                </circle>
                <circle cx="180" cy="250" r="3" fill="#20B2AA" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;33;59" dur="2.2s" repeatCount="indefinite" begin="0.2s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.2s" repeatCount="indefinite" begin="0.2s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; 0,43; 0,73" dur="2.2s" repeatCount="indefinite" begin="0.2s" />
                </circle>
                <circle cx="180" cy="250" r="3" fill="#40E0D0" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;37;64" dur="2.2s" repeatCount="indefinite" begin="0.25s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.2s" repeatCount="indefinite" begin="0.25s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; -36,36; -63,63" dur="2.2s" repeatCount="indefinite" begin="0.25s" />
                </circle>
                <circle cx="180" cy="250" r="3" fill="#48D1CC" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;31;57" dur="2.2s" repeatCount="indefinite" begin="0.3s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.2s" repeatCount="indefinite" begin="0.3s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; -43,0; -73,0" dur="2.2s" repeatCount="indefinite" begin="0.3s" />
                </circle>
                <circle cx="180" cy="250" r="3" fill="#00CED1" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;30;55" dur="2.2s" repeatCount="indefinite" begin="0.35s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.2s" repeatCount="indefinite" begin="0.35s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; -36,-36; -63,-63" dur="2.2s" repeatCount="indefinite" begin="0.35s" />
                </circle>
                <animate attributeName="opacity" values="0;1;1;0" dur="2.2s" repeatCount="indefinite" begin="2.5s" />
              </g>

              {/* 불꽃 5 - 노랑/라임 (오른쪽 하단) */}
              <g opacity="0">
                <circle cx="420" cy="260" r="4" fill="#FFFFFF" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="2;6;4" dur="2.4s" repeatCount="indefinite" />
                </circle>
                <circle cx="420" cy="260" r="3" fill="#FFFF00" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;37;64" dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.4s" repeatCount="indefinite" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; 0,-44; 0,-76" dur="2.4s" repeatCount="indefinite" />
                </circle>
                <circle cx="420" cy="260" r="3" fill="#FFD700" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;35;62" dur="2.4s" repeatCount="indefinite" begin="0.06s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.4s" repeatCount="indefinite" begin="0.06s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; 37,-37; 64,-64" dur="2.4s" repeatCount="indefinite" begin="0.06s" />
                </circle>
                <circle cx="420" cy="260" r="3" fill="#FFE55C" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;38;66" dur="2.4s" repeatCount="indefinite" begin="0.12s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.4s" repeatCount="indefinite" begin="0.12s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; 44,0; 76,0" dur="2.4s" repeatCount="indefinite" begin="0.12s" />
                </circle>
                <circle cx="420" cy="260" r="3" fill="#FFFF00" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;33;59" dur="2.4s" repeatCount="indefinite" begin="0.18s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.4s" repeatCount="indefinite" begin="0.18s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; 37,37; 64,64" dur="2.4s" repeatCount="indefinite" begin="0.18s" />
                </circle>
                <circle cx="420" cy="260" r="3" fill="#FFD700" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;36;63" dur="2.4s" repeatCount="indefinite" begin="0.24s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.4s" repeatCount="indefinite" begin="0.24s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; 0,44; 0,76" dur="2.4s" repeatCount="indefinite" begin="0.24s" />
                </circle>
                <circle cx="420" cy="260" r="3" fill="#FFE55C" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;34;61" dur="2.4s" repeatCount="indefinite" begin="0.3s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.4s" repeatCount="indefinite" begin="0.3s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; -37,37; -64,64" dur="2.4s" repeatCount="indefinite" begin="0.3s" />
                </circle>
                <circle cx="420" cy="260" r="3" fill="#FFFF00" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;39;67" dur="2.4s" repeatCount="indefinite" begin="0.36s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.4s" repeatCount="indefinite" begin="0.36s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; -44,0; -76,0" dur="2.4s" repeatCount="indefinite" begin="0.36s" />
                </circle>
                <circle cx="420" cy="260" r="3" fill="#FFD700" filter="url(#fireworkGlow)">
                  <animate attributeName="r" values="0;32;58" dur="2.4s" repeatCount="indefinite" begin="0.42s" />
                  <animate attributeName="opacity" values="1;0.5;0" dur="2.4s" repeatCount="indefinite" begin="0.42s" />
                  <animateTransform attributeName="transform" type="translate" values="0,0; -37,-37; -64,-64" dur="2.4s" repeatCount="indefinite" begin="0.42s" />
                </circle>
                <animate attributeName="opacity" values="0;1;1;0" dur="2.4s" repeatCount="indefinite" begin="3.2s" />
              </g>
            </g>

            {/* 중앙의 작은 다리 (The Minimal Bridge) */}
            <g id="minimal-bridge">
              {/* 다리 그림자 */}
              <ellipse cx="300" cy="240" rx="110" ry="10" fill="#000000" opacity="0.15"/>

              {/* 메인 아치 */}
              <path
                d="M 190 220 Q 300 175 410 220"
                fill="none"
                stroke="url(#bridgeGradient)"
                strokeWidth="7"
                strokeLinecap="round"
                opacity="1"
              />

              {/* 내부 하이라이트 라인 */}
              <path
                d="M 195 218 Q 300 178 405 218"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.6"
              />

              {/* 왼쪽 기둥 */}
              <rect x="187" y="220" width="6" height="20" rx="3" fill="url(#bridgeGradient)" opacity="0.9"/>
              <circle cx="190" cy="220" r="4" fill="url(#bridgeGradient)"/>

              {/* 오른쪽 기둥 */}
              <rect x="407" y="220" width="6" height="20" rx="3" fill="url(#bridgeGradient)" opacity="0.9"/>
              <circle cx="410" cy="220" r="4" fill="url(#bridgeGradient)"/>
            </g>

          </svg>

          {/* 타이포그래피 - Breathing 애니메이션 */}
          <div className="mt-14 text-center px-4">
            <p className="text-[18px] font-normal breathing-text" style={{ letterSpacing: '0.04em', lineHeight: '1.6' }}>
              <span>T-Bridge가 실시간으로 데이터를 </span>
              <span
                style={{
                  color: '#FFD700',
                  fontWeight: 700,
                  textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
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
                opacity: 0.8;
              }
              50% {
                opacity: 1;
              }
            }

            .breathing-text {
              animation: breathing 3s ease-in-out infinite;
              color: #FFFFFF;
              text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" style={{ fontFamily: "'SK Mobius', sans-serif" }}>
          <div
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-shake border border-gray-200/50"
          >
            {/* 헤더 - 대시보드 스타일 (T-Bridge Purple) */}
            <div className="bg-gradient-to-r from-[#3617CE] to-[#5B3FE8] p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">긴급 상담 브리핑</h2>
                  <p className="text-sm text-white/90 mt-1">최근 3일 내 방문 고객</p>
                </div>
              </div>
            </div>

            {/* 내용 */}
            <div className="p-6 space-y-4">
              {/* 최신 상담 내역 - 대시보드 카드 스타일 */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-5 border border-blue-200/50">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-5 h-5 text-[#3617CE]" />
                  <h3 className="text-sm font-semibold text-gray-900">최신 상담 내역</h3>
                </div>
                <p className="text-sm text-gray-800 leading-relaxed" style={{ lineHeight: '1.8' }}>
                  {latestConsultation || '상담 내역을 확인할 수 없습니다.'}
                </p>
              </div>

              {/* 불만 지수 - SK Red 유지 (경고 표시) */}
              <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-5 border border-red-200/50">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-[#EA002C]" />
                  <h3 className="text-sm font-semibold text-gray-900">현재 불만 지수</h3>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex-1">
                    <div className="text-5xl font-bold text-[#EA002C]">
                      {insights.complaintRate}%
                    </div>
                    <p className="text-xs text-gray-600 mt-1">AI 분석 기반 불만 확률</p>
                  </div>
                  <div className="w-20 h-20">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#FFE5E5"
                        strokeWidth="10"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#EA002C"
                        strokeWidth="10"
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

              {/* 주의사항 - 대시보드 스타일 */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200/50">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-[#3617CE] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-900 mb-1">상담 전 확인사항</p>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      최근 방문 이력이 있는 고객입니다. 이전 상담 내용을 숙지하고 신중하게 응대해주세요.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 하단 버튼 - T-Bridge 스타일 */}
            <div className="p-6 pt-0">
              <button
                onClick={() => setShowUrgentAlert(false)}
                className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all hover:scale-[1.02] hover:shadow-xl"
                style={{
                  background: 'linear-gradient(135deg, #3617CE 0%, #5B3FE8 100%)'
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

            {/* 2x2 그리드 레이아웃 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {selectedConversation.summary ? (
                <div className="grid grid-cols-2 gap-4">
                  {/* 카드 1: 상담 카테고리 및 감정 */}
                  <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-200 shadow-sm">
                    <div className="text-center">
                      <div className="inline-block p-3 bg-white rounded-full shadow-sm mb-3">
                        <MessageSquare className="w-8 h-8 text-[#3617CE]" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {selectedConversation.summary.category}
                      </h3>
                      <div className="flex items-center justify-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          selectedConversation.summary.sentiment === 'positive' ? 'bg-green-500' :
                          selectedConversation.summary.sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-500'
                        }`}></div>
                        <span className="text-sm font-semibold text-gray-700">
                          {getSentimentText(selectedConversation.summary.sentiment)} 상담
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 카드 2: 상담 통계 */}
                  <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl p-5 border border-green-200 shadow-sm">
                    <div className="grid grid-cols-2 gap-3 h-full">
                      <div className="text-center bg-white/80 backdrop-blur rounded-xl p-3 shadow-sm">
                        <p className="text-xs font-semibold text-gray-600 mb-1">상담 시작</p>
                        <p className="text-base font-bold text-gray-900">
                          {format(new Date(selectedConversation.started_at), 'HH:mm')}
                        </p>
                      </div>
                      <div className="text-center bg-white/80 backdrop-blur rounded-xl p-3 shadow-sm">
                        <p className="text-xs font-semibold text-gray-600 mb-1">상담 종료</p>
                        <p className="text-base font-bold text-gray-900">
                          {selectedConversation.ended_at
                            ? format(new Date(selectedConversation.ended_at), 'HH:mm')
                            : '진행중'}
                        </p>
                      </div>
                      <div className="col-span-2 text-center bg-white/80 backdrop-blur rounded-xl p-3 shadow-sm">
                        <p className="text-xs font-semibold text-gray-600 mb-1">총 메시지</p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                          {selectedConversation.messages.length}개
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 카드 3: 상담 요약 */}
                  <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 rounded-2xl p-5 border border-blue-200 shadow-sm col-span-2">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <MessageSquare className="w-5 h-5 text-[#3617CE]" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">상담 요약</h3>
                    </div>
                    <div className="bg-white/80 backdrop-blur rounded-xl p-4 shadow-sm">
                      <p className="text-sm text-gray-800 leading-relaxed" style={{ lineHeight: '1.8' }}>
                        {selectedConversation.summary.summary}
                      </p>
                    </div>
                  </div>

                  {/* 카드 4: 키워드 */}
                  {selectedConversation.summary.keywords && selectedConversation.summary.keywords.length > 0 && (
                    <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-2xl p-5 border border-orange-200 shadow-sm col-span-2">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <Tag className="w-5 h-5 text-[#FF7A00]" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">핵심 키워드</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedConversation.summary.keywords.map((keyword, idx) => (
                          <div
                            key={idx}
                            className="bg-white rounded-lg px-4 py-2 shadow-sm border border-orange-200"
                          >
                            <span className="text-sm font-bold bg-gradient-to-r from-[#FF7A00] to-[#FFA500] bg-clip-text text-transparent">
                              #{keyword}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-base">요약 정보가 없습니다.</p>
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
          0% {
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
            opacity: 1;
          }
          50% {
            transform: translateX(-3px) scale(1);
            opacity: 1;
          }
          60% {
            transform: translateX(3px) scale(1);
            opacity: 1;
          }
          70% {
            transform: translateX(-2px) scale(1);
            opacity: 1;
          }
          80% {
            transform: translateX(2px) scale(1);
            opacity: 1;
          }
          90% {
            transform: translateX(-1px) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-shake {
          animation: shake 0.8s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards;
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

        {/* 1. 고객 기본 정보 섹션 - Optimized */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-8" style={{ borderRadius: '12px' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#3617CE] to-[#5B3FE8] rounded-xl flex items-center justify-center text-white shadow-md">
                <User className="w-7 h-7" />
              </div>
              <div className="flex items-baseline gap-3">
                <h1 className="text-3xl font-bold text-gray-900">{customer.customer_name || '이름 없음'}</h1>
                <span className="text-sm text-slate-500 font-medium">
                  ({customer.birthdate || '생년월일 없음'} | {customer.customer_phone || '010-0000-0000'})
                </span>
                <Badge className="bg-gradient-to-r from-[#3617CE] to-[#5B3FE8] text-white px-3 py-1 text-xs font-semibold">
                  VIP
                </Badge>
              </div>
            </div>
          </div>

          {/* 최적화된 정보 그리드 - 5 Cards */}
          <div className="grid grid-cols-5 gap-4">
            {/* 할부 정보 카드 */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-slate-600" strokeWidth={2.5} />
                <p className="text-xs font-semibold text-slate-700">할부 정보</p>
              </div>
              <div className="mb-2">
                <p className="text-lg font-bold text-slate-900 font-mono">12 / 24개월</p>
                <p className="text-xs text-slate-500 mt-0.5">50% 완료</p>
              </div>
              <Progress value={50} className="h-1.5" />
            </div>

            {/* 위약금 정보 카드 */}
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-red-600" strokeWidth={2.5} />
                <p className="text-xs font-semibold text-red-700">위약금</p>
              </div>
              <p className="text-lg font-bold text-red-600 font-mono">₩120,000</p>
              <p className="text-xs text-red-500 mt-0.5">해지 시 발생</p>
            </div>

            {/* 결합상품 */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <Wifi className="w-4 h-4 text-green-600" strokeWidth={2.5} />
                <p className="text-xs font-semibold text-green-700">결합상품</p>
              </div>
              {customer.family_members_count > 0 ? (
                <>
                  <p className="text-lg font-bold text-green-900">가족결합</p>
                  <p className="text-xs text-green-600 mt-0.5">{customer.family_members_count}인</p>
                </>
              ) : (
                <p className="text-sm text-gray-500">없음</p>
              )}
            </div>

            {/* 단말기 */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <Smartphone className="w-4 h-4 text-purple-600" strokeWidth={2.5} />
                <p className="text-xs font-semibold text-purple-700">단말기</p>
              </div>
              <p className="text-sm font-bold text-purple-900 leading-tight">{customer.device_model_name || '정보 없음'}</p>
              {customer.device_purchase_date && (
                <p className="text-xs text-purple-600 mt-1">
                  {format(new Date(customer.device_purchase_date), 'yyyy.MM.dd')}
                </p>
              )}
            </div>

            {/* 현재 요금제 */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-blue-600" strokeWidth={2.5} />
                <p className="text-xs font-semibold text-blue-700">현재 요금제</p>
              </div>
              <p className="text-sm font-bold text-blue-900 leading-tight">{customer.plan_name || '정보 없음'}</p>
              {customer.plan_price && (
                <p className="text-xs text-blue-600 mt-1 font-mono">₩{customer.plan_price.toLocaleString()}/월</p>
              )}
            </div>
          </div>
        </div>

        {/* 벤토 그리드 레이아웃 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* [구획 가] 이전 상담 내역 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6" style={{ borderRadius: '12px' }}>
            <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#3617CE]" />
              이전 상담 내역
            </h2>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {(() => {
                // conversation_summaries가 있는 상담만 필터링
                const conversationsWithSummary = conversations.filter(conv => conv.summary)

                return conversationsWithSummary.length > 0 ? (
                  conversationsWithSummary.map((conv) => {
                    const isRecent = isRecentConversation(conv.started_at)
                    return (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 ${
                          isRecent ? 'border-2 border-[#EA002C]' : 'border border-gray-200'
                        } transition-all hover:shadow-md cursor-pointer hover:scale-[1.01]`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-600 font-medium">
                            {format(new Date(conv.started_at), 'yyyy.MM.dd HH:mm')}
                          </span>
                          <div className="flex items-center gap-1">
                            {isRecent && (
                              <Badge className="bg-[#EA002C] text-white text-xs py-0 px-2">최근</Badge>
                            )}
                            <Badge className={`${getSentimentColor(conv.summary!.sentiment)} text-white text-xs py-0 px-2`}>
                              {getSentimentText(conv.summary!.sentiment)}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-[#3617CE] border-[#3617CE] text-xs py-0 px-2">
                            {conv.summary!.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed line-clamp-2">
                          {conv.summary!.summary}
                        </p>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    상담 요약이 있는 내역이 없습니다.
                  </div>
                )
              })()}
            </div>
          </div>

          {/* [구획 나] AI 상담 어시스턴트 - Professional Data Viz */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-8" style={{ borderRadius: '12px' }}>
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-slate-600" strokeWidth={2.5} />
              AI 상담 어시스턴트
            </h2>

            <div className="space-y-3">
              {consultationPoints.map((insight, index) => {
                // 타입별 스타일 및 아이콘 설정
                const getInsightConfig = () => {
                  if (insight.type === 'dealership') {
                    return {
                      accentColor: 'border-blue-500',
                      icon: LineChart,
                      iconColor: 'text-blue-600',
                      iconBg: 'bg-blue-50'
                    }
                  } else {
                    return {
                      accentColor: 'border-amber-500',
                      icon: UserSearch,
                      iconColor: 'text-amber-600',
                      iconBg: 'bg-amber-50'
                    }
                  }
                }

                const config = getInsightConfig()
                const IconComponent = config.icon

                // 핵심 요약과 상세 분리
                const [summary, ...details] = insight.content.split('.')
                const detailText = details.join('.').trim()

                return (
                  <div
                    key={index}
                    className={`bg-white rounded-lg border-l-4 ${config.accentColor} border border-slate-200 p-5 hover:shadow-sm transition-all`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-9 h-9 ${config.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <IconComponent className={`w-4.5 h-4.5 ${config.iconColor}`} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-slate-900">{insight.title}</h3>
                            <Badge variant="outline" className="text-xs text-slate-600 border-slate-300">
                              {insight.tag}
                            </Badge>
                            {insight.priority === 'high' && (
                              <Badge className="bg-red-100 text-red-700 text-xs border-red-200">
                                긴급
                              </Badge>
                            )}
                          </div>
                          {/* 핵심 요약 */}
                          <p className="text-sm font-bold text-slate-900 mb-1">
                            {summary}.
                          </p>
                          {/* 상세 내용 */}
                          {detailText && (
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {detailText}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors">
                        <Copy className="w-3.5 h-3.5" />
                        스크립트 복사
                      </button>
                      {insight.type === 'customer_specific' && (
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                          요금제 비교
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
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

              <div className="text-center mb-3">
                <Badge className="bg-gradient-to-r from-[#3617CE] to-[#5B3FE8] text-white">
                  {insights.overallScore >= 70 ? '우수 잠재고객' : insights.overallScore >= 40 ? '보통' : '관심 필요'}
                </Badge>
              </div>

              {/* 종합 점수 산출 근거 토글 */}
              <div className="text-center">
                <button
                  onClick={() => toggleReasoning('overall')}
                  className="inline-flex items-center gap-1 text-xs text-purple-700 hover:text-purple-900 transition-colors"
                >
                  {toggleStates.overall ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  <span>산출 근거 {toggleStates.overall ? '닫기' : '보기'}</span>
                </button>
                {toggleStates.overall && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200 text-left">
                    <p className="text-xs text-gray-700 leading-relaxed">{insights.overallReasoning}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 세분화 지표 */}
            <div className="space-y-4">
              {/* 기기변경 확률 */}
              <div className="bg-red-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">기기변경 확률</span>
                  <span className="text-sm font-bold text-[#EA002C]">{insights.deviceChangeRate}%</span>
                </div>
                <Progress value={insights.deviceChangeRate} className="h-2 mb-2" style={{ '--progress-background': '#EA002C' } as any} />
                <button
                  onClick={() => toggleReasoning('device')}
                  className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {toggleStates.device ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  <span>산출 근거 {toggleStates.device ? '닫기' : '보기'}</span>
                </button>
                {toggleStates.device && (
                  <div className="mt-2 p-3 bg-white rounded-lg border border-red-200">
                    <p className="text-xs text-gray-700 leading-relaxed">{insights.deviceChangeReasoning}</p>
                  </div>
                )}
              </div>

              {/* 요금제변경 확률 */}
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">요금제변경 확률</span>
                  <span className="text-sm font-bold text-gray-900">{insights.planChangeRate}%</span>
                </div>
                <Progress value={insights.planChangeRate} className="h-2 mb-2" />
                <button
                  onClick={() => toggleReasoning('plan')}
                  className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {toggleStates.plan ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  <span>산출 근거 {toggleStates.plan ? '닫기' : '보기'}</span>
                </button>
                {toggleStates.plan && (
                  <div className="mt-2 p-3 bg-white rounded-lg border border-blue-200">
                    <p className="text-xs text-gray-700 leading-relaxed">{insights.planChangeReasoning}</p>
                  </div>
                )}
              </div>

              {/* 불만 확률 */}
              <div className="bg-orange-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">불만 확률</span>
                  <span className="text-sm font-bold text-gray-900">{insights.complaintRate}%</span>
                </div>
                <Progress value={insights.complaintRate} className="h-2 mb-2" />
                <button
                  onClick={() => toggleReasoning('complaint')}
                  className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {toggleStates.complaint ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  <span>산출 근거 {toggleStates.complaint ? '닫기' : '보기'}</span>
                </button>
                {toggleStates.complaint && (
                  <div className="mt-2 p-3 bg-white rounded-lg border border-orange-200">
                    <p className="text-xs text-gray-700 leading-relaxed">{insights.complaintReasoning}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* [구획 라] 예상 필요 서비스 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-8" style={{ borderRadius: '12px' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Target className="w-6 h-6 text-[#EA002C]" />
                예상 필요 서비스
              </h2>
              <button
                onClick={refreshServices}
                disabled={isRefreshingServices}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isRefreshingServices
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#3617CE] to-[#5B3FE8] text-white hover:shadow-lg hover:scale-105'
                }`}
              >
                {isRefreshingServices ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>우리 대리점 최신 정책 적용 중...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>정책 새로고침</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-6">
              {predictedServices.map((service, index) => (
                <div key={index}>
                  {/* 기기 변경 서비스 (기존 형식 유지) */}
                  {service.type === 'device' && (
                    <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 border border-red-200">
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
                      <Badge className="bg-[#EA002C] text-white">우선 제안</Badge>
                    </div>
                  )}

                  {/* 요금제 추천 서비스 (새 형식) */}
                  {service.type === 'plan' && service.recommendations && (
                    <div className="space-y-4">
                      {service.recommendations.map((rec: any, recIdx: number) => (
                        <div
                          key={recIdx}
                          className={`bg-gradient-to-br rounded-2xl p-6 border-2 transition-all hover:shadow-lg ${
                            rec.rank === 1
                              ? 'from-red-50 via-orange-50 to-yellow-50 border-red-300'
                              : rec.rank === 2
                              ? 'from-blue-50 via-indigo-50 to-purple-50 border-blue-300'
                              : 'from-green-50 via-teal-50 to-cyan-50 border-green-300'
                          }`}
                        >
                          {/* 헤더 */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                                rec.rank === 1 ? 'bg-gradient-to-br from-red-500 to-orange-500' :
                                rec.rank === 2 ? 'bg-gradient-to-br from-blue-500 to-indigo-500' :
                                'bg-gradient-to-br from-green-500 to-teal-500'
                              }`}>
                                {rec.rank}
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-gray-900">{rec.name}</h3>
                                <p className="text-xs text-gray-600 mt-0.5">추천 순위 {rec.rank}위</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-1 mb-1">
                                <div className="text-2xl font-bold bg-gradient-to-r from-[#3617CE] to-[#5B3FE8] bg-clip-text text-transparent">
                                  {rec.score}%
                                </div>
                              </div>
                              <span className="text-xs text-gray-600">매칭 점수</span>
                            </div>
                          </div>

                          {/* 고객 니즈 */}
                          <div className="mb-4 p-4 bg-white/70 rounded-xl border border-gray-200">
                            <p className="text-xs font-semibold text-gray-600 mb-2">🎯 고객 니즈</p>
                            <p className="text-sm text-gray-800 leading-relaxed">
                              {rec.customerNeed}
                            </p>
                          </div>

                          {/* 최적 제안 */}
                          <div className="mb-4 p-4 bg-white/70 rounded-xl border border-blue-200">
                            <p className="text-xs font-semibold text-blue-700 mb-2">💡 최적 제안</p>
                            <p className="text-sm text-gray-800 leading-relaxed font-medium">
                              "{rec.bestOffer}"
                            </p>
                          </div>

                          {/* 대리점 수익 */}
                          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                            <p className="text-xs font-semibold text-green-700 mb-3">💰 대리점 수익</p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">판매 장려금 (리베이트)</span>
                                <span className="text-lg font-bold text-green-700">
                                  {rec.revenue.commission.toLocaleString()}원
                                  {rec.revenue.increase && (
                                    <span className="text-xs text-red-600 ml-2">
                                      (전주 대비 +{rec.revenue.increase.toLocaleString()}원)
                                    </span>
                                  )}
                                </span>
                              </div>
                              {rec.revenue.additionalPolicy && (
                                <div className="pt-2 border-t border-green-200">
                                  <p className="text-xs text-gray-600">
                                    <span className="font-semibold">부가 정책:</span> {rec.revenue.additionalPolicy}
                                  </p>
                                </div>
                              )}
                              {rec.revenue.performance && (
                                <div className="pt-2 border-t border-green-200">
                                  <p className="text-xs text-gray-600">
                                    <span className="font-semibold">성과 인센티브:</span> {rec.revenue.performance}
                                  </p>
                                </div>
                              )}
                              {rec.revenue.longTermBenefit && (
                                <div className="pt-2 border-t border-green-200">
                                  <p className="text-xs text-gray-600">
                                    <span className="font-semibold">장기 혜택:</span> {rec.revenue.longTermBenefit}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 유지 관리 서비스 */}
                  {service.type === 'maintenance' && (
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                      <h3 className="text-lg font-bold text-gray-900 mb-3">{service.title}</h3>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
              <div className="flex items-center gap-2 text-sm text-purple-800">
                <CheckCircle className="w-4 h-4" />
                <span className="font-semibold">AI가 고객 니즈와 대리점 정책을 종합 분석하여 최적의 제안을 생성합니다.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
