'use client'

import { useState, useEffect } from 'react'
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

  // 대리점 모달 상태
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false)
  const [stores, setStores] = useState<StoreInfo[]>([])
  const [searchLocation, setSearchLocation] = useState('')

  useEffect(() => {
    if (!conversationId) {
      createConversation()
    } else {
      loadMessages()
    }
  }, [conversationId])

  useEffect(() => {
    // Add welcome message when conversation starts with no messages
    if (conversationId && messages.length === 0 && !isLoading) {
      const welcomeMessage: Message = {
        id: 'welcome-' + crypto.randomUUID(),
        role: 'assistant',
        content: '안녕하세요! T-world 상담 챗봇입니다.\n어떤 업무를 도와드릴까요?',
        created_at: new Date().toISOString(),
      }
      setMessages([welcomeMessage])
    }
  }, [conversationId, messages.length, isLoading])

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
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const sendMessage = async (content: string) => {
    if (!conversationId || !content.trim()) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
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
    } finally {
      setIsLoading(false)
    }
  }

  const endConversation = async () => {
    if (!conversationId) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/chat/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      })

      if (response.ok) {
        const data = await response.json()
        setSummary(data.summary)
        setPredictions(data.predictions)
      }
    } catch (error) {
      console.error('Failed to end conversation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (summary) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-2xl w-full p-6">
          <h2 className="text-2xl font-bold mb-4">상담이 종료되었습니다</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">요약</h3>
              <p className="text-muted-foreground">{summary.summary}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">카테고리</h3>
              <p className="text-muted-foreground">{CATEGORY_LABELS[summary.category] || summary.category}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">키워드</h3>
              <div className="flex gap-2 flex-wrap">
                {summary.keywords?.map((kw: string, idx: number) => (
                  <span key={idx} className="px-2 py-1 bg-secondary rounded-md text-sm">
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            <Button
              onClick={() => {
                router.push('/tworld')
              }}
              className="w-full mt-4"
            >
              홈으로 돌아가기
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const showQuickButtons = messages.length <= 1 && !isLoading

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-bold">T-world 챗봇</h1>
        <Button variant="outline" onClick={endConversation} disabled={isLoading}>
          대화 종료
        </Button>
      </div>

      <MessageList messages={messages} isLoading={isLoading} />

      {showQuickButtons && (
        <div className="px-4 pb-2">
          <div className="grid grid-cols-2 gap-2 max-w-2xl mx-auto">
            <Button
              onClick={() => sendMessage('신규 가입')}
              variant="outline"
              className="h-auto py-3 border-dashed"
            >
              <div className="text-center w-full">
                <div className="text-base">📱 신규 가입</div>
              </div>
            </Button>
            <Button
              onClick={() => sendMessage('요금제 변경')}
              variant="outline"
              className="h-auto py-3 border-dashed"
            >
              <div className="text-center w-full">
                <div className="text-base">💳 요금제 변경</div>
              </div>
            </Button>
            <Button
              onClick={() => sendMessage('해지')}
              variant="outline"
              className="h-auto py-3 border-dashed"
            >
              <div className="text-center w-full">
                <div className="text-base">📵 해지</div>
              </div>
            </Button>
            <Button
              onClick={() => sendMessage('일시정지')}
              variant="outline"
              className="h-auto py-3 border-dashed"
            >
              <div className="text-center w-full">
                <div className="text-base">⏸️ 일시정지</div>
              </div>
            </Button>
            <Button
              onClick={() => sendMessage('T멤버십')}
              variant="outline"
              className="h-auto py-3 border-dashed"
            >
              <div className="text-center w-full">
                <div className="text-base">🎁 T멤버십</div>
              </div>
            </Button>
            <Button
              onClick={() => sendMessage('통화내역 조회')}
              variant="outline"
              className="h-auto py-3 border-dashed"
            >
              <div className="text-center w-full">
                <div className="text-base">📊 통화내역</div>
              </div>
            </Button>
          </div>
        </div>
      )}

      <MessageInput onSend={sendMessage} disabled={isLoading} />

      {/* 대리점 검색 결과 모달 */}
      <StoreModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        stores={stores}
        location={searchLocation}
      />
    </div>
  )
}
