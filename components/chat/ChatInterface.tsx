'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { StoreModal } from './StoreModal'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Message } from '@/types/chat'
import type { StoreInfo } from '@/lib/utils/storeSearch'

interface ChatInterfaceProps {
  sessionToken: string
  conversationId: string | null
  onConversationCreated: (id: string) => void
}

// 대화 흐름 단계
type FlowStep =
  | 'BUSINESS_TYPE'      // 업무 구분 선택
  | 'CUSTOMER_TYPE'      // 고객 유형 선택
  | 'PATH_SELECTION'     // T-World / 대리점 방문 선택
  | 'VISITOR_TYPE'       // 방문자 유형 선택
  | 'REQUIRED_DOCUMENTS' // 필요 서류 안내
  | 'LOCATION_INPUT'     // 위치 입력
  | 'LINE_TYPE'          // 회선 종류 선택 (가족결합 전용)
  | 'CONSENT'            // 개인정보 동의 (가족결합 전용)
  | 'FREE_CHAT'          // 자유 대화

// 업무 구분
const BUSINESS_TYPES = [
  { value: '신규가입', label: '📱 신규 가입', emoji: '📱' },
  { value: '요금제변경', label: '💳 요금제 변경', emoji: '💳' },
  { value: '해지', label: '📵 해지', emoji: '📵' },
  { value: '일시정지', label: '⏸️ 일시정지', emoji: '⏸️' },
  { value: 'T멤버십', label: '🎁 T멤버십', emoji: '🎁' },
  { value: '통화내역', label: '📊 통화내역 조회', emoji: '📊' },
  { value: '가족결합', label: '👨‍👩‍👧‍👦 가족결합', emoji: '👨‍👩‍👧‍👦' },
]

// 고객 유형 (knowledge base에서 사용하는 주요 유형)
const CUSTOMER_TYPES = [
  { value: '일반', label: '일반 (개인)', description: '일반 개인 고객' },
  { value: '법인', label: '법인', description: '법인 고객' },
  { value: '미성년자', label: '미성년자', description: '만 19세 미만' },
  { value: '외국인', label: '외국인', description: '외국인 고객' },
  { value: '국가유공자(복지)', label: '국가유공자', description: '복지 혜택' },
  { value: '장애인(복지)', label: '장애인', description: '복지 혜택' },
  { value: '기초생활수급자', label: '기초생활수급자', description: '복지 혜택' },
  { value: '차상위계층(복지)', label: '차상위계층', description: '복지 혜택' },
]

// 가족결합 전용 고객 유형
const FAMILY_COMBINE_CUSTOMER_TYPES = [
  { value: '개인', label: '개인', description: '개인 고객' },
  { value: '가족', label: '가족', description: '가족 단위' },
]

// 회선 종류 (가족결합 전용)
const LINE_TYPES = [
  { value: '핸드폰', label: '📱 핸드폰', description: '이동통신' },
  { value: '인터넷', label: '🌐 인터넷', description: '초고속 인터넷' },
  { value: 'IPTV', label: '📺 IPTV', description: 'TV 서비스' },
  { value: '기타', label: '📋 기타', description: '기타 서비스' },
]

// 개인정보 동의 옵션
const CONSENT_OPTIONS = [
  { value: 'agree', label: '동의합니다', description: '개인정보 수집 및 이용 동의' },
  { value: 'disagree', label: '동의하지 않습니다', description: '서비스 이용 불가' },
]

// 경로 선택
const PATH_OPTIONS = [
  { value: 'online', label: '온라인으로 진행 예정', description: 'T-World에서 계속하기' },
  { value: 'store', label: '대리점 방문 예정', description: '오프라인 방문' },
]

// 방문자 유형
const VISITOR_TYPES = [
  { value: '본인', label: '본인', description: '명의자 본인' },
  { value: '대리인', label: '대리인', description: '위임받은 대리인' },
  { value: '법정대리인', label: '법정대리인', description: '부모 등' },
]

// 필요 서류 정보 (업무 구분별 기본 서류)
const REQUIRED_DOCUMENTS: Record<string, Record<string, string[]>> = {
  '신규가입': {
    '본인': ['명의자 본인 신분증'],
    '대리인': ['명의자 인감증명서 또는 본인서명사실확인서', '위임장(인감날인 또는 본인서명)', '대리인 신분증'],
    '법정대리인': ['법정대리인 신분증', '법정대리인 입증서류(가족관계 확인서류)'],
  },
  '요금제변경': {
    '본인': ['명의자 본인 신분증'],
    '대리인': ['명의자 신분증', '대리인 신분증'],
    '법정대리인': ['미성년자 신분증', '법정대리인 신분증', '가족관계 확인서류', '법정대리인 동의서'],
  },
  '해지': {
    '본인': ['명의자 본인 신분증'],
    '대리인': ['명의자 본인 신분증', '대리인 본인 신분증', '(전화 확인 불가 시) 명의자 인감증명서 및 위임장'],
    '법정대리인': ['법정대리인 신분증', '법정대리인 입증서류'],
  },
  '일시정지': {
    '본인': ['명의자 본인 신분증'],
    '대리인': ['명의자 신분증', '대리인 신분증'],
    '법정대리인': ['법정대리인 신분증', '법정대리인 입증서류'],
  },
  'T멤버십': {
    '본인': ['명의자 본인 신분증'],
    '대리인': ['명의자 본인 신분증', '대리인 본인 신분증', '명의자와 전화통화'],
    '법정대리인': ['법정대리인 본인 신분증', '법정대리인 입증서류', '법정대리인과 전화통화'],
  },
  '통화내역': {
    '본인': ['명의자 본인 신분증', '업무 처리할 휴대폰(SMS 인증 필요)'],
    '대리인': ['명의자 신분증', '대리인 신분증', '위임장'],
    '법정대리인': ['법정대리인 신분증', '법정대리인 입증서류'],
  },
}

// 카테고리 한국어 매핑
const CATEGORY_LABELS: Record<string, string> = {
  'plan_change': '요금제 변경',
  'device_upgrade': '기기 변경',
  'billing_inquiry': '요금 문의',
  'technical_support': '기술 지원',
  'add_service': '부가서비스 가입',
  'cancel_service': '서비스 해지',
  'general_inquiry': '일반 문의',
}

export function ChatInterface({ sessionToken, conversationId, onConversationCreated }: ChatInterfaceProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [summary, setSummary] = useState<any>(null)
  const [predictions, setPredictions] = useState<any>(null)
  const initializedRef = useRef(false)

  // 대화 흐름 상태
  const [flowStep, setFlowStep] = useState<FlowStep>('BUSINESS_TYPE')
  const [selectedBusiness, setSelectedBusiness] = useState<string>('')
  const [selectedCustomerType, setSelectedCustomerType] = useState<string>('')
  const [selectedPath, setSelectedPath] = useState<string>('')
  const [selectedVisitorType, setSelectedVisitorType] = useState<string>('')
  const [selectedLineType, setSelectedLineType] = useState<string>('')

  // 완료 모달 상태
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)

  // 대리점 모달 상태
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false)
  const [stores, setStores] = useState<StoreInfo[]>([])
  const [searchLocation, setSearchLocation] = useState('')

  // 대리점 데이터 제공 동의 상태 ('agree', 'disagree', null)
  const [consentStatus, setConsentStatus] = useState<'agree' | 'disagree' | null>(null)

  useEffect(() => {
    if (!conversationId) {
      createConversation()
    } else {
      loadMessages()
    }
  }, [conversationId])

  const createConversation = async () => {
    try {
      const response = await fetch('/api/chat/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken }),
      })

      if (response.ok) {
        const data = await response.json()
        onConversationCreated(data.conversationId)
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  const loadMessages = async () => {
    if (!conversationId) return

    try {
      const response = await fetch(`/api/chat/messages?conversationId=${conversationId}`)
      if (response.ok) {
        const data = await response.json()

        // 빈 대화면 welcome 메시지 추가
        if (data.messages.length === 0) {
          const welcomeMessage: Message = {
            id: 'welcome-' + crypto.randomUUID(),
            role: 'assistant',
            content: '안녕하세요! T-world 상담 챗봇입니다.\n어떤 업무를 도와드릴까요?',
            created_at: new Date().toISOString(),
          }
          setMessages([welcomeMessage])
          setFlowStep('BUSINESS_TYPE')

          // Check for auto-send context
          if (!initializedRef.current) {
            initializedRef.current = true
            const context = localStorage.getItem('chatContext')
            if (context) {
              localStorage.removeItem('chatContext')
              setTimeout(() => {
                sendMessage(context)
                setFlowStep('FREE_CHAT')
              }, 500)
            }
          }
        } else {
          // 기존 메시지가 있으면 자유 대화 모드
          setMessages(data.messages)
          setFlowStep('FREE_CHAT')
        }
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const sendMessage = async (content: string) => {
    if (!conversationId || !content.trim()) return

    // 대화 종료 키워드 감지
    const endKeywords = [
      '대화종료', '대화 종료', '종료할게', '종료할게요', '종료', '끝', '끝낼게', '끝낼게요',
      '상담종료', '상담 종료', '그만', '그만할게', '나가기', '나갈게', '종료하기', '종료해',
      '종료해줘', '종료해주세요', '그만할래', '그만할래요', '끝내기', '끝내', '끝내줘',
      '상담끝', '채팅종료', '채팅 종료', '대화끝', '대화 끝', '이만', '이만 할게'
    ]
    const normalizedContent = content.trim().toLowerCase()
    const isEndKeyword = endKeywords.some(keyword => normalizedContent.includes(keyword.toLowerCase()))

    if (isEndKeyword) {
      setIsLoading(true)

      // 사용자 메시지 추가 (로컬)
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMessage])

      try {
        // 사용자 메시지를 DB에 저장하고 AI 응답 받기
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            message: content,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          // AI가 생성한 종료 메시지 표시
          const aiMessage: Message = {
            id: data.messageId,
            role: 'assistant',
            content: data.response,
            created_at: new Date().toISOString(),
          }
          setMessages((prev) => [...prev, aiMessage])
        } else {
          // API 실패 시 기본 메시지 표시
          const confirmMessage: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: '상담을 종료합니다. 잠시만 기다려주세요...',
            created_at: new Date().toISOString(),
          }
          setMessages((prev) => [...prev, confirmMessage])
        }

        // 대화 종료 처리
        await endConversation()
      } catch (error) {
        console.error('Failed to save message before ending:', error)
        // 에러가 발생해도 종료 진행
        const confirmMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '상담을 종료합니다...',
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, confirmMessage])

        await endConversation()
      }
      return
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      // LOCATION_INPUT 단계에서는 대리점 검색 API를 직접 호출
      if (flowStep === 'LOCATION_INPUT') {
        const storeResponse = await fetch('/api/stores/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location: content }),
        })

        if (storeResponse.ok) {
          const storeData = await storeResponse.json()

          if (storeData.stores && storeData.stores.length > 0) {
            // 대리점 검색 결과 모달 표시
            setStores(storeData.stores)
            setSearchLocation(content)
            setIsStoreModalOpen(true)

            // 성공 메시지 추가
            const assistantMessage: Message = {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: `${content} 근처 대리점을 찾았습니다. 총 ${storeData.stores.length}개의 매장이 있습니다.`,
              created_at: new Date().toISOString(),
            }
            setMessages((prev) => [...prev, assistantMessage])

            // 자유 대화로 전환
            setFlowStep('FREE_CHAT')
          } else {
            // 검색 결과 없음
            const assistantMessage: Message = {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: `${content} 근처에서 대리점을 찾지 못했습니다. 다른 지역명을 입력해주세요.`,
              created_at: new Date().toISOString(),
            }
            setMessages((prev) => [...prev, assistantMessage])
          }
        }
        setIsLoading(false)
        return
      }

      // 일반 채팅 메시지
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: content,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: Message = {
          id: data.messageId,
          role: 'assistant',
          content: data.response,
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, assistantMessage])

        // 대리점 검색 결과가 있으면 모달 표시
        if (data.stores && data.stores.length > 0) {
          setStores(data.stores)
          setSearchLocation(data.searchLocation || '해당 지역')
          setIsStoreModalOpen(true)
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.',
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const endConversation = async () => {
    if (!conversationId) {
      console.error('No conversation ID available')
      return
    }

    setIsLoading(true)

    try {
      console.log('[ChatInterface] Ending conversation:', conversationId)

      const response = await fetch('/api/chat/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[ChatInterface] Conversation ended successfully:', data)

        // summary가 있으면 설정, 없으면 기본값 설정
        if (data.summary) {
          setSummary(data.summary)
        } else {
          // summary 생성 실패 시 기본 summary 설정
          setSummary({
            summary: '대화가 종료되었습니다.',
            category: '일반 문의',
            keywords: [],
            sentiment: 'neutral'
          })
        }
        setPredictions(data.predictions)
      } else {
        const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류' }))
        console.error('[ChatInterface] Failed to end conversation:', errorData)

        // 에러가 발생해도 종료 화면 표시
        setSummary({
          summary: '대화가 종료되었습니다. 요약 생성 중 오류가 발생했습니다.',
          category: '일반 문의',
          keywords: [],
          sentiment: 'neutral'
        })
      }
    } catch (error) {
      console.error('[ChatInterface] Error ending conversation:', error)

      // 네트워크 에러가 발생해도 종료 화면 표시
      setSummary({
        summary: '대화가 종료되었습니다. 네트워크 오류로 인해 요약을 생성할 수 없습니다.',
        category: '일반 문의',
        keywords: [],
        sentiment: 'neutral'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 메시지를 DB에 저장하는 helper 함수
  const saveMessageToDB = async (role: 'user' | 'assistant', content: string) => {
    if (!conversationId) return

    try {
      await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          role,
          content
        })
      })
    } catch (error) {
      console.error('Failed to save message to DB:', error)
    }
  }

  // 업무 구분 선택 핸들러
  const handleBusinessTypeSelect = async (businessType: string) => {
    setSelectedBusiness(businessType)

    // 사용자 메시지 추가
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: businessType,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])

    // DB에 저장
    await saveMessageToDB('user', businessType)

    // 고객 유형 선택 단계로 이동
    const assistantContent = '고객 유형을 선택해주세요.'
    const assistantMessage: Message = {
      id: 'customer-type-' + crypto.randomUUID(),
      role: 'assistant',
      content: assistantContent,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, assistantMessage])

    // DB에 저장
    await saveMessageToDB('assistant', assistantContent)

    setFlowStep('CUSTOMER_TYPE')
  }

  // 고객 유형 선택 핸들러
  const handleCustomerTypeSelect = async (customerType: string) => {
    setSelectedCustomerType(customerType)

    // 사용자 메시지 추가
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: customerType,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])

    // DB에 저장
    await saveMessageToDB('user', customerType)

    // 경로 선택 단계로 이동
    const assistantContent = '진행 방법을 선택해주세요.'
    const assistantMessage: Message = {
      id: 'path-selection-' + crypto.randomUUID(),
      role: 'assistant',
      content: assistantContent,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, assistantMessage])

    // DB에 저장
    await saveMessageToDB('assistant', assistantContent)

    setFlowStep('PATH_SELECTION')
  }

  // 경로 선택 핸들러
  const handlePathSelect = async (path: string) => {
    setSelectedPath(path)

    // 사용자 메시지 추가
    const userContent = path === 'online' ? '온라인으로 진행 예정' : '대리점 방문 예정'
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userContent,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])

    // DB에 저장
    await saveMessageToDB('user', userContent)

    if (path === 'online') {
      // 가족결합 + 개인 + 온라인 → 회선 선택
      if (selectedBusiness === '가족결합' && selectedCustomerType === '개인') {
        const assistantContent = '어떤 회선을 고려중이신가요?'
        const assistantMessage: Message = {
          id: 'line-type-' + crypto.randomUUID(),
          role: 'assistant',
          content: assistantContent,
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, assistantMessage])
        await saveMessageToDB('assistant', assistantContent)
        setFlowStep('LINE_TYPE')
      } else {
        // 일반 온라인 진행 → 자유 대화
        const assistantContent = '무엇을 도와드릴까요? 궁금하신 점을 편하게 물어보세요.'
        const assistantMessage: Message = {
          id: 'free-chat-' + crypto.randomUUID(),
          role: 'assistant',
          content: assistantContent,
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, assistantMessage])
        await saveMessageToDB('assistant', assistantContent)
        setFlowStep('FREE_CHAT')
      }
    } else {
      // 가족결합 + 가족 + 대리점 → 필요 서류 바로 안내
      if (selectedBusiness === '가족결합' && selectedCustomerType === '가족') {
        const documents = [
          '가족관계증명서',
          '명의자 본인 신분증',
          '가족 구성원 신분증',
          '주민등록등본 (가족관계 확인용)',
        ]
        const documentList = documents.map((doc, idx) => `${idx + 1}. ${doc}`).join('\n')
        const assistantContent = `가족결합 신청을 위해 필요한 서류는 다음과 같습니다:\n\n${documentList}\n\n근처 대리점을 추천해드릴까요?`

        const assistantMessage: Message = {
          id: 'documents-' + crypto.randomUUID(),
          role: 'assistant',
          content: assistantContent,
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, assistantMessage])
        await saveMessageToDB('assistant', assistantContent)
        setFlowStep('REQUIRED_DOCUMENTS')
      } else {
        // 일반 대리점 방문 → 방문자 유형 선택
        const assistantContent = '대리점에 누가 방문하시나요?'
        const assistantMessage: Message = {
          id: 'visitor-type-' + crypto.randomUUID(),
          role: 'assistant',
          content: assistantContent,
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, assistantMessage])
        await saveMessageToDB('assistant', assistantContent)
        setFlowStep('VISITOR_TYPE')
      }
    }
  }

  // 회선 종류 선택 핸들러 (가족결합 전용)
  const handleLineTypeSelect = async (lineType: string) => {
    setSelectedLineType(lineType)

    // 사용자 메시지 추가
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: lineType,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])
    await saveMessageToDB('user', lineType)

    // 개인정보 동의 안내
    const assistantContent = '가족결합 신청을 위해 개인정보 수집 및 이용에 대한 동의가 필요합니다.\n\n[수집 항목]\n- 이름, 생년월일, 연락처\n- 회선 정보, 요금제 정보\n- 가족 구성원 정보\n\n[이용 목적]\n- 가족결합 할인 신청 및 관리\n- 요금 정산 및 청구\n\n동의하시겠습니까?'
    const assistantMessage: Message = {
      id: 'consent-' + crypto.randomUUID(),
      role: 'assistant',
      content: assistantContent,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, assistantMessage])
    await saveMessageToDB('assistant', assistantContent)
    setFlowStep('CONSENT')
  }

  // 개인정보 동의 핸들러
  const handleConsentSelect = async (consent: string) => {
    // 사용자 메시지 추가
    const userContent = consent === 'agree' ? '동의합니다' : '동의하지 않습니다'
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userContent,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])
    await saveMessageToDB('user', userContent)

    if (consent === 'agree') {
      // 동의 시 완료 모달 표시
      const assistantContent = '감사합니다. 고객님의 회선 정보가 파악되었습니다.'
      const assistantMessage: Message = {
        id: 'complete-' + crypto.randomUUID(),
        role: 'assistant',
        content: assistantContent,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      await saveMessageToDB('assistant', assistantContent)
      setIsCompleteModalOpen(true)
      setFlowStep('FREE_CHAT')
    } else {
      // 미동의 시
      const assistantContent = '개인정보 동의 없이는 가족결합 신청이 어렵습니다. 다른 문의사항이 있으시면 말씀해주세요.'
      const assistantMessage: Message = {
        id: 'disagree-' + crypto.randomUUID(),
        role: 'assistant',
        content: assistantContent,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      await saveMessageToDB('assistant', assistantContent)
      setFlowStep('FREE_CHAT')
    }
  }

  // 방문자 유형 선택 핸들러
  const handleVisitorTypeSelect = async (visitorType: string) => {
    setSelectedVisitorType(visitorType)

    // 사용자 메시지 추가
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: visitorType,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])
    await saveMessageToDB('user', visitorType)

    // 필요 서류 안내
    const documents = REQUIRED_DOCUMENTS[selectedBusiness]?.[visitorType] || []
    const documentList = documents.map((doc, idx) => `${idx + 1}. ${doc}`).join('\n')
    const assistantContent = `${selectedBusiness} 업무를 위해 ${visitorType} 방문 시 필요한 서류는 다음과 같습니다:\n\n${documentList}\n\n근처 대리점을 추천해드릴까요?`

    const assistantMessage: Message = {
      id: 'documents-' + crypto.randomUUID(),
      role: 'assistant',
      content: assistantContent,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, assistantMessage])
    await saveMessageToDB('assistant', assistantContent)
    setFlowStep('REQUIRED_DOCUMENTS')
  }

  // 대리점 추천 응답 핸들러
  const handleStoreRecommendation = async (wantsRecommendation: boolean) => {
    // 사용자 메시지 추가
    const userContent = wantsRecommendation ? '네, 추천해주세요' : '아니요, 괜찮습니다'
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userContent,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])
    await saveMessageToDB('user', userContent)

    if (wantsRecommendation) {
      const assistantContent = '어느 지역의 대리점을 찾으시나요? 지역명을 입력해주세요.\n(예: 강남구, 서초동, 판교역 등)'
      const assistantMessage: Message = {
        id: 'location-' + crypto.randomUUID(),
        role: 'assistant',
        content: assistantContent,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      await saveMessageToDB('assistant', assistantContent)
      setFlowStep('LOCATION_INPUT')
    } else {
      const assistantContent = '알겠습니다. 필요한 서류를 준비하셔서 방문해주시기 바랍니다. 다른 도움이 필요하시면 말씀해주세요!'
      const assistantMessage: Message = {
        id: 'end-' + crypto.randomUUID(),
        role: 'assistant',
        content: assistantContent,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      await saveMessageToDB('assistant', assistantContent)
      setFlowStep('FREE_CHAT')
    }
  }

  if (summary) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4" style={{ fontFamily: "'SK Mobius', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        <Card className="max-w-2xl w-full p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-6">상담이 종료되었습니다</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">요약</h3>
              <p className="text-gray-700 leading-relaxed">{summary.summary}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">카테고리</h3>
              <p className="text-gray-700">{summary.category}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">키워드</h3>
              <div className="flex gap-2 flex-wrap">
                {summary.keywords?.map((kw: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 bg-secondary rounded-md text-sm">
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* 대리점 데이터 제공 동의 섹션 */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="mb-4">
                <p className="text-sm mb-3" style={{ color: '#444', lineHeight: '1.6' }}>
                  원활한 상담을 위해 상담 내용이 대리점에 제공되는 것에 동의하시나요?
                </p>

                {/* 토글 버튼 */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setConsentStatus('agree')}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                      consentStatus === 'agree'
                        ? 'bg-[#3617CE] text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    ✓ 동의합니다
                  </button>
                  <button
                    onClick={() => setConsentStatus('disagree')}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                      consentStatus === 'disagree'
                        ? 'bg-gray-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    ✗ 동의하지 않습니다
                  </button>
                </div>

                {consentStatus === 'disagree' && (
                  <p className="text-sm text-gray-500 mt-2">
                    동의하지 않으시면 상담 내용이 대리점에 전달되지 않습니다.
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={async () => {
                // 동의한 경우에만 DB에 저장
                if (consentStatus === 'agree' && conversationId) {
                  try {
                    await fetch('/api/agency/consent', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        conversationId,
                        consent: true
                      })
                    })
                  } catch (error) {
                    console.error('Failed to save consent:', error)
                  }
                }
                router.push('/tworld')
              }}
              disabled={consentStatus === null}
              className="w-full mt-6 transition-all duration-300"
              style={{
                backgroundColor: consentStatus !== null ? '#3617CE' : '#3617CE',
                opacity: consentStatus !== null ? 1 : 0.5,
                cursor: consentStatus !== null ? 'pointer' : 'not-allowed',
                pointerEvents: consentStatus !== null ? 'auto' : 'none'
              }}
            >
              홈으로 돌아가기
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // 각 단계별 버튼 렌더링
  const renderFlowButtons = () => {
    if (isLoading) return null

    switch (flowStep) {
      case 'BUSINESS_TYPE':
        return (
          <div className="px-4 pb-2">
            <div className="grid grid-cols-2 gap-2 max-w-2xl mx-auto">
              {BUSINESS_TYPES.map((business) => (
                <Button
                  key={business.value}
                  onClick={() => handleBusinessTypeSelect(business.value)}
                  variant="outline"
                  className="h-auto py-3 border-dashed hover:bg-[#3617CE] hover:text-white hover:border-[#3617CE] transition-colors"
                >
                  <div className="text-center w-full">
                    <div className="text-base">{business.label}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )

      case 'CUSTOMER_TYPE':
        // 가족결합일 때는 개인/가족만 표시
        const customerTypes = selectedBusiness === '가족결합'
          ? FAMILY_COMBINE_CUSTOMER_TYPES
          : CUSTOMER_TYPES
        const gridCols = selectedBusiness === '가족결합' ? 'grid-cols-2' : 'grid-cols-4'

        return (
          <div className="px-4 pb-2">
            <div className={`grid ${gridCols} gap-2 max-w-4xl mx-auto`}>
              {customerTypes.map((type) => (
                <Button
                  key={type.value}
                  onClick={() => handleCustomerTypeSelect(type.value)}
                  variant="outline"
                  className="h-auto py-3 border-2 hover:bg-[#3617CE] hover:text-white hover:border-[#3617CE] transition-colors"
                >
                  <div className="text-center w-full">
                    <div className="text-sm font-semibold">{type.label}</div>
                    <div className="text-xs opacity-80 mt-1">{type.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )

      case 'PATH_SELECTION':
        return (
          <div className="px-4 pb-2">
            <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
              {PATH_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  onClick={() => handlePathSelect(option.value)}
                  variant="outline"
                  className="h-auto py-6 border-2 hover:bg-[#3617CE] hover:text-white hover:border-[#3617CE] transition-colors"
                >
                  <div className="text-center w-full">
                    <div className="text-lg font-semibold mb-1">{option.label}</div>
                    <div className="text-sm opacity-80">{option.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )

      case 'VISITOR_TYPE':
        return (
          <div className="px-4 pb-2">
            <div className="grid grid-cols-3 gap-2 max-w-2xl mx-auto">
              {VISITOR_TYPES.map((type) => (
                <Button
                  key={type.value}
                  onClick={() => handleVisitorTypeSelect(type.value)}
                  variant="outline"
                  className="h-auto py-4 border-2 hover:bg-[#3617CE] hover:text-white hover:border-[#3617CE] transition-colors"
                >
                  <div className="text-center w-full">
                    <div className="text-lg font-semibold">{type.label}</div>
                    <div className="text-xs opacity-80 mt-1">{type.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )

      case 'REQUIRED_DOCUMENTS':
        return (
          <div className="px-4 pb-2">
            <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
              <Button
                onClick={() => handleStoreRecommendation(true)}
                className="h-auto py-6 border-2 bg-[#3617CE] hover:bg-[#2a11a3] text-white transition-colors"
              >
                <div className="text-center w-full">
                  <div className="text-lg font-semibold">📍 네, 추천해주세요</div>
                </div>
              </Button>
              <Button
                onClick={() => handleStoreRecommendation(false)}
                variant="outline"
                className="h-auto py-6 border-2 hover:bg-gray-100 transition-colors"
              >
                <div className="text-center w-full">
                  <div className="text-lg font-semibold">아니요, 괜찮습니다</div>
                </div>
              </Button>
            </div>
          </div>
        )

      case 'LINE_TYPE':
        return (
          <div className="px-4 pb-2">
            <div className="grid grid-cols-2 gap-2 max-w-2xl mx-auto">
              {LINE_TYPES.map((type) => (
                <Button
                  key={type.value}
                  onClick={() => handleLineTypeSelect(type.value)}
                  variant="outline"
                  className="h-auto py-4 border-2 hover:bg-[#3617CE] hover:text-white hover:border-[#3617CE] transition-colors"
                >
                  <div className="text-center w-full">
                    <div className="text-lg font-semibold">{type.label}</div>
                    <div className="text-xs opacity-80 mt-1">{type.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )

      case 'CONSENT':
        return (
          <div className="px-4 pb-2">
            <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
              {CONSENT_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  onClick={() => handleConsentSelect(option.value)}
                  className={`h-auto py-6 border-2 transition-colors ${
                    option.value === 'agree'
                      ? 'bg-[#3617CE] hover:bg-[#2a11a3] text-white'
                      : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-300'
                  }`}
                >
                  <div className="text-center w-full">
                    <div className="text-lg font-semibold">{option.label}</div>
                    <div className="text-xs opacity-80 mt-1">{option.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )

      case 'LOCATION_INPUT':
      case 'FREE_CHAT':
        return null // 자유 입력 모드

      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div></div>
        <Button variant="outline" onClick={endConversation} disabled={isLoading}>
          대화 종료
        </Button>
      </div>

      <MessageList messages={messages} isLoading={isLoading} />

      {renderFlowButtons()}

      <MessageInput
        onSend={sendMessage}
        disabled={isLoading || (flowStep !== 'LOCATION_INPUT' && flowStep !== 'FREE_CHAT')}
      />

      {/* 대리점 검색 결과 모달 */}
      <StoreModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        stores={stores}
        location={searchLocation}
      />

      {/* 가족결합 완료 모달 */}
      {isCompleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-bold mb-2">회선 정보 파악 완료</h3>
              <p className="text-gray-600 mb-6">
                고객님의 회선 정보가 파악되었습니다.<br />
                결합 신청 페이지로 이동하겠습니다.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsCompleteModalOpen(false)}
                >
                  취소
                </Button>
                <Button
                  className="flex-1 bg-[#3617CE] hover:bg-[#2a11a3]"
                  onClick={() => {
                    window.open('/family-combine/apply', '_blank')
                    setIsCompleteModalOpen(false)
                  }}
                >
                  이동하기
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
